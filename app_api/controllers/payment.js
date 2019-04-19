const User = require('../models/sequelize').User
const Card = require('../models/sequelize').Card
const sequelize = require('../models/sequelize').sequelize

const sendJSONresponse = require('../../utils/index.js').sendJSONresponse
const mercadopago = require('mercadopago')
mercadopago.configure({
    access_token: process.env.MP_ACCESS_TOKEN
})

module.exports.saveCard = function (req, res) {
    const userId = req.user.id
    const email = req.body.email
    const token = req.body.token

    if (!userId || !email || !token) {
        sendJSONresponse(res, 422, { message: 'Missing required parameters' })
        return
    }

    (async () => {
        // serach customer
        let response = await mercadopago.customers.search({ qs: { email: email } })
        let results = response.response.paging.total
        let cardData, customerId
        // check if user already exists
        if (results > 0) {
            // get customer id from response
            customerId = response.response.results[0].id
            cardData = {
                "token": token,
                "id": customerId
            }
        } else {
            const createdUser = await mercadopago.customers.create({ email: email })
            customerId = createdUser.id
            cardData = {
                "token": token,
                "id": customerId
            }
        }

        // add new card
        let card = await mercadopago.customers.cards.create(cardData)
        card = card.response
        // prepare data
        const expirationMonth = card.expiration_month
        const expirationYear = card.expiration_year
        const firstSixDigits = card.first_six_digits
        const lastFourDigits = card.last_four_digits
        const securityCodeLength = card.security_code.length
        const paymentMethod = card.payment_method.id
        const cardHolder = card.cardholder.name
        const cardId = card.id
        // insert card into db
        let dbCard = await Card.create({
            userId,
            expirationMonth,
            expirationYear,
            firstSixDigits,
            lastFourDigits,
            securityCodeLength,
            paymentMethod,
            cardHolder,
            customerId,
            cardId
        })

        sendJSONresponse(res,200,dbCard)
        return

    })()
}