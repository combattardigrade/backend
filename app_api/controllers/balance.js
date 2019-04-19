const User = require('../models/sequelize').User
const Balance = require('../models/sequelize').Balance
const sendJSONresponse = require('../../utils/index.js').sendJSONresponse
const sequelize = require('../models/sequelize').sequelize
const { Op } = require('sequelize');
const crypto = require('crypto')
const moment = require('moment')



module.exports.getBalance = function (req, res) {
    const userId = req.user.id
    const currency = req.params.currency

    if (!userId || !currency) {
        sendJSONresponse(res, 422, { message: 'Missing required arguments' })
        return
    }

    sequelize.transaction((t) => {
        return User.findOne({
            where: {
                id: userId
            },
            attributes: ['id'],
            include: [
                {
                    model: Balance,
                    attributes: ['amount', 'currency'],
                    where: {
                        currency,
                    }
                }
            ],
            transaction: t
        })
            .then((user) => {
                if (!user) {
                    sendJSONresponse(res, 404, { message: 'User does not exist' })
                    return
                }
                sendJSONresponse(res, 200, { user })
                return
            })
    })
        .catch((err) => {
            console.log(err)
            sendJSONresponse(res, 404, { message: 'Error fetching balance' })
            return
        })
}