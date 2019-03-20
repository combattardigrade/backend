const User = require('../models/sequelize').User
const Admin = require('../models/sequelize').Admin
const sendJSONresponse = require('../../utils/index.js')
const { Op } = require('sequelize');

module.exports.createAdmin = function(req,res) {
    const userId = req.user.id
    const newAdminUserId = req.body.newAdminUserId
    
    if(!userId || !newAdminUserId) {
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
                id: newAdminUserId
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
