module.exports = (sequelize,DataTypes) => {
    return sequelize.define('platformversion'),{
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
    }
}