const crypto = require('crypto')
const jwt = require('jsonwebtoken')

module.exports = (sequelize,DataTypes) => {
    const User = sequelize.define('user',{
        phone: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        countryCode: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: '+521'
        },
        accountLevel: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0
        }
    })

    User.prototype.generateJwt = () => {
        const expiry = new Date()
        expiry.setDate(expiry.getDate() + 30)
        return jwt.sign({
            id: this.id,
            phone: this.phone,
            accountLevel: this.accountLevel,
			exp: parseInt(expiry.getTime() / 1000)
        },process.env.JWT_SECRET)
    }

    return User
}