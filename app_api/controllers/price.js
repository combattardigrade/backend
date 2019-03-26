const Price = require('../models/sequelize').Price
const sendJSONresponse = require('../../utils/index.js').sendJSONresponse

module.exports.getPrices = function(req,res) {
    const userId = req.user.id
    const city = req.params.city

    if(!userId || !city) {
        sendJSONresponse(res,422,{message:'Missing required parameters'})
        return
    }

    Price.findOne({
        where: {
            city,
        }
    })
    .then((prices) => {
        if(!prices) {
            sendJSONresponse(res,404,{message:'Prices for the city not found'})
            return
        }
        sendJSONresponse(res,200,prices)
        return
    })
    .catch((err) => {
        console.log(err)
        sendJSONresponse(res,404,{message:'Error fetching prices'})
        return
    })
}