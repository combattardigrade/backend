const User = require('../models/sequelize').User
const Admin = require('../models/sequelize').Admin
const Balance = require('../models/sequelize').Balance
const AuthRequest = require('../models/sequelize').AuthRequest
const sendJSONresponse = require('../../utils/index.js').sendJSONresponse
const validateEmail = require('../../utils/index.js').validateEmail
const sendActivationEmail = require('./email').sendActivationEmail
const sequelize = require('../models/sequelize').sequelize
const { Op } = require('sequelize')
const crypto = require('crypto')
const moment = require('moment')
const Nexmo = require('nexmo')
const sms = new Nexmo({
    apiKey: process.env.NEXMO_API_KEY,
    apiSecret: process.env.NEXMO_API_SECRET
})


module.exports.getData = function(req,res) {
    const userId = req.user.id
    
    if (!userId) {
        sendJSONresponse(res, 422, { message: 'Missing required arguments' })
        return
    }

    sequelize.transaction((t) => {
        return User.findOne({
            where: {
                id: userId
            },
            attributes: ['email', 'phone', 'countryCode', 'firstName', 'lastName', 'country', 'currency','createdAt'],
            /*include: [
                {
                    model: Balance,
                    where: {
                        currency: sequelize.literal('User.currency')
                    },
                    attributes: ['id','amount','currency','updatedAt', 'createdAt']
                }
            ],*/
            transaction: t
        })
            .then((user) => {
                if(!user) {
                    sendJSONresponse(res,404,{message:'User not found'})
                    return
                }
                return Balance.findOne({
                    where: {
                        currency: user.currency
                    },
                    attributes: ['id','amount','currency','updatedAt', 'createdAt'],
                    transaction:  t
                })
                    .then((balance) => {
                        let data = JSON.parse(JSON.stringify(user))
                        let balances = JSON.parse(JSON.stringify(balance))
                        data.balances = []
                        data.balances.push(balance)
                        sendJSONresponse(res,200,data)
                        return
                    })
                
            })
    })
        .catch((err) => {
            console.log(err)
            sendJSONresponse(res, 404, { message: 'An error occured while trying to fetch user data' })
            return        
        })
}

module.exports.changePhone = function (req, res) {
    const userId = req.user.id
    const phone = req.body.phone
    const countryCode = req.body.countryCode

    if (!userId || !phone || !countryCode) {
        sendJSONresponse(res, 422, { message: 'Missing required arguments' })
        return
    }

    sequelize.transaction((t) => {
        return User.findOne({
            where: {
                id: userId
            },
            transaction: t
        })
            .then((user) => {
                if (!user) {
                    sendJSONresponse(res, 404, { message: 'User does not exist' })
                    return
                }

                // check if the phone number is already in use
                return User.findOne({
                    where: {
                        phone: phone
                    },
                    transaction: t
                })
                    .then((userPhone) => {
                        if (userPhone) {
                            sendJSONresponse(res, 404, { message: 'El número telefónico ya se encuentra registrado' })
                            return
                        }
                        // limit auth requests
                        return AuthRequest.findOne({
                            where: {
                                userId,
                                action: 'sms-auth',
                                used: 0,
                                createdAt: {
                                    [Op.gte]: moment().subtract(1, 'minutes')
                                }
                            },
                            transaction: t
                        })
                            .then((pastRequest) => {
                                // only allow requests every 2 minutes                                
                                if (pastRequest) {
                                    sendJSONresponse(res, 404, { message: 'Espera 2 min para solicitar el código de verificación nuevamente' })
                                    return
                                }

                                const code = Math.floor(100000 + Math.random() * 900000)                                
                                const data = countryCode + '-' + phone
                                // create authRequest
                                return AuthRequest.create({
                                    userId,
                                    action: 'sms-auth',
                                    used: 0,
                                    code: code,
                                    data: data
                                }, { transaction: t })
                                    .then((newRequest) => {
                                        // send code through sms
                                        sms.message.sendSms('Blits', countryCode + phone, 'Tu codigo para Blits es: ' + code)
                                        // send resonse
                                        sendJSONresponse(res, 200, { message: 'Ingresa el código de verificación para continuar' })
                                        return
                                    })
                            })
                    })
            })
    })
        .catch((err) => {
            console.log(err)
            sendJSONresponse(res, 404, { message: 'An error occured while trying to change name' })
            return
        })
}

module.exports.changeEmail = function (req, res) {
    const userId = req.user.id
    const email = req.body.email

    if (!userId || !email) {
        sendJSONresponse(res, 422, { message: 'Missing required arguments' })
        return
    }

    if (!validateEmail(email)) {
        sendJSONresponse(res, 422, { message: 'Ingresa un email válido' })
        return
    }

    sequelize.transaction((t) => {
        return User.findOne({
            where: {
                id: userId
            },
            attributes: ['id', 'email'],
            transaction: t
        })
            .then((user) => {
                if (!user) {
                    sendJSONresponse(res, 404, { message: 'User does not exist' })
                    return
                }
                // check if email is already in use
                return User.findOne({
                    where: {
                        email: email,
                        emailVerified: 1
                    },
                    transaction: t
                })
                    .then((userEmail) => {
                        if (userEmail) {
                            sendJSONresponse(res, 404, { message: 'El email ya se encuentra registrado' })
                            return
                        }
                        // limit auth requests
                        return AuthRequest.findOne({
                            where: {
                                userId,
                                action: 'email-auth',
                                used: 0,
                                createdAt: {
                                    [Op.gte]: moment().subtract(2, 'minutes')
                                }
                            },
                            transaction: t
                        })
                            .then((pastRequest) => {
                                // only allow requests every 2 minutes                                
                                if (pastRequest) {
                                    sendJSONresponse(res, 404, { message: 'Revisa tu email para activar la cuenta o espera 2 min para solicitar la verificación nuevamente' })
                                    return
                                }

                                // create auth request
                                const hash = crypto.randomBytes(16).toString('hex')
                                const url = 'https://blits.net/api/auth/email/activate/' + hash
                                return AuthRequest.create({
                                    userId,
                                    action: 'email-auth',
                                    code: hash,
                                    data: email,
                                    used: '0'
                                }, { transaction: t })
                                    .then((authRequest) => {
                                        if (!authRequest) {
                                            sendJSONresponse(res, 404, { message: 'An error occurred while saving email' })
                                            return
                                        }
                                        // send email
                                        sendActivationEmail({ url: url, email: email })
                                        // send response
                                        sendJSONresponse(res, 200, { status: 'OK', message: 'Revisa tu email para verificar la cuenta' })
                                        return
                                    })
                            })
                    })
            })
    })
        .catch((err) => {
            console.log(err)
            sendJSONresponse(res, 404, { message: 'An error occured while trying to change name' })
            return
        })
}

module.exports.changeName = function (req, res) {
    const userId = req.user.id
    const firstName = req.body.firstName
    const lastName = req.body.lastName

    console.log(lastName)
    if (!userId || !firstName || !lastName) {
        sendJSONresponse(res, 422, { message: 'Missing required arguments' })
        return
    }
    console.log('test')
    sequelize.transaction((t) => {
        return User.findOne({
            where: {
                id: userId
            },
            attributes: ['id', 'firstName', 'lastName'],
            transaction: t
        })
            .then((user) => {
                if (!user) {
                    sendJSONresponse(res, 404, { message: 'User does not exist' })
                    return
                }
                user.firstName = firstName
                user.lastName = lastName
                return user.save({ transaction: t })
                    .then(() => {
                        sendJSONresponse(res, 200, { status: 'OK', message: 'Name saved correctly' })
                        return
                    })
            })
    })
        .catch((err) => {
            console.log(err)
            sendJSONresponse(res, 404, { message: 'An error occured while trying to change name' })
            return
        })
}

module.exports.getAllByPage = function (req, res) {
    const userId = req.user.id
    var page = req.params.page
    var limit = 50
    var offset = 0

    if (!userId || !page || page < 0) {
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

                return User.findAndCountAll({
                    transaction: t
                })
                    .then((result) => {
                        var pages = Math.ceil(result.count / limit)
                        offset = limit * (page - 1)
                        return User.findAll({
                            limit: limit,
                            offset: offset,
                            transaction: t
                        })
                            .then((users) => {
                                sendJSONresponse(res, 200, { result: users, count: result.count, pages: pages })
                                return
                            })
                    })

            })
    })
        .catch((err) => {
            console.log(err)
            return
        })
}

module.exports.countAll = function (req, res) {

    const userId = req.user.id

    if (!userId) {
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

                return User.findAndCountAll({ transaction: t })
                    .then((result) => {
                        sendJSONresponse(res, 200, { count: result.count })
                        return
                    })
            })
    })
        .catch((err) => {
            console.log(err)
            return
        })
} 