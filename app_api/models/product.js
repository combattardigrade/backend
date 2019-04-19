module.exports = (sequelize,DataTypes) => {
    return sequelize.define('product',{
        title: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        unitPrice: {
            type: DataTypes.DECIMAL(16,8),
            allowNull: false,
            defaultValue: 0
        },
        currency: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: 0
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        hash: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        status: {
            type: DataTypes.STRING,
            allowNull: true,
            defaultValue: 'active'
        }
    })
}