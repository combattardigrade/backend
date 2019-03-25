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
        hash: {
            type: DataTypes.STRING,
            allowNull: false
        },
        birthday: {
            type: DataTypes.DATE,
            allowNull: true           
        },
        bluetoothMAC: {
            type: DataTypes.STRING,
            allowNull: true
        },
        battery: {
            type: DataTypes.STRING,
            allowNull: true
        },
        city: {
            type: DataTypes.STRING,
            allowNull: false
        },
        status: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: 'inManufacture'
        },
        lat: {            
            type: DataTypes.STRING,
            allowNull: true,
            defaultValue: '0'          
        },
        lng: {            
            type: DataTypes.STRING,
            allowNull: true,
            defaultValue: '0'          
        }           
    })
}