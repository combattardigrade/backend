const User = require('../models/sequelize').User
const Profile = require('../models/sequelize').Profile
const sendJSONresponse = require('../../utils/index.js').sendJSONresponse
const validateEmail = require('../../utils/index.js').validateEmail
const sequelize = require('../models/sequelize').sequelize
const crypto = require('crypto')
const fs = require('fs')

module.exports.saveChargersFirstStep = function(req, res) {
    const userId = req.user.id
    const nombre = req.body.nombre
    const apellidoPaterno = req.body.apellidoPaterno
    const apellidoMaterno = req.body.apellidoMaterno
    const email = req.body.email
    const pais = req.body.pais
    const ciudad = req.body.ciudad

    if(!userId || !nombre || !apellidoPaterno || !apellidoMaterno || !email || !pais || !ciudad) {
        sendJSONresponse(res, 404, { message: 'Ingresa todos los campos requeridos'})
        return
    }

    if(!validateEmail(email)) {
        sendJSONresponse(res, 404, {message: 'Ingresa un email válido'})
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
            sendJSONresponse(res,404,{message: 'El usuario no existe'})
            return
        }

        return Profile.findOrCreate({
            where: {
                userId,
            },
            defaults: {
                nombre,
                apellidoPaterno,
                apellidoMaterno,
                email,
                pais,
                ciudad,
            },
            transaction: t
        })
            .spread((profile, created) => {
                if(!created) {
                    profile.nombre = nombre
                    profile.apellidoPaterno = apellidoPaterno
                    profile.apellidoMaterno = apellidoMaterno
                    profile.email = email
                    profile.pais = pais
                    profile.ciudad = ciudad
                    return profile.save({ transaction: t })
                        .then(() => {
                            sendJSONresponse(res,200, {status: 'OK', result: profile})
                            return
                        })
                }

                sendJSONresponse(res, 200, {status: 'OK', result: profile})
                return
            })

    })
        .catch((err) => {
            console.log(err)
            sendJSONresponse(res,404,{message: err})
            return
        })
}

module.exports.getChargersFirstStep = function(req, res) {
    const userId = req.user.id

    sequelize.transaction(async (t) => {
        let user = await User.findOne({
            where: {
                id: userId
            },
            include: [
                {
                    model: Profile,
                    attributes: ['nombre', 'apellidoPaterno', 'apellidoMaterno', 'email', 'ciudad', 'pais']
                }
            ],
            transaction: t
        })

        if(!user) {
            sendJSONresponse(res,404,{message: 'El usuario no existe'})
            return
        }        

        if(!user.profile || !user.profile.nombre || 
            !user.profile.apellidoPaterno || !user.profile.apellidoMaterno
            || !user.profile.email || !user.profile.ciudad || !user.profile.pais
        ) {            
            sendJSONresponse(res, 200, {status: 'PENDING', result: user.profile})
            return
        }

        sendJSONresponse(res, 200, {status: 'OK', result: user.profile})
        return
    })
        .catch((err) => {
            console.log(err)
            sendJSONresponse(res,404,{message: err})
            return
        })
}

module.exports.saveChargersSecondStep = function(req, res) {
    const userId = req.user.id
    const calle = req.body.calle
    const ext = req.body.ext
    const int = req.body.int ? req.body.int : 'n/a'
    const colonia = req.body.colonia 
    const municipio = req.body.municipio
    const codigoPostal = req.body.codigoPostal

    if(!userId || !calle || !ext || !int || !colonia || !municipio || !codigoPostal) {
        sendJSONresponse(res,404,{message: 'Ingresa todos los campos requeridos'})
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
            sendJSONresponse(res,404,{message: 'El usuario no existe'})
            return
        }

        return Profile.findOrCreate({
            where: {
                userId,
            },
            defaults: {
                calle,
                ext,
                int,
                colonia,
                municipio,
                codigoPostal,
            },
            transaction: t
        })
            .spread((profile, created) => {
                if(!created) {
                    profile.calle = calle
                    profile.ext = ext
                    profile.int = int
                    profile.colonia = colonia
                    profile.municipio = municipio
                    profile.codigoPostal = codigoPostal
                    return profile.save({ transaction: t })
                        .then(() => {
                            sendJSONresponse(res,200, {status: 'OK', result: profile})
                            return
                        })
                }

                sendJSONresponse(res, 200, {status: 'OK', result: profile})
                return
            })

    })
        .catch((err) => {
            console.log(err)
            sendJSONresponse(res,404,{message: err})
            return
        })
}

module.exports.getChargersSecondStep = function(req, res) {
    const userId = req.user.id

    if(!userId) {
        sendJSONresponse(res,404,{message: 'Tu sesión expiró'})
        return
    }

    sequelize.transaction(async (t) => {
        let user = await User.findOne({
            where: {
                id: userId
            },
            include: [
                {
                    model: Profile,
                    attributes: ['calle', 'ext', 'int', 'colonia', 'municipio', 'codigoPostal']
                }
            ],
            transaction: t
        })

        if(!user) {
            sendJSONresponse(res,404,{message: 'El usuario no existe'})
            return
        }        

        if(!user.profile || !user.profile.calle || 
            !user.profile.ext || !user.profile.int
            || !user.profile.colonia || !user.profile.municipio || !user.profile.codigoPostal
        ) {            
            sendJSONresponse(res, 200, {status: 'PENDING', result: user.profile})
            return
        }

        sendJSONresponse(res, 200, {status: 'OK', result: user.profile})
        return
    })
        .catch((err) => {
            console.log(err)
            sendJSONresponse(res,404,{message: err})
            return
        })
}

module.exports.checkChargersThirdStep = function(req,res) {
    const userId = req.user.id

    if(!userId) {
        sendJSONresponse(res,404,{message: 'Tu sesión expiró'})
        return
    }

    sequelize.transaction(async (t) => {
        let user = await User.findOne({
            where: {
                id: userId
            },
            include: [
                {
                    model: Profile,
                    attributes: ['ineFrontalPath', 'inePosteriorPath', 'pasaportePath']
                }
            ],
            transaction: t
        })

        if(!user) {
            sendJSONresponse(res,404,{message: 'El usuario no existe'})
            return
        }

        if(!user.profile ) {
            sendJSONresponse(res,200, {status: 'PENDING', response: user.profile})
            return
        }

        if((user.profile.ineFrontalPath && user.profile.inePosteriorPath) || user.profile.pasaportePath) {
            sendJSONresponse(res,200,{status: 'OK', response: user.profile})
            return
        } else {
            sendJSONresponse(res,200, {status: 'PENDING', response: user.profile})
            return
        }
        
    })
        .catch((err) => {
            console.log(err)
            sendJSONresponse(res,404,{message: err})
            return
        })
}

module.exports.checkChargersFourthStep = function(req,res) {
    const userId = req.user.id

    if(!userId) {
        sendJSONresponse(res,404,{message: 'Tu sesión expiró'})
        return
    }

    sequelize.transaction(async (t) => {
        let user = await User.findOne({
            where: {
                id: userId
            },
            include: [
                {
                    model: Profile,
                    attributes: ['comprobanteDomicilioPath']
                }
            ],
            transaction: t
        })

        if(!user) {
            sendJSONresponse(res,404,{message: 'El usuario no existe'})
            return
        }

        if(!user.profile || !user.profile.comprobanteDomicilioPath) {
            sendJSONresponse(res,200, {status: 'PENDING', response: user.profile})
            return
        }
       
        sendJSONresponse(res,200,{status: 'OK', response: user.profile})
        return
        
    })
        .catch((err) => {
            console.log(err)
            sendJSONresponse(res,404,{message: err})
            return
        })
}

module.exports.checkChargerDocument = function(req,res) {
    const userId = req.user.id
    const documentType = req.params.documentType

    if(!userId) {
        sendJSONresponse(res,404,{message: 'Tu sesión expiró'})
        return
    }

    if(!documentType) {
        sendJSONresponse(res,404,{message: 'Ingresa un tipo de documento válido'})
        return
    }

    sequelize.transaction(async (t) => {
        let user = await User.findOne({
            where: {
                id: userId
            },
            include: [
                {
                    model: Profile,
                    attributes: ['ineFrontalPath','inePosteriorPath','pasaportePath','comprobanteDomicilioPath','selfiePath']
                }
            ],
            transaction: t
        })

        if(!user) {
            sendJSONresponse(res,404,{message: 'El usuario no existe'})
            return
        }

        if(!user.profile) {
            sendJSONresponse(res,404,{status: 'PENDING', response: user.profile})
            return
        }

        if(
            documentType === 'ineFrontal' && user.profile.ineFrontalPath ||
            documentType === 'inePosterior' && user.profile.inePosteriorPath ||
            documentType === 'pasaporte' && user.profile.pasaportePath ||
            documentType === 'comprobanteDomicilio' && user.profile.comprobanteDomicilioPath ||
            documentType === 'selfie' && user.profile.selfiePath
        ) {
            sendJSONresponse(res,200,{status: 'OK', response: user.profile})
            return
        }
        else {
            sendJSONresponse(res,200, {status: 'PENDING', response: user.profile})
            return
        }       
        
    })
        .catch((err) => {
            console.log(err)
            sendJSONresponse(res,404,{message: err})
            return
        })
}

module.exports.uploadDocument = function(req,res) {
    const userId = req.user.id
    const imageData = req.body.imageData
    const documentType = req.body.documentType
    
    if(!userId || !imageData || !documentType) {
        sendJSONresponse(res,404,{message: 'Ingresa todos los campos requeridos'})
        return
    }

    sequelize.transaction(async (t) => {
        let user = await User.findOne({
            where: {
                id: userId
            },
            include: [
                {
                    model: Profile,                    
                }
            ],
            transaction: t
        })

        if(!user || !user.profile ) {
            sendJSONresponse(res,404,{message: 'El usuario no existe'})
            return
        }

        imageBuffer = new Buffer(imageData, 'base64')
        newName = crypto.randomBytes(16).toString('hex')
        imagePath = './uploads/documents/' + newName + '.jpeg'

        try {
            let saveDocument = new Promise((resolve, reject) => {
                fs.writeFile(imagePath, imageBuffer, (err) => {
                    if(err) {
                        reject(err)
                    }
                    resolve(true)   
                })  
            })

            await saveDocument   
            
            if(documentType === 'ineFrontal') {
                user.profile.ineFrontalPath = imagePath
            } else if (documentType === 'inePosterior') {
                user.profile.inePosteriorPath = imagePath
            } else if (documentType === 'pasaporte') {
                user.profile.pasaportePath = imagePath
            } else if (documentType === 'comprobanteDomicilio') {
                user.profile.comprobanteDomicilioPath = imagePath
            } else if (documentType === 'selfie') {
                user.profile.selfiePath = imagePath
            }

            await user.profile.save({ transaction: t })

            sendJSONresponse(res,200,{status: 'OK', message: 'Document saved correctly'})
            return
        }
        catch(error) {
            console.log(error)
            sendJSONresponse(res,404,{message:'Error saving document'})
            return
        }
    })  
        .catch((err) => {
            console.log(err)
            sendJSONresponse(res,404,{message: err})
            return
        })

}