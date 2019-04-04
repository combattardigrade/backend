module.exports = (sequelize,DataTypes) => {
    return sequelize.define('transaction',{
        userId: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        rideId: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        operation: {
            type: DataTypes.STRING,
            allowNull: false
        },
        total: {
            type: DataTypes.DECIMAL(16,8),
            allowNull: true,
            defaultValue: 0
        },
        currency: {
            type: DataTypes.STRING,
            allowNull: true,
            defaultValue: 'MXN'
        },
        amount: {
            type: DataTypes.DECIMAL(16,8),
            allowNull: true,
            defaultValue: 0           
        },
        tax: {
            type: DataTypes.DECIMAL(16,8),
            allowNull: true,
            defaultValue: 0 
        }              
    })
}