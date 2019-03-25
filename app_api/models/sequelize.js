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
const RideModel = require('./Ride')

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
Ride.belongsTo(Ride)
Ride.hasMany(Transaction)
Transaction.belongsTo(Ride)


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
    Transaction,
    sequelize
}