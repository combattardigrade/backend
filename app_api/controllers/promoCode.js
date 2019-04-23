const User = require('../models/sequelize').User
const PromoCode = require('../models/sequelize').PromoCode
const PromoTransaction = require('../models/sequelize').PromoTransaction
const sendJSONresponse = require('../../utils/index.js').sendJSONresponse
const sequelize = require('../models/sequelize').sequelize
const crypto = require('crypto')

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
            referred: referredPromos
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