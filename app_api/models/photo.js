module.exports = (sequelize,DataTypes) => {
    return  sequelize.define('photo', {
        userId: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        path: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        rideId: {
            type: DataTypes.INTEGER,
            allowNull:  false,
        },
        lat: {
            type: DataTypes.STRING,
            allowNull: true
        },
        lng: {
            type: DataTypes.STRING,
            allowNull: true
        }
    })
}