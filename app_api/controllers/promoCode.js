const User = require('../models/sequelize').User
const PromoCode = require('../models/sequelize').PromoCode
const sendJSONresponse = require('../../utils/index.js').sendJSONresponse
const sequelize = require('../models/sequelize').sequelize
const crypto = require('crypto')

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
                code: (crypto.randomBytes(16).toString('hex')).substring(0,7).toUpperCase()
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