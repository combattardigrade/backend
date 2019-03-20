const Sequelize = require('sequelize')
const UserModel = require('./user')
const AuthRequestModel = require('./authRequest')
const AdminModel = require('./admin')

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

User.hasMany(AuthRequest)
AuthRequest.belongsTo(User)
User.hasOne(Admin)

sequelize.sync({force: false})
.then(() => {
    console.log('Database & tables created')
})

module.exports = {
    User,
    AuthRequest,
    Admin,
    sequelize
}