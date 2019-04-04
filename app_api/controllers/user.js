const User = require('../models/sequelize').User
const Admin = require('../models/sequelize').Admin
const sendJSONresponse = require('../../utils/index.js').sendJSONresponse
const sequelize = require('../models/sequelize').sequelize

module.exports.getAllByPage = function (req, res) {
    const userId = req.user.id 
    var page = req.params.page 
    var limit = 50
    var offset = 0
    
    if (!userId || !page || page < 0) {
        sendJSONresponse(res, 422, { message: 'All fields required' })
        return
    }

    sequelize.transaction((t) => {
        return Admin.findOne({
            where: {
                userId: userId
            },
            transaction: t
        })
            .then((admin) => {
                if (!admin) {
                    sendJSONresponse(res, 404, { message: 'User does not have enough privileges' })
                    return
                }

                return User.findAndCountAll({                    
                    transaction: t
                })
                    .then((result) => {
                        var pages = Math.ceil(result.count / limit)
                        offset = limit * (page - 1)
                        return User.findAll({                            
                            limit: limit,
                            offset: offset,
                            transaction: t
                        })
                            .then((users) => {
                                sendJSONresponse(res, 200, { result: users, count: result.count, pages: pages })
                                return
                            })
                    })

            })
    })
        .catch((err) => {
            console.log(err)
            return
        })
}

module.exports.countAll = function (req, res) {
    
    const userId = req.user.id    
    
    if (!userId) {
        sendJSONresponse(res, 422, { message: 'All fields required' })
        return
    }
    
    sequelize.transaction((t) => {
        return Admin.findOne({
            where: {
                userId: userId
            },
            transaction: t
        })
            .then((admin) => {
                if (!admin) {
                    sendJSONresponse(res, 404, { message: 'User does not have enough privileges' })
                    return
                }
                
                return User.findAndCountAll({ transaction: t })
                    .then((result) => {
                        sendJSONresponse(res, 200, { count: result.count })
                        return
                    })                
            })
    })
        .catch((err) => {
            console.log(err)
            return
        })
} 