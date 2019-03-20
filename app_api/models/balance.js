module.exports = (sequelize,DataTypes) => {
    return sequelize.define('balance',{
        userId: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        amount: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: '0'
        },
        currency: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: 'MXN'
        }
    })
}