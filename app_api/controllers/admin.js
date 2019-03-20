const User = require('../models/sequelize').User
const Admin = require('../models/sequelize').Admin
const sendJSONresponse = require('../../utils/index.js')
const { Op } = require('sequelize');

module.exports.givePrivileges = function(req,res) {
    const userId = req.user.id
    const email = req.body.email
    
    if(!userId || !email) {
        sendJSONresponse(res,422,{message:'All fields required'})
        return
    }

    Admin.findOne({
        where: {
            userId: userId,
            level: {
                [Op.gte]: 1
            }
        }
    })
    .then((admin) => {
        if(!admin) {
            sendJSONresponse(res,404,{message: 'Admin does not exist'})
            return
        } 

        User.findOne({
            where: {
                email: email
            },
            include: [
                { model: Admin }
            ]
        })
        .then((newAdmin) => {
            if(!newAdmin) {
                sendJSONresponse(res,404,{message:'The user you are trying to give privileges does not exist'})
                return
            }

            if(!newAdmin.admin) {
                Admin.create({
                    userId: newAdmin.id,
                    level: 1
                })
                .then((adminCreated) => {
                    if(!adminCreated) {
                        sendJSONresponse(res,404,{message:'Error giving privileges to user'})
                        return
                    }

                    sendJSONresponse(res,200,{adminCreated})
                    return
                })
                .catch((err) => {
                    sendJSONresponse(res,404,{message:err})
                    return
                })
            } else {
                sendJSONresponse(res,200,{message:'User already has admin privileges'})
                return
            }
        })
    })
}

module.exports.checkPrivileges = function(req,res) {
    const email = req.params.email

    if(!email) {
        sendJSONresponse(res,422,{message: 'All fields required'})
        return
    }

    User.findOne({
        where: {
            email: email
        }
    })
    .then((user) => {
        if(!user) {
            sendJSONresponse(res,404,{message:'User does not exist'})
            return
        }
        Admin.findOne({
            where: {
                userId: user.id
            }
        })
        .then((admin) => {
            if(!admin || admin.level == 0) {
                sendJSONresponse(res,404,{message:'User does not have enough privileges'})
                return
            }
            sendJSONresponse(res,200,{admin})
            return
        })
        .catch((err) => {
            console.log(err)
            sendJSONresponse(res,404,{message:err})
            return
        })
    })
    .catch((err) => {
        console.log(err)
        sendJSONresponse(res,404,{message:err})
        return
    })
}
