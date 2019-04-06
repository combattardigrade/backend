const User = require('../models/sequelize').User
const Admin = require('../models/sequelize').Admin
const AuthRequest = require('../models/sequelize').AuthRequest
const sendJSONresponse = require('../../utils/index.js').sendJSONresponse
const sendActivationEmail = require('./email').sendActivationEmail
const sequelize = require('../models/sequelize').sequelize
const crypto = require('crypto')

module.exports.changeEmail = function (req, res) {
    const userId = req.user.id
    const email = req.body.email

    if (!userId || !email) {
        sendJSONresponse(res, 422, { message: 'Missing required arguments' })
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
                            sendJSONresponse(res, 404, { message: 'El email ya se encutra registrado' })
                            return
                        }
                        user.email = email
                        return user.save({ transaction: t })
                            .then(() => {
                                // create auth request
                                const hash = crypto.randomBytes(16).toString('hex')
                                const url = 'https://blits.net/api/auth/email/activate/' + hash
                                return AuthRequest.create({
                                    userId,
                                    action: 'email-auth',
                                    code: hash,
                                    used: '0'
                                }, { transaction: t })
                                    .then((authRequest) => {
                                        if(!authRequest) {
                                            sendJSONresponse(res,404,{message:'An error occurred while saving email'})
                                            return
                                        }
                                        // send email
                                        sendActivationEmail({ url: url, email: email })
                                        // send response
                                        sendJSONresponse(res, 200, { status: 'OK', message: 'Check your email to verify your account' })
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