const User = require('../models/sequelize').User
const RegistrationKey = require('../models/sequelize').RegistrationKey
const sendJSONresponse = require('../../utils/index.js').sendJSONresponse
const sequelize = require('../models/sequelize').sequelize
const crypto = require('crypto')


module.exports.saveRegistrationId = function(req,res) {
    const userId = req.user.id
    const registrationId = req.body.registrationId

    if(!userId || !registrationId) {
        sendJSONresponse(res,404,{message: 'All fields required'})
        return
    }

    sequelize.transaction(async (t) => {
        let user = await User.findOne({
            where: {
                id: userId
            },
            transaction: t
        })

        if(!user) {
            sendJSONresponse(res,404,{message: 'User does not exist'})
            return
        }

        let registrationKey = await RegistrationKey.findOne({
            where: {
                userId
            },
            transaction: t
        })

        if(!registrationKey) {
            registrationKey = await RegistrationKey.create({
                userId,
                registrationId
            }, { transaction: t })

            sendJSONresponse(res, 200, registrationKey)
            return
        }

        registrationKey.registrationId = registrationId
        await registrationKey.save({ transaction: t })
        sendJSONresponse(res, 200, registrationKey)
        return
    })
        .catch((err) => {
            console.log(err)
            sendJSONresponse(res, 404, { message: err })
            return
        })
}