
const User = require('../models/sequelize').User
const Photo = require('../models/sequelize').Photo
const PhotoVote = require('../models/sequelize').PhotoVote
const Ride = require('../models/sequelize').Ride
const Scooter = require('../models/sequelize').Scooter
const sendJSONresponse = require('../../utils/index.js').sendJSONresponse
const sequelize = require('../models/sequelize').sequelize
const { Op } = require('sequelize')
const crypto = require('crypto')
var fs = require('fs')

module.exports.uploadPhoto = function(req,res) {
    const userId = req.user.id
    const lat = req.body.lat
    const lng = req.body.lng
    const photoData = req.body.photoData
    
    if(!userId || !photoData || !lat || !lng) {
        sendJSONresponse(res,422,{message:'Missing required arguments'})
        return
    }
    
    sequelize.transaction(async (t) => {
        let user = await User.findOne({
            where: {id: userId},            
            transaction: t
        })
        
        if(!user) {
            sendJSONresponse(res,404,{message:'User does not exist'})
            return
        }

        let ride = await Ride.findOne({
            where: {
                userId,
                status: 'active'
            },
            transaction: t
        })

        if(!ride) {
            sendJSONresponse(res,404,{message:'No active rides found'})
            return
        }

        let photoBuffer = new Buffer(photoData, 'base64')
        let newName = crypto.randomBytes(16).toString('hex')
        let path = './uploads/photos/' + newName + '.jpeg'

        // save photo into db
        let photo = await Photo.create({
            userId,
            path,
            rideId: ride.id,
            lat,
            lng,
        }, { transaction: t })
            
        try {
            fs.writeFile(path, photoBuffer, function () {
                sendJSONresponse(res,200,{photo})
                return
            })
        }
        catch(error) {
            console.log('ERROR:', error)
        }
        
        
    })
        .catch((err) => {
            console.log(err)
            sendJSONresponse(res,404,{message:'An error occurred while uploading photo'})
            return
        })
}

module.exports.getPhoto = function(req,res) {    
    const scooterCode = req.params.scooterCode

    if(!scooterCode) {
        sendJSONresponse(res,422,{message:'Missing required arguments'})
        return
    }

    sequelize.transaction(async (t) => {        

        let scooter = await Scooter.findOne({where: {code: scooterCode}, transaction: t})

        if(!scooter) {
            sendJSONresponse(res,404,{message:'Scooter not found'})
            return
        }

        let ride = await Ride.findOne({where: {scooterId: scooter.id}, order: [['createdAt','DESC']], transaction: t})

        if(!ride) {
            sendJSONresponse(res,404,{message:'Scooter does not have previous rides'})
            return
        }

        let photo = await Photo.findOne({where: {rideId: ride.id}, transaction: t})

        if(!photo) {
            sendJSONresponse(res,404,{message: 'Scooter does not have photos'})
            return
        }

        fs.readFile(photo.path,function(err,data) {
            if(err) {
                sendJSONresponse(res,404,{message: 'Error reading photo'})
                return
            }
            res.writeHead(200,{'Content-Type':'image/jpeg'})
            res.end(data,'binary')
        })
    })
        .catch((err) => {
            console.log(err)
            sendJSONresponse(res,404,{message:'An error occurred. Please try again!'})
            return
        })
}

module.exports.createVote = function(req,res) {
    const userId = req.user.id
    const scooterCode = req.body.scooterCode
    const vote = req.body.vote

    if(!userId || !vote) { 
        sendJSONresponse(res,404,{message:'Missing required arguments'})
        return
    }
 
    sequelize.transaction(async (t) => {
        let user = await User.findOne({where: {id: userId}, transaction: t})

        if(!user) {
            sendJSONresponse(res,404,{message:'User does not exist'})
            return
        }

        let scooter = await Scooter.findOne({where: {code: scooterCode}, transaction: t})

        if(!scooter) {
            sendJSONresponse(res,404,{message:'Scooter not found'})
            return
        }
        
        let ride = await Ride.findOne({where: {scooterId: scooter.id}, order: [['createdAt','DESC']], transaction: t})

        if(!ride) {
            sendJSONresponse(res,404,{message:'Scooter does not have previous rides'})
            return
        }

        let photo = await Photo.findOne({where: {rideId: ride.id}, transaction: t})

        if(!photo) {
            sendJSONresponse(res,404,{message: 'Scooter does not have photos'})
            return
        }

        await PhotoVote.destroy({
            where: {
                photoId: photo.id,
                scooterId: scooter.id,
                userId
            },
            transaction: t
        })
        
        let photoVote = await PhotoVote.create({
            photoId: photo.id,
            scooterId: scooter.id,
            userId,
            vote
        }, { transaction: t })

        sendJSONresponse(res,200,{photoVote})
        return
    })
        .catch((err) => {
            console.log(err)
            sendJSONresponse(res,404,{message: 'An error occurred while creating vote'})
            return
        })
}