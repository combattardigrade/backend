const User = require('../models/sequelize').User
const PromoCode = require('../models/sequelize').PromoCode
const PromoTransaction = require('../models/sequelize').PromoTransaction
const Balance = require('../models/sequelize').Balance
const sendJSONresponse = require('../../utils/index.js').sendJSONresponse
const sequelize = require('../models/sequelize').sequelize
const crypto = require('crypto')

module.exports.redeemCode = function(req,res) {
    const userId = req.user.id
    const code = req.body.code

    if(!userId || !code) {
        sendJSONresponse(res,422,{message: 'Missing required arguments'})
        return
    }

    sequelize.transaction(async (t) => {
        let user = await User.findOne({where: {id: userId}, transaction: t})

        if(!user) {
            sendJSONresponse(res,404,{message:'User does not exist'})
            return
        }
        
        let promoCode = await PromoCode.findOne({where: {code, status: 'active'}, transaction: t})
        
        // check if promo code exists
        if(!promoCode) {
            sendJSONresponse(res,404,{message:'Promo code not found'})
            return
        }

        // check is code is from same user
        if(promoCode.userId === userId) {
            sendJSONresponse(res,404,{message:'You cannot redeem your own code!'})
            return
        }

        // check if user has redeemed code of the same category or same code
        let promosHistory = await PromoTransaction.findOne({
            where: {
                $or: [
                    {code: promoCode.code},
                    {category: promoCode.category}
                ]
            },
            transaction: t
        })

        // if promo code already redeemed
        if(promosHistory) {
            sendJSONresponse(res,404,{message:'Promo code already used!'})
            return
        }

        // add promo transaction to redeemer
        await PromoTransaction.create({
            redeemerUserId: userId,
            referrerUserId: promoCode.userId,
            code,
            amount: promoCode.amount,
            category: promoCode.category,
            operation: 'redeem'
        }, {transaction: t})
        
        // add balance to redeemer
        return Balance.findOrCreate({
            where: {
                userId,
                currency:user.currency
            },
            defaults: {
                userId,
                amount: 0,
                currency: user.currency,
            },
            transaction: t
        })
            .spread(async (redeemerBalance,created) => {
                let newBalance = parseFloat(promoCode.amount) + parseFloat(redeemerBalance.amount)
                redeemerBalance.amount = newBalance
                await redeemerBalance.save({transaction: t})
                // add balance to referrer
                return Balance.findOrCreate({
                    where: {
                        userId: promoCode.userId,
                        currency: user.currency
                    },
                    defaults: {
                        userId: promoCode.userId,
                        amount: 0,
                        currency: user.currency
                    },
                    transaction: t
                })
                    .spread(async (referrerBalance,created) =>{
                        newBalance = parseFloat(promoCode.amount) + parseFloat(referrerBalance.amount)
                        referrerBalance.amount = newBalance
                        await referrerBalance.save({transaction: t})
                        sendJSONresponse(res,200,{message:'Promo code redeemed'})
                        return
                    })                
            }) 
    })
        .catch((err) => {
            console.log(err)
            sendJSONresponse(res,404,{message:'An error occurred while trying to redeem code'})
            return
        })
}

module.exports.getHistory = function(req,res) {
    const userId = req.user.id

    if(!userId) {
        sendJSONresponse(res,422,{message: 'Missing required arguments'})
        return
    }

    sequelize.transaction(async (t) => {
        let user = await User.findOne({where: {id: userId}, transaction: t})

        if(!user) {
            sendJSONresponse(res,404,{message: 'User does not exist'})
            return
        }

        let redeemedPromos = await PromoTransaction.findAll({
            where: {
                redeemerUserId: userId,                
            },
            transaction: t
        })

        let referredPromos = await PromoTransaction.findAll({
            where: {
                referrerUserId: userId
            },
            transaction: t
        })

        let response = {
            redeemed: redeemedPromos,
            referred: referredPromos,
            results: (redeemedPromos.length) + (referredPromos.length)
        }
        sendJSONresponse(res,200,response)
        return
    })
        .catch((err) => {
            sendJSONresponse(res,404,{message:'An error ocurred while fetching promos history'})
            return
        })
}

module.exports.getCode = function(req,res) {
    const userId = req.user.id

    if(!userId) {
        sendJSONresponse(res,422,{message: 'Missing required arguments'})
        return
    }

    sequelize.transaction(async (t) => {
        let user = await User.findOne({where: {id: userId},transaction: t})

        if(!user) {
            sendJSONresponse(res,404,{message: 'User does not exist'})
            return
        }

        return PromoCode.findOrCreate({
            where: {
                userId,
                status: 'active'
            },
            defaults: {
                userId,
                code: (crypto.randomBytes(16).toString('hex')).substring(0,7).toUpperCase(),
                amount: 100,
                currency: user.currency,
                category: 'invite_friends'
            },
            transaction: t
        })
            .spread((promoCode,created) => {
                sendJSONresponse(res,200,{promoCode})
                return
            })
    })
        .catch((err) => {
            console.log(err)
            sendJSONresponse(res,404,{message:'An error occurred while fetching promo code'})
            return
        })

}