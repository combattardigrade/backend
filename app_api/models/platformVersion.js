module.exports = (sequelize,DataTypes) => {
    return sequelize.define('platformVersion',{
        platform: {
            type: DataTypes.STRING,
            allowNull: false
        },
        version: {
            type: DataTypes.STRING,
            allowNull: false
        },
        forceUpdate: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0
        }
    })
}