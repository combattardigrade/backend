module.exports = (sequelize,DataTypes) => {
	return sequelize.define('admin',{
		userId: {
			type: DataTypes.INTEGER,
			allowNull: false,
		},
		level: {
            type: DataTypes.INTEGER,
            allowNull: true,
            defaultValue: 0
        }
	})
}