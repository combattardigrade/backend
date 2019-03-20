const crypto = require('crypto')
const jwt = require('jsonwebtoken')

module.exports = (sequelize,DataTypes) => {
    const User = sequelize.define('user',{
        phone: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        countryCode: {
            type: DataTypes.STRING,
            allowNull: true,
            defaultValue: '+521'
        },
        phoneVerified: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0
        },
        email: {
            type: DataTypes.STRING,
            allowNull: true,            
        },
        hash: {
            type: DataTypes.STRING,
            allowNull: true            
        },
        salt: {
            type: DataTypes.STRING,
            allowNull: true
        },
        emailVerified: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0
        }
    })

    User.prototype.setPassword = function(password) {
        this.salt = crypto.randomBytes(16).toString('hex')
        this.hash = crypto.pbkdf2Sync(password,this.salt,1000,64,'sha512').toString('hex');
    }

    User.prototype.validPassword = function(password) {
        var hash = crypto.pbkdf2Sync(String(password),this.salt,1000,64,'sha512').toString('hex');
        return this.hash === hash
    }

    User.prototype.generateJwt = function() {
        const expiry = new Date()
        expiry.setDate(expiry.getDate() + 30)        
        return jwt.sign({
            id: this.id,
            phone: this.phone,
            email: this.email,
            accountLevel: this.accountLevel,
			exp: parseInt(expiry.getTime() / 1000)
        }, process.env.JWT_SECRET)
    }

    return User
}