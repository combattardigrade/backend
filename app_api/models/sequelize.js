const Sequelize = require('sequelize')
const UserModel = require('./user')
const AuthRequestModel = require('./authRequest')
const AdminModel = require('./admin')
const ScooterModel = require('./scooter')
const BalanceModel = require('./balance')
const ScooterLocationModel = require('./scooterLocation')
const UserLocationModel = require('./userLocation')
const PriceModel = require('./price')
const TransactionModel = require('./transaction')
const RideModel = require('./ride')
const CardModel = require('./card')
const OrderModel = require('./order')
const ProductModel = require('./product')
const PromoCodeModel = require('./promoCode')
const PromoTransactionModel = require('./promoTransaction')
const PlatformVersionModel = require('./platformVersion')
const PhotoModel = require('./photo')
const PhotoVoteModel = require('./photoVote')

const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD, {
        host: process.env.DB_HOST,
        dialect: 'mysql',
        pool: {
            max: 10,
            min: 0,
            acquire: 30000,
            idle: 10000
        }
    }
)

const User = UserModel(sequelize,Sequelize)
const AuthRequest = AuthRequestModel(sequelize,Sequelize)
const Admin = AdminModel(sequelize,Sequelize)
const Scooter = ScooterModel(sequelize,Sequelize)
const Balance = BalanceModel(sequelize,Sequelize)
const ScooterLocation = ScooterLocationModel(sequelize,Sequelize)
const UserLocation = UserLocationModel(sequelize,Sequelize)
const Price = PriceModel(sequelize,Sequelize)
const Transaction = TransactionModel(sequelize,Sequelize)
const Ride = RideModel(sequelize,Sequelize)
const Card = CardModel(sequelize,Sequelize)
const Order = OrderModel(sequelize,Sequelize)
const Product = ProductModel(sequelize,Sequelize)
const PromoCode = PromoCodeModel(sequelize,Sequelize)
const PromoTransaction = PromoTransactionModel(sequelize,Sequelize)
const PlatformVersion = PlatformVersionModel(sequelize,Sequelize)
const Photo = PhotoModel(sequelize,Sequelize)
const PhotoVote = PhotoVoteModel(sequelize,Sequelize)

User.hasMany(AuthRequest)
AuthRequest.belongsTo(User)
User.hasOne(Admin)
User.hasMany(Balance)
Scooter.hasMany(ScooterLocation)
ScooterLocation.belongsTo(Scooter)
User.hasMany(UserLocation)
UserLocation.belongsTo(User)
User.hasMany(Transaction)
Transaction.belongsTo(User)
User.hasMany(Ride)
Ride.belongsTo(User)
Ride.belongsTo(Scooter)
Ride.hasMany(Transaction)
Transaction.belongsTo(Ride)
User.hasMany(Card)
Card.belongsTo(User)
User.hasMany(Order)
Order.belongsTo(User)
Order.hasOne(Product)
User.hasOne(PromoCode)
PromoCode.belongsTo(User)


sequelize.sync({force: false})
.then(() => {
    console.log('Database & tables created')
})

module.exports = {
    User,
    AuthRequest,
    Admin,
    Scooter,
    Balance,
    ScooterLocation,
    UserLocation,
    Price,
    Ride,
    Transaction,
    Card,
    Order,
    Product,
    PromoCode,
    PromoTransaction,
    PlatformVersion,
    Photo,
    PhotoVote,
    sequelize
}