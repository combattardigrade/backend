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
const paymentController = require('../controllers/payment')
const productController = require('../controllers/product')
const promoCodeController = require('../controllers/promoCode')
const userLocationController = require('../controllers/userLocation')
const platformVersionController = require('../controllers/platformVersion')
const photoController = require('../controllers/photo')

const testController = require('../controllers/test')

// authentication
router.post('/auth/phone', authenticationController.phone)
// resend code
router.post('/auth/phone/resendCode', authenticationController.resendPhoneCode)
// verify sms code
router.post('/auth/phone/confirmCode', authenticationController.confirmCode)
router.post('/auth/phone/confirmCodePhoneChange', auth, authenticationController.confirmCodePhoneChange)
// email auth
router.post('/auth/email/signup', authenticationController.emailSignup)
router.post('/auth/email/login', authenticationController.emailLogin)
router.get('/auth/email/activate/:hash', authenticationController.activateEmail)

// user 
router.get('/user/data', auth, userController.getData)
router.post('/user/changeName', auth, userController.changeName)
router.post('/user/changeEmail', auth, userController.changeEmail)
router.post('/user/changePhone', auth, userController.changePhone)

// payment methods
router.post('/payment/saveCard', auth, paymentController.saveCard)

// orders
router.post('/order/create', auth, orderController.createOrder)
router.post('/order/mp/notifications', orderController.mpNotifications)

// products
router.get('/products/:currency', auth, productController.getAll)

// promo code
router.get('/promoCode', auth, promoCodeController.getCode)
router.get('/promos/history', auth, promoCodeController.getHistory)
router.post('/promos/redeem', auth, promoCodeController.redeemCode)

// scooters
router.post('/scooters/getActivationData', auth, scooterController.getActivationData)
//router.get('/scooters/getNearLocation', auth, scooterController.getNearLocation)

// location
router.post('/locations/user/saveLocation', auth, userLocationController.saveLocation)
router.get('/locations/scooter/saveLocation', scooterLocationController.saveScooterLocation)
router.get('/locations/scooter/getScootersNearLocation', auth, scooterLocationController.getScootersNearLocation)

// scooter => photos
router.get('/scooter/photo', auth, photoController.getPhoto)
router.post('/scooter/photo', auth, photoController.uploadPhoto)

// price
router.get('/prices/:city', auth, priceController.getPrices)

// user => balance
router.get('/user/balance/:currency', auth, balanceController.getBalance)

// rides
router.post('/ride/start', auth, rideController.startRide)
router.post('/ride/end', auth, rideController.endRide)
router.post('/ride/checkNewRide', auth, rideController.checkNewRide)
router.get('/ride/current', auth, rideController.getRideData)
router.get('/ride/checkStatus', auth, rideController.checkRideStatus)
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
// admin => products
router.post('/admin/product/create', auth, productController.createProduct)
// admin => version
router.post('/admin/version', auth, platformVersionController.createVersion)
router.get('/admin/version/:platform', platformVersionController.getVersion)
router.put('/admin/version', auth, platformVersionController.updateVersion)
router.delete('/admin/version/:platform', auth, platformVersionController.deleteVersion)
router.get('/admin/appstore', platformVersionController.checkiOSReview)

router.get('/test/sms', testController.sendSms)
router.get('/test', testController.test)

module.exports = router