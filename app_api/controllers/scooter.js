const Scooter = require('../models/sequelize').Scooter
const Admin = require('../models/sequelize').Admin
const Location = require('../models/sequelize').Location
const sendJSONresponse = require('../../utils/index.js').sendJSONresponse
const sequelize = require('../models/sequelize').sequelize
const { Op } = require('sequelize')
const crypto = require('crypto')
const moment = require('moment')

module.exports.getActivationData = function(req,res) {
    const userId = req.user.id
    const code = req.body.code

    if(!userId || !code) {
        sendJSONresponse(res,422,{message:'Missing required arguments'})
        return
    }

    Scooter.findOne({
        where: {
            code,
        },
        attributes: ['id','code','hash','bluetoothMAC','city','battery','status']
    })
    .then((scooter) => {
        if(!scooter) {
            sendJSONresponse(res,404,{message:'Scooter not found'})
            return
        }
        sendJSONresponse(res,200,{ scooter })
        return
    })
    .catch((err) => {
        console.log(err)
        sendJSONresponse(res,404,{message:'Error fetching scooter information'})
        return
    })
}

module.exports.create = function (req, res) {
    const userId = req.user.id
    const code = req.body.code
    const batch = req.body.batch
    const hash = crypto.randomBytes(16).toString('hex')
    const birthday = moment(req.body.birthday, 'DD-MM-YYYY').toDate();   
    const city = req.body.city
    const status = req.body.status

    
    if (!code || !batch || !hash || !birthday || !city || !status) {
        sendJSONresponse(res, 422, { message: 'All fields required' })
        return
    }
    sequelize.transaction((t) => {
        return Admin.findOne({
            where: {
                userId: userId,
                level: {
                    [Op.gte]: 1
                }
            },
            transaction: t
        })
            .then((admin) => {
                if (!admin) {
                    sendJSONresponse(res, 404, { message: 'User does not have enough privileges' })
                    return
                }
                return Scooter.findOrCreate({
                    where: {
                        code: code
                    },
                    defaults: {
                        code,
                        batch,
                        hash,
                        birthday,                        
                        city,
                        status
                    },
                    transaction: t
                })
                .spread((scooter, created) => {
                    if(!created) {
                        sendJSONresponse(res, 404, {message: 'Scooter already exists'})
                        return
                    }
                    sendJSONresponse(res,200,{scooter})
                    return
                })
            })
    })
    .catch((err) => {
        console.log(err)
        sendJSONresponse(res,404,{message:'Error creating new scooter'})
        return
    })
}

module.exports.getAllByPage = function (req, res) {
    const userId = req.user.id
    const status = req.params.status
    var page = req.params.page
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
                if (status === 'all') {
                    return Scooter.findAndCountAll({ transaction: t })
                        .then((result) => {
                            var pages = Math.ceil(result.count / limit)
                            offset = limit * (page - 1)
                            return Scooter.findAll({
                                limit: limit,
                                offset: offset,
                                transaction: t
                            })
                                .then((scooters) => {
                                    sendJSONresponse(res, 200, { result: scooters, count: result.count, pages: pages })
                                    return
                                })
                        })
                } else {
                    return Scooter.findAndCountAll({
                        where: {
                            status: status
                        },
                        transaction: t
                    })
                        .then((result) => {
                            var pages = Math.ceil(result.count / limit)
                            offset = limit * (page - 1)
                            return Scooter.findAll({
                                where: {
                                    status: status
                                },
                                limit: limit,
                                offset: offset,
                                transaction: t
                            })
                                .then((scooters) => {
                                    sendJSONresponse(res, 200, { result: scooters, count: result.count, pages: pages })
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

                if (status === 'all') {
                    return Scooter.findAndCountAll({ transaction: t })
                        .then((result) => {
                            sendJSONresponse(res, 200, { count: result.count })
                            return
                        })
                } else {
                    return Scooter.findAndCountAll({
                        where: {
                            status: status
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