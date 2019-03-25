module.exports = (sequelize,DataTypes) => {
    return sequelize.define('price',{
        city: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        minute: {
            type: DataTypes.BIGINT(16),
            allowNull: false,
            defaultValue: 0
        },
        unlock: {
            type: DataTypes.BIGINT(16),
            allowNull: false,
            defaultValue: 0
        },
        minRide: {
            type: DataTypes.INTEGER,
            allowNull: true,
            defaultValue: 5
        },
        tax: {
            type: DataTypes.BIGINT(16),
            allowNull: true,
            defaultValue: 16000000
        },
        currency: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: 'MXN'
        },
    })
}