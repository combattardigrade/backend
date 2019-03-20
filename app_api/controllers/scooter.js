const Scooter = require('../models/sequelize').Scooter
const Admin = require('../models/sequelize').Admin
const Location = require('../models/sequelize').Location
const sendJSONresponse = require('../../utils/index.js')
const sequelize = require('../models/sequelize').sequelize
const { Op } = require('sequelize');
const crypto = require('crypto')
const moment = require('moment')


module.exports.getNearLocation = function (req,res) {
    const userId = req.user.id
    const lat = parseFloat(req.query.lat)
    const lng = parseFloat(req.query.lng)
    

    if(!userId || !lat || !lng) {
        sendJSONresponse(res,422,{message:'Missing required parameters'})
        return
    } 
    // get Model attribuets
    var attributes = Object.keys(Location.attributes)    
    // set location
    var location = sequelize.literal(`ST_GeomFromText('POINT(${lng} ${lat})')`);
    // distantce
    var distance = sequelize.fn('ST_Distance_Sphere', sequelize.literal('location'), location);
    // insert distance into Model attributes
    attributes.push([distance,'distance']);
    
    Location.findAll({
        attributes: attributes,
        order: [['distance','ASC',['createdAt','DESC']]],
        where: {
            distance: {
                [Op.lte]: 10000
            }, 
        },
        logging: console.log
    })
    .then((instance) => {
        sendJSONresponse(res,200,{instance})
        return 
    })
    //sendJSONresponse(res,200,{location})
    //return

}

module.exports.create = function (req, res) {
    const userId = req.user.id
    const code = req.body.code
    const batch = req.body.batch
    const hash = crypto.randomBytes(16).toString('hex')
    const birthday = moment(req.body.birthday, 'DD-MM-YYYY').toDate();
    const battery = req.body.battery
    const city = req.body.city
    const status = req.body.status

    console.log(birthday)
    if (!code || !batch || !hash || !birthday || !battery || !city || !status) {
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
                        battery,
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