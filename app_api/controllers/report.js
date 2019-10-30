const User = require('../models/sequelize').User
const Report = require('../models/sequelize').Report
const Photo = require('../models/sequelize').Photo
const Scooter = require('../models/sequelize').Scooter
const sendJSONresponse = require('../../utils/index.js').sendJSONresponse
const sequelize = require('../models/sequelize').sequelize
const crypto = require('crypto')
const fs = require('fs')

module.exports.createReport = (req,res) => {
    const userId = req.user.id
    const problem = req.body.problem
    const vehicleCode = req.body.vehicleCode
    const description = req.body.description
    const comment = req.body.comment
    const lat = req.body.lat
    const lng = req.body.lng
    const photoData = req.body.photoData
    
    if(!userId || !vehicleCode || !problem) {
        sendJSONresponse(res,404,{message: 'Missing required parameters'})
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

        // to do:
        // check time since last report for security
        // don't add this constrain in case user has to report multiple vehicles        
    
        // find vehicle 
        // check if code is valid              
        let vehicle =  await Scooter.findOne({
            where: {
                code: vehicleCode
            },
            transaction: t
        })
        
        if(!vehicle) {
            sendJSONresponse(res,404,{message: 'Invalid vehicle code'})
            return
        }

        // if photo was attached        
        let photoBuffer, newName, photoPath
        if(photoData) {
            photoBuffer = new Buffer(photoData, 'base64')
            newName = crypto.randomBytes(16).toString('hex')
            photoPath = './uploads/photos/' + newName + '.jpeg'
            try {
                let savePhoto = new Promise((resolve, reject) => {
                    fs.writeFile(photoPath, photoBuffer, (err) => {
                        if(err) {
                            reject(err)
                        }
                        resolve(true)   
                    })  
                })

                await savePhoto                     
            }
            catch(error) {
                console.log(error)
                sendJSONresponse(res,404,{message:'Error saving photo'})
                return
            }
        }

        let report = await Report.create({
            userId,
            vehicleId: vehicle.id,
            problem,
            description,
            comment,
            photoPath,
            lat,
            lng,            
        })

        sendJSONresponse(res,200, {status: 'OK', report: report})
        return

    })  
        .catch((err) => {
            console.log(err)
            sendJSONresponse(res,404,{message: 'Ocurrió un error al intentar realizar la acción'})
            return
        })
}