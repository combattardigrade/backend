const User = require('../models/sequelize').User
const VehicleReview = require('../models/sequelize').VehicleReview
const Ride = require('../models/sequelize').Ride
const sendJSONresponse = require('../../utils/index.js').sendJSONresponse
const sequelize = require('../models/sequelize').sequelize

module.exports.createReview = function(req,res) {
    const userId = req.user.id
    const vehicleId = req.body.vehicleId
    const rating = req.body.rating
    const comment = req.body.comment
    console.log(comment)

    if(!userId || !vehicleId || !rating ) {
        sendJSONresponse(res,404,{message:'Missing required arguments'})
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
            sendJSONresponse(res,404,{message:'User does not exist'})
            return
        }

        let ride = await Ride.findOne({
            where: {
                userId,
                scooterId: vehicleId
            },
            order: [['createdAt','DESC']],
            transaction: t
        })

        // check if user had a ride with the vehicle
        if(!ride) {
            sendJSONresponse(res,404,{message:'No es posible calificar un vehículo que no has utilizado'})
            return
        }

        // create review
        return VehicleReview.findOrCreate({
            where: {
                userId,
                vehicleId,
                rideId: ride.id
            },
            defaults: {                
                vehicleId,
                userId,
                rideId: ride.id,
                rating,
                comment,                
            },
            transaction: t
        })
            .spread(async (vehicleReview, created) => {
                if(!created) {
                    vehicleReview.vehicleId = vehicleId
                    vehicleReview.rating = rating
                    vehicleReview.comment = comment
                    await vehicleReview.save({ transaction: t })
                }        
                sendJSONresponse(res,200, vehicleReview)
                return
            })
    })  
        .catch((err) => {
            console.log(err)
            sendJSONresponse(res,404,{message:'Ocurrió un error al intentar realizar la acción'})
            return
        })
}