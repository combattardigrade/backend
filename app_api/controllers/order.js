const User = require('../models/sequelize').User
const Order = require('../models/sequelize').Order
const Product = require('../models/sequelize').Product
const Balance = require('../models/sequelize').Balance
const Transaction = require('../models/sequelize').Transaction
const Admin = require('../models/sequelize').Admin
const sendJSONresponse = require('../../utils/index.js').sendJSONresponse
const sequelize = require('../models/sequelize').sequelize
const { Op } = require('sequelize')
const crypto = require('crypto')
const moment = require('moment')
const validator = require('email-validator')
const mercadopago = require('mercadopago')
const request = require('request')
const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN
const BigNumber = require('bignumber.js')

module.exports.mpNotifications = function(req,res) {
    const topic = req.query.topic
    const id = req.query.id
    
    if(!topic || !id) {
        sendJSONresponse(res,404,{message:'Missing required params'})
        return
    }

    if(topic == 'payment') {
        processPayment(id)
    } else {
        res.sendStatus(200)
        return
    }

    function getMerchantOrder(orderId, next) {
        let options = {
            url: 'https://api.mercadolibre.com/merchant_orders/' + orderId +'?access_token=' + MP_ACCESS_TOKEN,
            method: 'GET'
        }

        request(options, function (err, response, body) {
            next(JSON.parse(body))
        })
    }

    function processPayment(paymentId) {
        let options = {
            url: 'https://api.mercadopago.com/v1/payments/' + paymentId + '?access_token=' + MP_ACCESS_TOKEN,
			method: 'GET',
        }

        request(options, function(err, response, body) {
            payment = JSON.parse(body)
            // check if approved
            if(payment.status === 'approved') {
                const orderId = payment.order.id
                const transactionAmount = parseFloat(payment.transaction_amount)
                // get merchant order
                getMerchantOrder(orderId, function(merchantOrder) {
                    const totalAmount = parseFloat(merchantOrder.total_amount)
                    // check if user paid correct amount
                    if(transactionAmount >= totalAmount) {
                        // Create transaction
                        // and set order as complete

                        var externalRef = payment.external_reference
                        externalRef = externalref.split('-')
                        externalRef = externalRef[1]

                        sequelize.transaction(async (t) => {
                            let order = await Order.findOne({
                                where: {
                                    id: externalRef
                                },
                                include: [
                                    {
                                        model: Product
                                    }
                                ],
                                transaction: t
                            })

                            // update order status
                            order.status = payment.status
                            await order.save({transaction: t})

                            // create transaction
                            let tx = await Transaction.create({
                                userId: order.userId,
                                operation: 'deposit',
                                total: order.total,
                                currency: order.currency,
                                amount: (total * 0.84),
                                tax: (total * 0.16)
                            }, { transaction: t })
                            
                            // find balance
                            let balance = await Balance.findOne({
                                where: {
                                    userId: order.userId,
                                    currency: order.currency
                                },
                                transaction: t
                            })
                            // update balance
                            balance.amount = BigNumber(balance.amount).plus(BigNumber(order.total))
                            await balance.save({transaction: t})

                            res.sendStatus(200)
                            return
                        })
                            .catch((err) => {
                                console.log(err)
                                return
                            })
                    }
                })
            } else {
                // update order status
                var externalRef = payment.external_reference
                externalRef = externalRef.split('-')
                externalRef = externalRef[1]

                Order.findOne({where: {id: externalRef}})
                    .then((order) => {
                        order.status = payment.status
                        order.save(() => {
                            res.sendStatus(200)
                            return
                        })
                    })
            }

        })
    }
}

module.exports.createOrder = function (req, res) {
    const userId = req.user.id
    const productId = req.body.productId
    const paymentMethod = req.body.paymentMethod
    const email = req.body.email
    const hash = crypto.randomBytes(16).toString('hex')
    const expirationDate = moment().add(2, 'days').toISOString(true)

    if (!userId || !productId || !paymentMethod) {
        sendJSONresponse(res, 422, { message: 'Missing required arguments' })
        return
    }

    sequelize.transaction(async (t) => {
        // check if user exists
        let user = await User.findOne({ where: { id: userId }, transaction: t })

        // check if user exists
        if (!user) {
            sendJSONresponse(res, 404, { message: 'User does not exist' })
            return
        }

        // check if set in db or post request
        if (!user.email && !email) {
            sendJSONresponse(res, 404, { message: 'Ingresa tu email para continuar' })
            return
        } else if (!user.email && email) {
            // check if email is valid
            if (!validator.validate(email)) {
                sendJSONresponse(res, 404, { message: 'Ingresa un email válido' })
                return
            }
            // insert email into db
            user.email = email
            await user.save({ transaction: t })
        }

        // check if product exists
        let product = await Product.findOne({ where: { id: productId, status: 'active' }, transaction: t })

        if (!product) {
            sendJSONresponse(res, 404, { message: 'Product not found' })
            return
        }

        // create new order
        let order = await Order.create({
            userId,
            productId: product.id,
            unitPrice: product.unitPrice,
            total: product.unitPrice,
            currency: product.currency,
            expirationDate,
            paymentMethod,
            hash,
        }, { transaction: t })

        if (paymentMethod === 'mercadopago') {

            let preference = await createMercadoPagoPreference({
                id: order.id,
                user: {
                    email: user.email,
                    countryCode: user.countryCode,
                    phone: user.phone,
                },
                product: {
                    id: product.id,
                    title: product.title,
                    description: product.description
                },
                unitPrice: order.unitPrice,
                quantity: 1,
                createdAt: order.createdAt,
                expirationDate: expirationDate
            })

            if (!preference) {
                sendJSONresponse(res, 404, { message: 'Error creating order' })
                return
            }

            // update db order with checkout url
            const checkoutUrl = preference.response.init_point
            order.checkoutUrl = checkoutUrl            
            await order.save({ transaction: t })

            // send response
            sendJSONresponse(res, 200, {status: 'OK', message: checkoutUrl})
            return
        }
    })
        .catch((err) => {
            console.log(err)
            sendJSONresponse(res, 404, { message: 'An error occured while creating order' })
            return
        })

}

function createMercadoPagoPreference(order) {
    // prepare preference
    const preference = {
        items: [
            {
                id: order.product.id,
                title: order.product.title,
                quantity: parseFloat(order.quantity),
                unit_price: parseFloat(order.unitPrice),
                description: order.product.description
            },
        ],
        payer: {
            email: order.user.email,
            phone: {
                area_code: order.user.countryCode,
                number: parseInt(order.user.phone)
            }
        },
        back_urls: {
            success: 'balance.html',
            failure: 'balance.html',
            pending: 'balance.html'
        },
        auto_return: 'approved',
        external_reference: 'order-' + order.id,
        expires: true,
        expiration_date_from: moment(order.createdAt).toISOString(true),
        expiration_date_to: moment(order.expirationDate).toISOString(true)
    }

    // configure mercadopago
    mercadopago.configure({ access_token: MP_ACCESS_TOKEN })

    // create preference
    return mercadopago.preferences.create(preference)
}

module.exports.getAllByPage = function (req, res) {
    const userId = req.user.id
    var page = req.params.page
    var type = req.params.type
    var limit = 50
    var offset = 0

    if (!userId || !page) {
        sendJSONresponse(res, 422, { message: 'All fields required' })
        return
    }

    sequelize.transaction((t) => {
        return Admin.findOne({
            where: {
                userId: userId
            },
            transaction: t
        })
            .then((admin) => {
                if (!admin) {
                    sendJSONresponse(res, 404, { message: 'User does not have enough privileges' })
                    return
                }

                if (type == 'completed') {
                    return Order.findAndCountAll({
                        where: {
                            status: 'approved'
                        },
                        transaction: t
                    })
                        .then((result) => {
                            var pages = Math.ceil(result.count / limit)
                            offset = limit * (page - 1)
                            return Order.findAll({
                                where: {
                                    status: 'approved'
                                },
                                include: [
                                    {
                                        model: Product
                                    },
                                    {
                                        model: User,
                                        attributes: ['email']
                                    }
                                ],
                                limit: limit,
                                offset: offset,
                                transaction: t
                            })
                                .then((orders) => {
                                    sendJSONresponse(res, 200, { result: orders, count: orders.length, pages: pages })
                                    return
                                })
                        })
                } else if (type === 'pending') {
                    return Order.findAndCountAll({
                        where: {
                            status: {
                                [Op.not]: 'approved'
                            }
                        },
                        transaction: t
                    })
                        .then((result) => {
                            var pages = Math.ceil(result.count / limit)
                            offset = limit * (page - 1)
                            return Order.findAll({
                                where: {
                                    status: {
                                        [Op.not]: 'approved'
                                    }
                                },
                                include: [
                                    {
                                        model: Product
                                    },
                                    {
                                        model: User,
                                        attribuetes: ['email']
                                    }
                                ],
                                limit: limit,
                                offset: offset,
                                transaction: t
                            })
                                .then((orders) => {
                                    sendJSONresponse(res, 200, { result: orders, count: orders.length, pages: pages })
                                    return
                                })
                        })
                }


            })
    })
        .catch((err) => {
            console.log(err)
            return
        })
}

module.exports.countByStatus = function (req, res) {
    const userId = req.user.id
    const status = req.params.status

    if (!userId || !status) {
        sendJSONresponse(res, 422, { message: 'All fields required' })
        return
    }
    sequelize.transaction((t) => {
        return Admin.findOne({
            where: {
                userId: userId
            },
            transaction: t
        })
            .then((admin) => {
                if (!admin) {
                    sendJSONresponse(res, 404, { message: 'User does not have enough privileges' })
                    return
                }

                if (status == 'all') {
                    return User.findAndCountAll({ transaction: t })
                        .then((result) => {
                            sendJSONresponse(res, 200, { count: result.count })
                            return
                        })
                } else if (status == 'completed') {
                    return User.findAndCountAll({
                        where: {
                            status: 'approved'
                        },
                        transaction: t
                    })
                        .then((result) => {
                            sendJSONresponse(res, 200, { count: result.count })
                            return
                        })
                } else if (status == 'pending') {
                    return User.findAndCountAll({
                        where: {
                            status: {
                                [Op.not]: 'approved'
                            }
                        },
                        transaction: t
                    })
                        .then((result) => {
                            sendJSONresponse(res, 200, { count: result.count })
                            return
                        })
                }
            })
    })
        .catch((err) => {
            console.log(err)
            return
        })
} 