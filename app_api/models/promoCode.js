module.exports = (sequelize,DataTypes) => {
    return sequelize.define('promoCode', {
        userId: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        code: {
            type: DataTypes.STRING,
            allowNull: false
        },
        amount: {
            type: DataTypes.DECIMAL(16,8),
            allowNull: true,
            defaultValue: 0
        },
        currency: {
            type: DataTypes.STRING,
            allowNull: true,
            defaultValue: 'MXN'
        },  
        category: {
            type: DataTypes.STRING,
            allowNull: true,
            defaultValue: 'invite_friends'
        },
        status: {
            type: DataTypes.STRING,
            allowNull: true,
            defaultValue: 'active'
        }
    })
}