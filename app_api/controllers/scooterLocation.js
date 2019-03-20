const Scooter = require('../models/sequelize').Scooter
const ScooterLocation = require('../models/sequelize').ScooterLocation
const sendJSONresponse = require('../../utils/index.js')
const sequelize = require('../models/sequelize').sequelize
const { Op } = require('sequelize');
const crypto = require('crypto')
const moment = require('moment')

module.exports.getScootersNearLocation = function (req, res) {
    const userId = req.user.id
    const lat = parseFloat(req.query.lat)
    const lng = parseFloat(req.query.lng)

    if (!userId || !lat || !lng) {
        sendJSONresponse(res, 422, { message: 'Missing required parameters' })
        return
    }

    // get active scooters 

    // neares points and distance in km
    // haversine formula
    // https://en.wikipedia.org/wiki/Haversine_formula
    // haversine formula implementation
    // https://stackoverflow.com/questions/44012932/sequelize-geospatial-query-find-n-closest-points-to-a-location
    // haversine formula units
    // https://stackoverflow.com/questions/25711895/the-result-by-haversine-formula-is-meter-o-kmeter

    Scooter.findAll({     
        attributes: ['id','hash','battery','lat','lng','status','city',[sequelize.literal("6371 * acos(cos(radians(" + lat + ")) * cos(radians(lat)) * cos(radians(" + lng + ") - radians(lng)) + sin(radians(" + lat + ")) * sin(radians(lat)))"), 'distance']],  
        where: {
            status: 'available',
        },
        /*order: sequelize.col('distance'),       */
        limit: 50
    })
        .then((scooters) => {
            sendJSONresponse(res, 200, { scooters })
            return
        })
        .catch(err => {
            console.log(err)
            return
        })    
}


module.exports.saveScooterLocation = function (req, res) {
    const scooterHash = req.body.scooterHash
    const lat = req.body.lat
    const lng = req.body.lng

    if (!scooterHash || !lat || !lng) {
        sendJSONresponse(res, 422, { message: 'Missing arguments' })
        return
    }
    sequelize.transaction((t) => {
        return Scooter.findOne({
            where: {
                hash: scooterHash
            },

            transaction: t
        })
            .then((scooter) => {
                let location = {
                    type: 'Point',
                    coordinates: [lat, lng]
                }
                scooter.lat = lat
                scooter.lng = lng
                return scooter.save({ transaction: t })
                    .then(() => {
                        return ScooterLocation.create({
                            scooterId: scooter.id,
                            lat,
                            lng,
                            location,
                        }, { transaction: t })
                            .then((location) => {
                                // set lastLocation
                                sendJSONresponse(res, 200, { location })
                                return
                            })
                    })
            })
    })
        .catch((err) => {
            console.log(err)
            sendJSONresponse(res, 404, { err })
            return
        })
}