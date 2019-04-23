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
        status: {
            type: DataTypes.STRING,
            allowNull: true,
            defaultValue: 'active'
        }
    })
}