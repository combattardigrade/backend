const User = require('../models/sequelize').User
const Balance = require('../models/sequelize').Balance
const Scooter = require('../models/sequelize').Scooter
const Price = require('../models/sequelize').Price
const Ride = require('../models/sequelize').Ride
const Transaction = require('../models/sequelize').Transaction

const sequelize = require('../models/sequelize').sequelize
const sendJSONresponse = require('../../utils/index.js').sendJSONresponse
const printMoney = require('../../utils/index.js').printMoney

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
                                        let minTotal = prices.unlock + (prices.minute * prices.minRide)

                                        // if not enough balance to unlock scooter
                                        if (balance.amount < minTotal) {
                                            sendJSONresponse(res, 200, { message: 'Necesitas tener un balance mínimo de ' + printMoney(minTotal, prices.currency) + ' para poder iniciar el viaje' })
                                            return
                                        }
                                        // discount unlock amount                                        
                                        balance.amount = balance.amount - prices.unlock
                                        return balance.save({ transaction: t })
                                            .then(() => {
                                                // create ride
                                                return Ride.create({
                                                    userId,
                                                    scooterId: scooter.id,
                                                    startLat,
                                                    startLng
                                                }, { transaction: t })
                                                    .then((ride) => {
                                                        // prepare data
                                                        var tax = prices.unlock * prices.tax
                                                        var amount = prices.unlock - tax

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
                                                                scooter.status = 'inUse'
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
                                        let minTotal = prices.unlock + (prices.minute * prices.minRide)

                                        // if not enough balance to unlock scooter
                                        if (balance.amount < minTotal) {
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