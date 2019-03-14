module.exports = (sequelize,DataTypes) => {
    return sequelize.define('scooter',{
        code: {
            type: DataTypes.STRING,
            allowNull: false
        },
        batch: {
            type: DataTypes.STRING,
            allowNull: false
        },
        birthday: {
            type: DataTypes.DATE,
            allowNull: false           
        },
        battery: {
            type: DataTypes.STRING,
            allowNull: false
        },
        city: {
            type: DataTypes.STRING,
            allowNull: false
        },
        status: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: 'inManufacture'
        }        
    })
}