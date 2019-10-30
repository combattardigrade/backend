module.exports = (sequelize,DataTypes) => {
    return sequelize.define('report',{        
        userId: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        vehicleId: {
            type: DataTypes.INTEGER,
            allowNull: true
        },
        problem: {
            type: DataTypes.STRING,
            allowNull: false
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true
        },        
        comment: {
            type: DataTypes.TEXT,
            allowNull: true
        },          
        photoPath: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        lat: {
            type: DataTypes.STRING,
            allowNull: true
        },
        lng: {
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