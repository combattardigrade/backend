const User = require('../models/sequelize').User
const Balance = require('../models/sequelize').Balance
const Scooter = require('../models/sequelize').Scooter
const ScooterLocation = require('../models/sequelize').ScooterLocation
const UserLocation = require('../models/sequelize').UserLocation
const Price = require('../models/sequelize').Price
const Ride = require('../models/sequelize').Ride
const Transaction = require('../models/sequelize').Transaction
const { Op } = require('sequelize')

const sequelize = require('../models/sequelize').sequelize
const sendJSONresponse = require('../../utils/index.js').sendJSONresponse
const printMoney = require('../../utils/index.js').printMoney
const calculateDistance = require('../../utils/distance').calculateDistance
const moment = require('moment')
const BigNumber = require('bignumber.js')


module.exports.getRideHistory = function(req,res) {
    const userId = req.user.id

    if(!userId) {
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
            if(!user) {
                sendJSONresponse(res,404,{message: 'User does not exist'})
                return
            }
            return Ride.findAll({
                where: {
                    userId,
                    status: 'completed'
                }, 
                limit: 10,
                order: [['createdAt', 'DESC']],
                include: [
                    {
                        model: Transaction,
                        
                        attributes: [       
                            'id', 'total'
                        ],
                        
                    }
                ],   
                         
                transaction: t
            })
            .then((rides) => {
                if(!rides || rides.length === 0) {
                    sendJSONresponse(res,404,{message:'No rides found'})
                    return
                }      
                rides = JSON.parse(JSON.stringify(rides))
                
                rides = rides.map((ride) => {
                    let totalsArray = ride.transactions.map((tx) => tx.total)
                    ride.totalCost = totalsArray.reduce((total, amount) =>{
                        return BigNumber(total).plus(BigNumber(amount))                     
                    })                                       
                    return ride
                })              
                
                sendJSONresponse(res,200,rides)
                return
            })
        })
    })
    .catch((err) => {
        sendJSONresponse(res,404,{message: 'An error occured while fetching ride history'})
        console.log(err)
        return
    })
}

module.exports.checkRideStatus = function(req, res) {
    const userId = req.user.id

    if(!userId) {
        sendJSONresponse(res, 422, {message:'Missing required arguments'})
        return
    }

    sequelize.transaction(async (t) => {
        let user = await User.findOne({where: {id: userId}, transaction: t})

        if(!user) {
            sendJSONresponse(res,404,{message:'User does not exist'})
            return
        }

        let ride = await Ride.findOne({where: {status: 'active'}, transaction: t})

        if(!ride) {
            sendJSONresponse(res,404,{message:'No active rides found'})
            return
        }

        let balance = await Balance.findOne({
            where: {userId, currency: user.currency},
            attributes: ['id','amount','currency'], 
            transaction: t })

        let price = await Price.findOne({
            where: {city: ride.city},
            attributes: ['id','minute'],
            transaction:  t
        })
        
        // prepare data
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
            sendJSONresponse(res, 200, {status: 'STOP_RIDE', message: 'El viaje se ha detenido ya que tu saldo se ha agotado. Recarga tu balance para continuar'})
            return
        }  

        sendJSONresponse(res, 200, {status: 'OK', message: 'User can continue ride'})
        return
        
    })
        .catch((err) => {
            console.log(err)
            sendJSONresponse(res,404,{message:'Error fetching ride status'})
            return
        })
}

module.exports.getRideData = function (req, res) {
    const userId = req.user.id

    if (!userId) {
        sendJSONresponse(res, 422, { message: 'Missing required arguments' })
        return
    }
    
    sequelize.transaction(async (t) => {

        // check if user exists
        let user = await User.findOne({
            where: {
                id: userId
            },
            attributes: ['id', 'country', 'currency'],
            transaction: t
        })

        if(!user) {
            sendJSNOresponse(res, 404, { message: 'User does not exist' })
            return
        }

        let ride = await Ride.findOne({
            where: {
                userId,
                status: 'active'
            },
            include: [
                {
                    model: Scooter,
                    
                    attributes: [       
                        'id', 'code','battery','city','status','lat','lng'
                    ],                    
                }
            ],
            order: [['createdAt','DESC']],
            transaction: t
        })

        if (!ride) {
            sendJSONresponse(res, 404, { message: 'Ride not found' })
            return
        }

        // calculate time
        let time = moment().diff(ride.createdAt, 'minutes')

        // get scooter locations of the current ride
        let scooterLocations = await ScooterLocation.findAll({
            where: {
                scooterId: ride.scooterId,
                createdAt: {
                    [Op.between]: [ride.createdAt, moment().toDate()]
                }
            },
            attributes: ['id', 'lat', 'lng', 'createdAt'],
            transaction: t
        })

        // get user locations of the current ride
        let userLocations = await UserLocation.findAll({
            where: {
                userId,
                createdAt: {
                    [Op.between]: [ride.createdAt, moment().toDate()]
                }
            },
            attributes: ['id', 'lat', 'lng', 'createdAt'],
            transaction: t
        })
                           
        
        if(scooterLocations.length <= 1 && userLocations <= 1) {
            sendJSONresponse(res, 200, { distance: 0, time })
            return
        }

        // concatenate arrays
        let locations = scooterLocations.concat(userLocations)

        // sort by timestamp
        locations.sort(function(a,b) {            
            return a.createdAt - b.createdAt
        })
       
        let totalDistance = 0

        locations.forEach(function (location, index) {
            if (index == 0) return 0
            let prevLocation = { lat: locations[index - 1].lat, lng: locations[index - 1].lng }
            let currentLocation = { lat: location.lat, lng: location.lng }
            totalDistance += calculateDistance(prevLocation, currentLocation)
        })               

        sendJSONresponse(res, 200, { distance: totalDistance, time, scooter: ride.scooter })
        return               

    })
        .catch((err) => {
            console.log(err)
            sendJSONresponse(res, 404, { message: 'Error fetching ride data' })
            return
        })
}

module.exports.endRide = function (req, res) {
    const userId = req.user.id
    const endLat = req.body.endLat
    const endLng = req.body.endLng

    if (!userId || !endLat || !endLng) {
        sendJSONresponse(res, 422, { message: 'Missing required arguments' })
        return
    }

    sequelize.transaction((t) => {
        return User.findOne({
            where: {
                id: userId,
            },
            transaction: t
        })
            .then((user) => {
                if (!user) {
                    sendJSONresponse(res, 404, { message: 'User does not exist' })
                    return
                }

                return Ride.findOne({
                    where: {
                        userId: userId,
                        status: 'active'
                    },
                    transaction: t
                })
                    .then((ride) => {
                        if (!ride) {
                            sendJSONresponse(res, 404, { message: 'Ningún viaje se encuentra activo' })
                            return
                        }
                        // end ride
                        ride.endLat = endLat
                        ride.endLng = endLng
                        ride.status = 'completed'
                        ride.endTimestamp = moment().toDate()
                        return ride.save(({ transaction: t }))
                            .then(() => {
                                // discount ride cost to balance
                                // get user balance
                                return Balance.findOne({
                                    where: {
                                        userId,
                                        currency: user.currency
                                    },
                                    attributes: ['id', 'amount'],
                                    transaction: t
                                })
                                    .then((balance, created) => {
                                        console.log(balance.amount)
                                        // create transaction
                                        // get scooter
                                        return Scooter.findOne({
                                            where: {
                                                id: ride.scooterId,
                                            },
                                            transaction: t
                                        })
                                            .then((scooter) => {
                                                if (!scooter) {
                                                    sendJSONresponse(res, 404, { message: 'Scooter no disponible' })
                                                    return
                                                }

                                                // change scooter status
                                                scooter.status = 'available'
                                                return scooter.save({ transaction: t })
                                                    .then(() => {
                                                        return Price.findOne({
                                                            where: {
                                                                city: scooter.city
                                                            },
                                                            attributes: ['minute', 'unlock', 'currency', 'minRide', 'tax'],
                                                            transaction: t
                                                        })
                                                            .then((prices) => {
                                                                // ride time / ride cost        
                                                                let price = BigNumber(prices.minute)                                              
                                                                let time = BigNumber(moment().diff(ride.createdAt, 'minutes'))
                                                                let total = time.multipliedBy(price)
                                                                // discount ride cost amount from balance
                                                                let userBalance = BigNumber(balance.amount)                                         
                                                                balance.amount = (userBalance.minus(total)).toFixed(2)
                                                                return balance.save({ transaction: t })
                                                                    .then(() => {
                                                                        // prepare data
                                                                        var tax = total.multipliedBy(prices.tax)
                                                                        var amount = total.minus(tax)

                                                                        // create transaction
                                                                        return Transaction.create({
                                                                            userId,
                                                                            rideId: ride.id,
                                                                            operation: 'END_RIDE',
                                                                            total: total.toFixed(2),
                                                                            currency: prices.currency,
                                                                            amount: amount.toFixed(2),
                                                                            tax: tax.toFixed(2),
                                                                        }, { transaction: t })
                                                                            .then((tx) => {

                                                                                sendJSONresponse(res, 200, { message: 'Viaje terminado' })
                                                                                return

                                                                            })
                                                                    })
                                                            })
                                                    })

                                            })
                                    })
                            })
                    })
            })
    })
        .catch((err) => {
            console.log(err)
            sendJSONresponse(res, 404, { message: 'Error ending ride' })
            return
        })
}

module.exports.startRide = function (req, res) {
    const userId = req.user.id
    const scooterHash = req.body.scooterHash
    const startLat = req.body.startLat
    const startLng = req.body.startLng

    if (!userId || !scooterHash) {
        sendJSONresponse(res, 422, { message: 'Missing required arguments' })
        return
    }

    // check if user exists
    sequelize.transaction((t) => {
        return User.findOne({
            where: {
                id: userId
            },
            attributes: ['id', 'country', 'currency'],
            transaction: t
        })
            .then((user) => {
                if (!user) {
                    sendJSONresponse(res, 404, { message: 'User does not exist' })
                    return
                }
                // get user balance
                return Balance.findOrCreate({
                    where: {
                        userId,
                        currency: user.currency
                    },
                    attributes: ['id', 'amount'],
                    transaction: t
                })
                    .spread((balance, created) => {

                        // get scooter
                        return Scooter.findOne({
                            where: {
                                hash: scooterHash,
                                status: 'available'
                            },
                            transaction: t
                        })
                            .then((scooter) => {
                                if (!scooter) {
                                    sendJSONresponse(res, 404, { message: 'Scooter no disponible' })
                                    return
                                }

                                return Price.findOne({
                                    where: {
                                        city: scooter.city
                                    },
                                    attributes: ['minute', 'unlock', 'currency', 'minRide', 'tax'],
                                    transaction: t
                                })
                                    .then((prices) => {
                                        // calculate if user has enough balance
                                        let unlockPrice = BigNumber(prices.unlock)
                                        let minutePrice = BigNumber(prices.minute)
                                        let minTotal = unlockPrice.plus( (minutePrice.times(prices.minRide)) )
                                        let userBalance = BigNumber(balance.amount)
                                        // if not enough balance to unlock scooter
                                        if (userBalance.isLessThan(minTotal)) {
                                            sendJSONresponse(res, 200, { message: 'Necesitas tener un balance mínimo de ' + printMoney(minTotal, prices.currency) + ' para poder iniciar el viaje' })
                                            return
                                        }
                                        // discount unlock amount                                        
                                        balance.amount = (userBalance.minus(unlockPrice)).toFixed(2)
                                        return balance.save({ transaction: t })
                                            .then(() => {
                                                // create ride
                                                return Ride.create({
                                                    userId,
                                                    scooterId: scooter.id,
                                                    startLat,
                                                    startLng,
                                                    city: scooter.city
                                                }, { transaction: t })
                                                    .then((ride) => {
                                                        // prepare data
                                                        let tax = (unlockPrice.times(prices.tax)).toFixed(2)
                                                        let amount = (unlockPrice.minus(tax)).toFixed(2)
                                                        
                                                        // create transaction
                                                        return Transaction.create({
                                                            userId,
                                                            rideId: ride.id,
                                                            operation: 'SCOOTER_UNLOCK',
                                                            total: prices.unlock,
                                                            currency: prices.currency,
                                                            amount,
                                                            tax,
                                                        }, { transaction: t })
                                                            .then((tx) => {
                                                                // update scooter status
                                                                scooter.status = 'on_ride'
                                                                return scooter.save({ transaction: t })
                                                                    .then(() => {
                                                                        sendJSONresponse(res, 200, { message: 'Scooter unlocked' })
                                                                        return
                                                                    })
                                                            })
                                                    })
                                            })
                                    })
                            })
                    })
            })
    })
        .catch((err) => {
            console.log(err)
            sendJSONresponse(res, 404, { message: 'Error starting ride' })
            return
        })
}

// check if user can start new ride
module.exports.checkNewRide = function (req, res) {
    const userId = req.user.id
    const scooterHash = req.body.scooterHash

    if (!userId || !scooterHash) {
        sendJSONresponse(res, 422, { message: 'Missing required arguments' })
        return
    }

    sequelize.transaction((t) => {
        return User.findOne({
            where: {
                id: userId
            }
        })
            .then((user) => {
                if (!user) {
                    sendJSONresponse(res, 404, { message: 'El usuario no existe' })
                    return
                }
                // get user balance
                return Balance.findOrCreate({
                    where: {
                        userId,
                        currency: user.currency
                    },
                    attributes: ['id', 'amount'],
                    transaction: t
                })
                    .spread((balance, created) => {
                        // get scooter
                        return Scooter.findOne({
                            where: {
                                hash: scooterHash,
                                status: 'available'
                            },
                            transaction: t
                        })
                            .then((scooter) => {
                                if (!scooter) {
                                    sendJSONresponse(res, 404, { message: 'Scooter no disponible' })
                                    return
                                }

                                return Price.findOne({
                                    where: {
                                        city: scooter.city
                                    },
                                    attributes: ['minute', 'unlock', 'currency', 'minRide', 'tax'],
                                    transaction: t
                                })
                                    .then((prices) => {
                                        // calculate if user has enough balance                                        
                                        let unlockPrice = BigNumber(prices.unlock)
                                        let minutePrice = BigNumber(prices.minute)
                                        let minTotal = unlockPrice.plus((minutePrice.times(prices.minRide)))
                                        let userBalance = BigNumber(balance.amount)
                                        
                                        // if not enough balance to unlock scooter
                                        if (userBalance.isLessThan(minTotal)) {
                                            sendJSONresponse(res, 404, { message: 'Necesitas tener un balance mínimo de ' + printMoney(minTotal, prices.currency) + ' para poder iniciar el viaje' })
                                            return
                                        }

                                        sendJSONresponse(res, 200, { message: 'OK' })
                                        return
                                    })
                            })
                    })
            })
    })
        .catch((err) => {
            console.log(err)
            sendJSONresponse(res, 404, { message: 'Error checking balance' })
            return
        })
}