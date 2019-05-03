module.exports = (sequelize,DataTypes) => {
    return  sequelize.define('photoVote', {
        photoId: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        scooterId: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        userId: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        vote: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: 'no'
        }
    })
}