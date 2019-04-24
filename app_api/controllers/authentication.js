const passport = require('passport')
const User = require('../models/sequelize').User
const AuthRequest = require('../models/sequelize').AuthRequest
const sequelize = require('../models/sequelize').sequelize
const moment = require('moment')
const sendJSONresponse = require('../../utils').sendJSONresponse
const Nexmo = require('nexmo')
const sms = new Nexmo({
    apiKey: process.env.NEXMO_API_KEY,
    apiSecret: process.env.NEXMO_API_SECRET
})
const { Op } = require('sequelize')
const crypto = require('crypto')
const validator = require('email-validator')

module.exports.activateEmail = (req, res) => {
    const hash = req.params.hash

    if (!hash) {
        sendJSONresponse(res, 422, { message: 'Missing required parameter' })
        return
    }

    sequelize.transaction((t) => {
        return AuthRequest.findOne({
            where: {
                code: hash,
                used: 0,
            },
            include: [
                {
                    model: User
                }
            ],
            transaction: t
        })
            .then((authRequest) => {
                if (!authRequest) {
                    sendJSONresponse(res, 200, { message: 'El link de activación ya fue usado' })
                    return
                }
                // mark authRequest as used
                authRequest.used = 1
                return authRequest.save({ transaction: t })
                    .then(() => {
                        // set emailk
                        // emailVerified =1
                        authRequest.user.email = authRequest.data
                        authRequest.user.emailVerified = 1
                        return authRequest.user.save({ transaction: t })
                            .then(() => {
                                sendJSONresponse(res, 200, { message: 'Email verificado correctamente' })
                                return
                            })
                    })
            })
    })
        .catch((err) => {
            console.log(err)
            sendJSONresponse(res, 404, { message: 'An error occurred while verifying email' })
            return
        })
}

module.exports.emailSignup = (req, res) => {
    const email = req.body.email
    const password = req.body.password

    if (!email || !password) {
        sendJSONresponse(res, 422, { message: 'Missing required parameter' })
        return
    } 

    if (!validator.validate(email)) {
        sendJSONresponse(res, 404, { message: 'Ingresa un email válido' })
        return
    }

    sequelize.transaction((t) => {
        return User.findOrCreate({
            where: {
                email: email
            },
            transaction: t
        })
            .spread(function (user, created) {
                if (!created) {
                    sendJSONresponse(res, 404, { message: 'El email ya se encuentra registrado' })
                    return
                }

                user.setPassword(password)
                const token = user.generateJwt()

                return user.save({ transaction: t })
                    .then(function () {
                        // activation request
                        return AuthRequest.create({
                            userId: user.id,
                            action: 'emailVerification',
                            code: crypto.randomBytes(16).toString('hex'),
                            used: 0
                        }, { transaction: t })
                            .then(function (request) {
                                if (!request) {
                                    sendJSONresponse(res, 404, { message: 'Error creating account' })
                                    return
                                }
                                sendJSONresponse(res, 200, { token: token })
                                let url = 'http://localhost:3000/api/emailVerification/' + request.code
                                /*emailController.sendActivationEmail({ email: email, url: url }, function () {
                                    return
                                })*/
                                return
                            })
                    })
            })
    })
        .catch((err) => {
            console.log(err)
            sendJSONresponse(res, 404, { message: 'Error creating account' })
            return
        })
}

module.exports.emailLogin = (req, res) => {
    const email = req.body.email
    const password = req.body.password

    if (!email || !password) {
        sendJSONresponse(res, 422, { message: 'Missing required parameter' })
        return
    }

    passport.authenticate('local', function (err, token, info) {
        if (err) {
            sendJSONresponse(res, 404, err)
            return
        }
        if (token) {
            sendJSONresponse(res, 200, { token: token })
            return
        } else {
            sendJSONresponse(res, 401, info)
            return
        }
    })(req, res)
}

module.exports.confirmCode = (req, res) => {
    const phone = req.body.phone
    const code = req.body.code

    if (!phone || !code) {
        sendJSONresponse(res, 422, { message: 'Missing required parameter' })
        return
    }

    sequelize.transaction((t) => {
        return User.findOne({
            where: {
                phone: phone
            },
            transaction: t
        })
            .then((user) => {
                if (!user) {
                    sendJSONresponse(res, 404, { message: 'User does not exist' })
                    return
                }

                return AuthRequest.findOne({
                    where: {
                        userId: user.id,
                        code: code,
                        used: 0,
                        createdAt: {
                            [Op.gte]: moment().subtract(5, 'minutes')
                        }
                    },
                    transaction: t
                })
                    .then((request) => {
                        if (!request) {
                            sendJSONresponse(res, 404, { message: 'El código es incorrecto o expiró. Intentalo nuevamente' })
                            return
                        }
                        // set auth request as used
                        request.used = 1
                        return request.save({ transaction: t })
                            .then(() => {
                                // update account level
                                user.phoneVerified = 1
                                return user.save({ transaction: t })
                                    .then(() => {
                                        // generate JWT token
                                        const token = user.generateJwt()
                                        sendJSONresponse(res, 200, { token })
                                        return
                                    })
                            })
                    })
            })
    })

}

module.exports.confirmCodePhoneChange = (req, res) => {
    const userId = req.user.id
    const code = req.body.code
   
    if (!userId || !code) {
        sendJSONresponse(res, 422, { message: 'Missing required parameter' })
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
                return AuthRequest.findOne({
                    where: {
                        userId,
                        code,
                        used: 0,
                        createdAt: {
                            [Op.gte]: moment().subtract(10, 'minutes')
                        }
                    },
                    transaction: t
                })
                    .then((request) => {
                        if (!request) {
                            sendJSONresponse(res, 404, { message: 'Invalid request' })
                            return
                        }
                        // set auth request as used
                        request.used = 1
                        return request.save({ transaction: t })
                            .then(() => {
                                // change phone and country code
                                var data = request.data
                                data = data.split('-')
                                const countryCode = data[0]
                                const phone = data[1]
                                user.phone = phone
                                user.countryCode = countryCode
                                // update account level
                                user.phoneVerified = 1
                                return user.save({ transaction: t })
                                    .then(() => {
                                        sendJSONresponse(res, 200, { message: 'Número telefónico cambiado correctamente' })
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

module.exports.resendPhoneCode = (req, res) => {
    const phone = req.body.phone

    if (!phone) {
        sendJSONresponse(res, 422, { message: 'Missing required parameter' })
        return
    }


    sequelize.transaction((t) => {
        return User.findOne({
            where: {
                phone: phone
            },
            transaction: t
        })
            .then((user) => {
                return AuthRequest.findOne({
                    where: {
                        userId: user.id,
                        createdAt: {
                            [Op.gte]: moment().subtract(5, 'minutes')
                        }
                    },
                    limit: 1,
                    transaction: t
                })
                    .then((authRequest) => {
                        if (!authRequest) {
                            sendJSONresponse(res, 404, { message: 'Authentication code expired' })
                            return
                        }

                        if (authRequest.updatedAt >= moment().subtract(1, 'minutes')) {
                            sendJSONresponse(res, 404, { message: 'Espera 1 minuto antes de reenviar el código de verificación' })
                            return
                        }
                        // send code through sms                            
                        sms.message.sendSms('Blits', user.countryCode + user.phone, 'Tu codigo para Blits es: ' + authRequest.code)

                        sendJSONresponse(res, 200, { user })
                        return
                    })
            })

    })
        .catch((err) => {
            console.log(err)
        })

    
}

module.exports.phone = (req, res) => {
    const phone = req.body.phone
    const countryCode = req.body.countryCode
    const code = Math.floor(100000 + Math.random() * 900000)

    if (!phone || !countryCode) {
        sendJSONresponse(res, 422, { message: 'Missing required parameter' })
        return
    }

    sequelize.transaction((t) => {
        return User.findOrCreate({
            where: {
                phone: phone
            },
            defaults: {
                phone: phone,
                countryCode: countryCode
            },
            transaction: t
        })
            .spread((user, created) => {


                return AuthRequest.findOne({
                    where: {
                        userId: user.id,
                        action: 'sms-auth',
                        used: 0,
                        createdAt: {
                            [Op.gte]: moment().subtract(5, 'minutes').toDate()
                        }
                    },
                    transaction: t
                })
                    .then((request) => {
                        // if authRequest wasn't found
                        if (!request) {
                            // create authRequest
                            return AuthRequest.create({
                                userId: user.id,
                                action: 'sms-auth',
                                used: 0,
                                code: code
                            }, { transaction: t })
                                .then((newRequest) => {
                                    // send code through sms
                                    sms.message.sendSms('Blits', countryCode + phone, 'Tu codigo para Blits es: ' + code)
                                    // send resonse
                                    sendJSONresponse(res, 200, { message: 'Ingresa el código de verificación para continuar' })
                                    return
                                })
                        }

                        // authRequest found so don't resend the code here
                        // send 200 resonse
                        sendJSONresponse(res, 200, { message: 'Ingresa el código de verificación para continuar' })
                        return
                    })

            })
    })
        .catch((err) => {
            console.log(err)
            sendJSONresponse(res, 404, { error: err })
            return
        })
}