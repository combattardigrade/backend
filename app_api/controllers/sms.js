const User = require('../models/sequelize').User
const Scooter = require('../models/sequelize').Scooter
const UnlockRequest = require('../models/sequelize').UnlockRequest

const sendJSONresponse = require('../../utils/index.js').sendJSONresponse
const sequelize = require('../models/sequelize').sequelize
const { Op } = require('sequelize')
const crypto = require('crypto')
const moment = require('moment')
const Nexmo = require('nexmo')
const sms = new Nexmo({
    apiKey: process.env.NEXMO_API_KEY,
    apiSecret: process.env.NEXMO_API_SECRET
})

module.exports.receiveSMS = function(req,res) {
    
    
    const messageId = req.query.messageId
    const keyword = req.query.keyword
    let from = req.body.msisdn
    from = from.slice(2)

    keyword = keyword.split(' ')
    let code = keyword[1]
    console.log(code)
    console.log(keyword)

    // not for production!
    sequelize.transaction(async (t) => {
        let user = await User.findOne({
            where: {
                phone: from
            }
        })
        let scooter = await Scooter.findOne({
            where: {
                code,
            },
            transaction: t
        })
                
        await UnlockRequest({
            userId: user.id,
            scooterId: scooter.id,
        }, { transaction: t })

        // respond to sms
        sms.message.sendSms('Blits', from, 'Activando scooter ' + code)
        return
    })
        .catch((err) => {
            console.log(err)
            sendJSONresponse(res,404,{message: 'Ocurrió un error al intentar realizar la operación'})
        })

        sendJSONresponse(res,200,{message:'SMS received'})
        return
}