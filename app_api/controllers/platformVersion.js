const User = require('../models/sequelize').User
const Admin = require('../models/sequelize').Admin
const PlatformVersion = require('../models/sequelize').PlatformVersion
const ScooterLocation = require('../models/sequelize').ScooterLocation
const sendJSONresponse = require('../../utils/index.js').sendJSONresponse
const sequelize = require('../models/sequelize').sequelize
const { Op } = require('sequelize')

module.exports.createVersion = function(req,res) {
    const userId = req.user.id
    const platform = req.body.platform
    const version = req.body.version
    const forceUpdate = req.body.forceUpdate

    if(!userId || !platform || !version || !forceUpdate) {
        sendJSONresponse(res,404,{message: 'Missing required fields'})
        return
    }

    sequelize.transaction(async (t) => {
        let admin = await Admin.findOne({where: {userId,level: {[Op.gte]: 1}}, transaction: t})

        if(!admin) {
            sendJSONresponse(res,404,{message:'User does not have enough privileges'})
            return
        }

        let platformVersion = await PlatformVersion.create({platform,version,forceUpdate},{transaction: t})
        sendJSONresponse(res,200,{platformVersion})
    })
        .catch((err) => {
            console.log(err)
            sendJSONresponse(res,404,{message:'An error ocurred while creating platform version'})
            return
        })
    
}

module.exports.getVersion = function(req,res) {
    const platform = req.params.platform

    if(!platform) {
        sendJSONresponse(res,404,{message:'Missing required fields'})
        return
    }

    sequelize.transaction(async (t) => {
        let platformVersion = await PlatformVersion.findOne({where: {platform}, transaction: t})

        if(!platformVersion) {
            sendJSONresponse(res,404,{message:'Version data for the platform not found'})
            return
        }

        sendJSONresponse(res,200,{platformVersion})
        return
    })
        .catch((err) => {
            console.log(err)
            sendJSONresponse('An error occurred while getting version data')
            return
        })
}

module.exports.updateVersion = function(req,res) {

}

module.exports.deleteVersion = function(req,res) {

}

module.exports.checkiOSReview = function(req,res) {
    PlatformVersion.findOne({
        where: {
            platform: 'ios-review'
        }
    })
        .then((version) => {
            if(!version || version.forceUpdate === 0) {
                sendJSONresponse(res,200,{message:'inactive'})
                return
            }

            sendJSONresponse(res,200,{message:'active'})
            return
        })
}