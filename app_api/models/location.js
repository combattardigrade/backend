module.exports = (sequelize,DataTypes) => {
    return sequelize.define('location',{
        scooterId: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        lat: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: '0'
        },
        lng: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: '0'
        }
    })
}