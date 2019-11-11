module.exports = (sequelize,DataTypes) => {
    return sequelize.define('profile',{
        userId: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        nombre: {
            type: DataTypes.STRING,
            allowNull: true,            
        },
        apellidoPaterno: {
            type: DataTypes.STRING,
            allowNull: true,            
        },
        apellidoMaterno: {
            type: DataTypes.STRING,
            allowNull: true
        },
        email: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        pais: {
            type: DataTypes.STRING,
            allowNull: true
        },
        ciudad: {
            type: DataTypes.STRING,
            allowNull: true
        },
        calle: {
            type: DataTypes.STRING,
            allowNull: true
        },
        ext: {
            type: DataTypes.STRING,
            allowNull: true
        },
        int: {
            type: DataTypes.STRING,
            allowNull: true 
        },
        colonia: {
            type: DataTypes.STRING,
            allowNull: true
        },
        municipio: {
            type: DataTypes.STRING,
            allowNull:  true
        },
        codigoPostal: {
            type: DataTypes.STRING,
            allowNull: true
        },
        tipoIdentificacion: {
            type: DataTypes.STRING,
            allowNull: true
        },
        ineFrontalPath: {
            type: DataTypes.STRING,
            allowNull: true
        },
        inePosteriorPath: {
            type: DataTypes.STRING,
            allowNull: true
        },
        pasaportePath: {
            type: DataTypes.STRING,
            allowNull: true
        },
        comprobanteDomicilioPath: {
            type: DataTypes.STRING,
            allowNull: true
        },
        selfiePath: {
            type: DataTypes.STRING,
            allowNull: true
        },
        signupSource: {
            type: DataTypes.STRING,
            allowNull: true,            
        }
    })
}