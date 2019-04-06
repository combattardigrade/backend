module.exports = (sequelize,DataTypes) => {
    return sequelize.define('authRequest',{
        userId: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        action: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        code: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        data: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        used: {
            type: DataTypes.INTEGER,
            allowNull: true,
            defaultValue: 0
        }
    })
}