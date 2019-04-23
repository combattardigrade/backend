const User = require('../models/sequelize').User
const UserLocation = require('../models/sequelize').UserLocation
const sendJSONresponse = require('../../utils/index.js').sendJSONresponse
const sequelize = require('../models/sequelize').sequelize

module.exports.saveLocation = function(req,res) {
    const userId = req.user.id
    const lat = parseFloat(req.body.lat)
    const lng = parseFloat(req.body.lng)
    
    if(!userId || !lat || !lng) {
        sendJSONresponse(res,422,{message:'Missing required arguments'})
        return
    }
    
    sequelize.transaction(async (t) => {
        let user = await User.findOne({where: {id: userId}, transaction: t})

        if(!user) {
            sendJSONresponse(res,404,{message:'User does not exist'})
            return
        }

        let userLocation = await UserLocation.create({
            userId,
            lat,
            lng
        }, { transaction :t })

        if(!userLocation) {
            sendJSONresponse(res,404,{message:'Error saving location'})
            return
        }

        sendJSONresponse(res,200,{userLocation})
        return
    })
        .catch((err) => {
            console.log(err)
            sendJSONresponse(res,404,{message:'An error occurred while trying to save location'})
            return
        })
}