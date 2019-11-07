const User = require('../models/sequelize').User
const RegistrationKey = require('../models/sequelize').RegistrationKey
const sendJSONresponse = require('../../utils/index.js').sendJSONresponse
const sequelize = require('../models/sequelize').sequelize
const crypto = require('crypto')
const firebaseAdmin = require('firebase-admin')
const serviceAccount = require('../../firebaseAccountKey.json')


firebaseAdmin.initializeApp({
    credential: firebaseAdmin.credential.cert(serviceAccount),
    databaseURL: "https://blits-21913.firebaseio.com"
})

module.exports.testNotification = function(req, res) {
    const userId = req.body.userId
    const msgTitle = req.body.msgTitle
    const msgBody = req.body.msgBody
    
    if(!userId || !msgTitle || !msgBody) {
        sendJSONresponse(res,404,{message: 'Missing required fields'})
        return
    }

    sequelize.transaction(async (t) => {
        let registrationKey = await RegistrationKey.findOne({
            where: {
                userId
            },
            transaction: t
        })

        if(!registrationKey) {
            sendJSONresponse(res,404,{message: 'User does not have registrationId '})
            return
        }

        const message = {
            data: {
                title: msgTitle,
                body: msgBody,
                image: 'www/img/logo.png'
            },
            token: registrationKey.registrationId
        }

        // Send Notification to one device
        // https://firebase.google.com/docs/cloud-messaging/send-message
        let response = await firebaseAdmin.messaging().send(message)

        console.log(response)
        sendJSONresponse(res,200,{message: 'OK'})
        return

    })
        .catch((err) => {
            console.log(err)
            sendJSONresponse(res,404,{message: err})
            return
        })


}