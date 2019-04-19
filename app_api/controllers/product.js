const User = require('../models/sequelize').User
const Admin = require('../models/sequelize').Admin
const Product = require('../models/sequelize').Product

const sendJSONresponse = require('../../utils/index.js').sendJSONresponse
const sequelize = require('../models/sequelize').sequelize
const { Op } = require('sequelize');
const crypto = require('crypto')

module.exports.getAll = function(req,res) {
    const userId = req.user.id
    const currency = req.params.currency

    if(!userId || !currency) {
        sendJSONresponse(res,422,{message:'Missing required arguments'})
        return
    }

    sequelize.transaction(async (t) => {
        let products = await Product.findAll({
            where: {
                currency,
                status: 'active'
            },
            transaction: t
        })

        if(!products) {
            sendJSONresponse(res,404,{message:'No products found'})
            return
        }

        sendJSONresponse(res,200,{products})
        return
    })
        .catch((err) => {
            console.log(err)
            sendJSONresponse(res,404,{message:'An error occurred while getting products'})
            return
        })
}


module.exports.createProduct = function(req,res) {
    const userId = req.user.id
    const title = req.body.title
    const unitPrice = req.body.unitPrice
    const currency = req.body.currency
    const description = req.body.description
    const hash = crypto.randomBytes(16).toString('hex')	
    const status = 'active'

    if(!userId || !title || !unitPrice || !currency || !description ) {
        sendJSONresponse(res,422,{message: 'Missing required arguments'})
        return
    }

    sequelize.transaction(async (t) => {
        let user = await User.findOne({
            where:{
                id:userId
            },
            include: [
                {
                    model: Admin
                }
            ],
            transaction: t
        })

        if(!user || user.admin === null) {
            sendJSONresponse(res,404,{message:'User does not exist or does not have enough privileges'})
            return
        }

        let product = await Product.create({
            title,
            unitPrice,
            currency,
            description,
            hash,
            status
        }, { transaction: t})

        sendJSONresponse(res,200,product)
        return
    })
        .catch((err) => {
            console.log(err)
            sendJSONresponse(res,404,{message:'An error ocurred while creating product'})
            return
        })
}