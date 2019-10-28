const Scooter = require('../models/sequelize').Scooter
const ScooterLocation = require('../models/sequelize').ScooterLocation
const User = require('../models/sequelize').User
const Ride = require('../models/sequelize').Ride
const Balance = require('../models/sequelize').Balance
const Price = require('../models/sequelize').Price
const sendJSONresponse = require('../../utils/index.js').sendJSONresponse
const sequelize = require('../models/sequelize').sequelize
const { Op } = require('sequelize');
const crypto = require('crypto')
const moment = require('moment')
const BigNumber = require('bignumber.js')

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
        attributes: ['id','code','hash','battery','lat','lng','status','city',[sequelize.literal("6371 * acos(cos(radians(" + lat + ")) * cos(radians(lat)) * cos(radians(" + lng + ") - radians(lng)) + sin(radians(" + lat + ")) * sin(radians(lat)))"), 'distance']],  
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
    const scooterCode = req.query.scooterId
    const lat = req.query.lat
    const lng = req.query.lng
    const battery = req.query.battery

    // Check all the data was received
    if (!scooterCode || !lat || !lng) {
        sendJSONresponse(res, 422, { message: 'Missing arguments' })
        return
    }

    // Do not accept 0,0 coordinates
    if(parseFloat(lat) == 0 || parseFloat(lng) == 0) {
        sendJSONresponse(res,404,{message: 'Invalid location coordinates'})
        return
    }

    sequelize.transaction(async (t) => {
        let scooter = await Scooter.findOne({
            where: {
                code: scooterCode
            },
            transaction: t
        })

        // Stop if scooter code was not found
        if(!scooter) {
            sendJSONresponse(res,404,{message: 'Scooter not found'})
            return
        }
            
        let location = {
            type: 'Point',
            coordinates: [lat, lng]
        }
        scooter.lat = lat
        scooter.lng = lng
        // save battery if it was sent
        scooter.battery = battery
        
        // Update scooter last location
        await scooter.save({ transaction: t })
        
        // Insert location into scooter location history
        let savedLocation = await ScooterLocation.create({
            scooterId: scooter.id,
            lat,
            lng,
            location,
            battery,
        }, { transaction: t })        
        
        // check if scooter is on_ride and should continue unlocked
        if(scooter.status === 'on_ride') {
            // find ride
            let ride = await Ride.findOne({
                where: {
                    scooterId: scooter.id,
                    status: 'active'
                },
                include: [
                    {
                        model: User,
                        attributes: ['id','currency']
                    }
                ],
                transaction: t
            })
            
            // if the ride was not found but scooter is on_ride then lock scooter
            if(!ride) {
                res.status(200)
                res.send('<LOCK_SCOOTER>')
                return
            }      

            // find user balance
            let balance = await Balance.findOne({
                where: {
                    userId: ride.user.id,
                    currency: ride.user.currency
                },
                attributes: ['id','amount','currency'],
                transaction: t
            })

            // find prices
            let price = await Price.findOne({
                where: {
                    city: ride.city
                },
                attributes: ['id','minute'],
                transaction: t
            })
            
            let userBalance = BigNumber(balance.amount)
            let priceMinute = BigNumber(price.minute)
            
            // minutes on ride
            let time = BigNumber(moment().diff(ride.createdAt, 'minutes'))
            // ride total so far
            let total = time.multipliedBy(priceMinute)
            
            // check if user has enough balance to continue
            // check if balance is <= than ride total
            if(userBalance.isLessThanOrEqualTo(total)) {
                // send lock scooter command                 
                res.status(200)
                res.send('<LOCK_SCOOTER>')
                return
            }           
        }
        // scooter is not on_ride or it's on_ride and user has enough balance to continue
        // send OK response
        res.status(200)
        res.send('<OK>')
        return  
    })
        .catch((err) => {
            console.log(err)
            sendJSONresponse(res, 404, { err })
            return
        })
}