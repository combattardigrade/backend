module.exports = (sequelize,DataTypes) => {
    return sequelize.define('registrationKey',{
        userId: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        registrationId: {
            type: DataTypes.TEXT,
            allowNull: false
        }
    })
}