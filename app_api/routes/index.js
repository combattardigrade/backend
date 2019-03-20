var express = require('express');
var router = express.Router()
const jwt = require('express-jwt')
const auth = jwt({
    secret: process.env.JWT_SECRET
})

const authenticationController = require('../controllers/authentication')
const adminController = require('../controllers/admin')
const scooterController = require('../controllers/scooter')
const userController = require('../controllers/user')
const orderController = require('../controllers/order')

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
// admin => scooters
router.get('/admin/scooters/count/:status', auth, scooterController.countByStatus)
router.get('/admin/scooters/getAllByPage/:status/:page', auth, scooterController.getAllByPage)
// admin => users
router.get('/admin/users/countAll', auth, userController.countAll)
router.get('/admin/users/getAllByPage/:page', auth, userController.getAllByPage)
// admin => orders
router.get('/admin/orders/count/:status', auth, orderController.countByStatus);


module.exports = router