const Scooter = require('../models/sequelize').Scooter
const Admin = require('../models/sequelize').Admin
const sendJSONresponse = require('../../utils/index.js')
const sequelize = require('../models/sequelize').sequelize

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