module.exports = (sequelize,DataTypes) => {
    return sequelize.define('order', {
        userId: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        productId: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        unitPrice: {
            type: DataTypes.DECIMAL(16,8),
            allowNull: false,
            defaultValue: 0
        },
        quantity: {
            type: DataTypes.INTEGER,
            allowNull: true,
            defaultValue: 1
        },
        total: {
            type: DataTypes.DECIMAL(16,8),
            allowNull: false,
            defaultValue: 0
        },
        currency: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: 'MXN'
        },
        expirationDate: {
            type: DataTypes.DATE,
            allowNull: false,
        },
        paymentMethod: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: 'mercadopago'
        },
        hash: {
            type: DataTypes.STRING,
            allowNull: false,            
        },
        status: {
            type: DataTypes.STRING,
            allowNull: true,
            defaultValue: 'pending'
        },
        checkoutUrl: {
            type: DataTypes.STRING,
            allowNull: true
        }
    })
}