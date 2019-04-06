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
const scooterLocationController = require('../controllers/scooterLocation')
const balanceController = require('../controllers/balance')
const priceController = require('../controllers/price')
const rideController = require('../controllers/ride')

const testController = require('../controllers/test')

// authentication
router.post('/auth/phone', authenticationController.phone)
// resend code
router.post('/auth/phone/resendCode', authenticationController.resendPhoneCode)
// verify code
router.post('/auth/phone/confirmCode', authenticationController.confirmCode)
// email auth
router.post('/auth/email/signup', authenticationController.emailSignup)
router.post('/auth/email/login', authenticationController.emailLogin)
router.get('/auth/email/activate/:hash', authenticationController.activateEmail)

// user 
router.post('/user/changeName', auth, userController.changeName)
router.post('/user/changeEmail', auth, userController.changeEmail)

// scooters
router.post('/scooters/getActivationData', auth, scooterController.getActivationData)
//router.get('/scooters/getNearLocation', auth, scooterController.getNearLocation)

// location
router.post('/locations/scooter/saveScooterLocation', scooterLocationController.saveScooterLocation)
router.get('/locations/scooter/getScootersNearLocation', auth, scooterLocationController.getScootersNearLocation)

// price
router.get('/prices/:city', auth, priceController.getPrices)

// user => balance
router.get('/user/balance/:currency', auth, balanceController.getBalance)

// rides
router.post('/ride/start', auth, rideController.startRide)
router.post('/ride/end', auth, rideController.endRide)
router.post('/ride/checkNewRide', auth, rideController.checkNewRide)
router.get('/ride/current', auth, rideController.getRideData)
router.get('/rides/history', auth, rideController.getRideHistory)

// admin
router.post('/admin/givePrivileges',auth,adminController.givePrivileges)
router.get('/admin/checkPrivileges/:email',adminController.checkPrivileges)
// admin => scooters
router.post('/admin/scooter/create', auth, scooterController.create)
router.get('/admin/scooters/count/:status', auth, scooterController.countByStatus)
router.get('/admin/scooters/getAllByPage/:status/:page', auth, scooterController.getAllByPage)
// admin => users
router.get('/admin/users/countAll', auth, userController.countAll)
router.get('/admin/users/getAllByPage/:page', auth, userController.getAllByPage)
// admin => orders
router.get('/admin/orders/count/:status', auth, orderController.countByStatus);

router.get('/test/sms', testController.sendSms)
router.get('/test', testController.test)

module.exports = router