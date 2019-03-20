module.exports = (sequelize,DataTypes) => {
    return sequelize.define('userLocation',{
        userId: {
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
        },
        location: {
            type: DataTypes.GEOMETRY('POINT'),
            allowNull: true
        }
    })
}