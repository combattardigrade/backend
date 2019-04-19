const User = require('../models/sequelize').User
const Order = require('../models/sequelize').Order
const Admin = require('../models/sequelize').Admin
const sendJSONresponse = require('../../utils/index.js').sendJSONresponse
const sequelize = require('../models/sequelize').sequelize
const { Op } = require('sequelize');

module.exports.createOrder = function(req,res) {
    const userId = req.user.id
    const productId = req.body.productId

    if(!userId || !productId) {
        sendJSONresponse(res,422,{message:'Missing required arguments'})
        return
    }

    sequelize.transaction(async (t) => {
        // check if user exists
        let user = await User.findOne({where: {id: userId}, transaction: t})        
        if(!user) {
            sendJSONresponse(res,404,{message:'User does not exist'})
            return
        }

        // check if product exists
        let product = await Product.findOne({where: {id: productId}, transaction: t})

        sendJSONresponse(res,200,user)
        return
    })
        .catch((err) => {
            console.log(err)
            sendJSONresponse(res,404,{message: 'An error occured while creating order'})
            return
        })
    
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