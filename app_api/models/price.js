module.exports = (sequelize,DataTypes) => {
    return sequelize.define('price',{
        city: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        minute: {
            type: DataTypes.DECIMAL(16,8),
            allowNull: false,
            defaultValue: 0
        },
        unlock: {
            type: DataTypes.DECIMAL(16,8),
            allowNull: false,
            defaultValue: 0
        },
        minRide: {
            type: DataTypes.INTEGER,
            allowNull: true,
            defaultValue: 5
        },
        tax: {
            type: DataTypes.DECIMAL(16,8),
            allowNull: true,
            defaultValue: 0.16
        },
        currency: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: 'MXN'
        },
    })
}