const express = require('express')
const router = express.Router()
const jwt = require('express-jwt')
const auth = jwt({
    secret: process.env.JWT_SECRET,
    getToken: function(req) {
        if(req.cookies.adminToken !== undefined) {
            return req.cookies.adminToken
        } else {
            throw new Error('missing_admin_token_cookie')
        }
    }
})
const Recaptcha = require('express-recaptcha').Recaptcha
const recaptcha = new Recaptcha(process.env.RECAPTCHA_SITE_KEY,process.env.RECAPTCHA_SECRET_KEY)

const adminController = require('../controllers/admin')

// admin
router.get('/login',adminController.renderLogin)
router.post('/login', recaptcha.middleware.verify,adminController.login)

// dashboard
router.get('/dashboard',auth,adminController.renderDashboard)

// scooters 
router.get('/scooters/new', auth, adminController.renderNewScooter)
router.post('/scooters/new',  auth, adminController.createNewScooter)
router.get('/scooters/:status', auth, adminController.renderScooters)


// users
router.get('/users/all', auth, adminController.renderUsers)

module.exports = router