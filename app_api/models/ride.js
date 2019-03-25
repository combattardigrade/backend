module.exports = (sequelize,DataTypes) => {
    return sequelize.define('ride',{
        userId: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        scooterId: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        startLat: {
            type: DataTypes.STRING,
            allowNull: true
        },
        startLng: {
            type: DataTypes.STRING,
            allowNull: true
        },
        endLat: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        endLng: {
            type: DataTypes.STRING,
            allowNull: true,
        },        
        endTimestamp: {
            type: DataTypes.DATE,
            allowNull: true
        } 
    })
}