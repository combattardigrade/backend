module.exports = (sequelize,DataTypes) => {
    return sequelize.define('vehicleReview',{
        vehicleId: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        userId: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        rideId: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        rating: {
            type: DataTypes.STRING,
            allowNull: false           
        },
        review: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        city: {
            type: DataTypes.STRING,
            allowNull: true
        },        
        status: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: 'active'            
        },                
    })
}