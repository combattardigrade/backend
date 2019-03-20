var express = require('express');
var router = express.Router()
const jwt = require('express-jwt')
const auth = jwt({
    secret: process.env.JWT_SECRET
})

const authenticationController = require('../controllers/authentication')
const adminController = require('../controllers/admin')
// const userController = require('../controllers/user')

// authentication
router.post('/auth/phone',authenticationController.phone)
// resend code
router.post('/auth/phone/resendCode',authenticationController.resendPhoneCode)
// verify code
router.post('/auth/phone/confirmCode',authenticationController.confirmCode)

router.post('/auth/email/signup',authenticationController.emailSignup)
router.post('/auth/email/login',authenticationController.emailLogin)

// admin
router.post('/admin/givePrivileges',auth,adminController.givePrivileges)
router.get('/admin/checkPrivileges/:email',adminController.checkPrivileges)

module.exports = router