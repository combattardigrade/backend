module.exports = (sequelize,DataTypes) => {
    return sequelize.define('unlockRequest',{
        userId: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        scooterId: {
            type: DataTypes.INTEGER,
            allowNull: false,            
        },
        status: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: 'active'
        }
    })
}