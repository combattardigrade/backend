const Nexmo = require('nexmo')
const sms = new Nexmo({
    apiKey: process.env.NEXMO_API_KEY,
    apiSecret: process.env.NEXMO_API_SECRET
})
const crypto = require('crypto')
const sendJSONresponse = require('../../utils/index').sendJSONresponse

module.exports.sendSms = function (req, res) {
    console.log('test')
    sms.message.sendSms('Blits', '+5215527691883', 'Tu codigo para Blits es: 2')
    res.status(200)
    res.send('ok')
}

module.exports.test = function (req, res) {
    // crypto.randomBytes(16).toString('hex')
    sendJSONresponse(res,200,{message:'test'})
    return
}