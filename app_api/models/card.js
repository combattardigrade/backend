module.exports = (sequelize, DataTypes) => {
    return sequelize.define('card', {
        userId: {
            type: DataTypes.INTEGER,
            alloNull: false
        },
        expirationMonth: {
            type: DataTypes.INTEGER,
            allowNull: true
        },
        expirationYear: {
            type: DataTypes.INTEGER,
            allowNull: true
        },
        firstSixDigits: {
            type: DataTypes.INTEGER,
            allowNull: true
        },
        lastFourDigits: {
            type: DataTypes.INTEGER,
            allowNull: true
        },
        securityCodeLength: {
            type: DataTypes.STRING,
            allowNull: true
        },
        paymentMethod: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        cardHolder: {
            type: DataTypes.STRING,
            allowNull: true
        },
        customerId: {
            type: DataTypes.STRING,
            allowNull: true
        },
        cardId: {
            type: DataTypes.STRING,
            allowNull: true
        }    
    })
}