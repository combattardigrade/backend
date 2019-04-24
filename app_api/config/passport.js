const passport = require('passport')
var localStrategy = require('passport-local').Strategy;
var User = require('../models/sequelize').User;
var AuthRequest = require('../models/sequelize').AuthRequest;
var moment = require('moment');

passport.use(new localStrategy({
    usernameField: 'email'
},
    function(username,password,done) {
        User.findOne({
            where: {
                email: username
            }
        })
        .then(function(user){
            if(!user) {
                return done(null, false, {
                    message: 'El usuario no existe o la contraseña es incorrecta'
                })
            }

            if(!user.validPassword(password)){
                return done(null, false, {
                    message: 'El usuario no existe o la contraseña es incorrecta'
                })
            }

            if(user.emailVerified == 0) {
                AuthRequest.findOne({
                    where: {
                        userId: user.id,
                        action: 'emailVerification',
                        used: 0
                    }
                })
                .then((request) => {
                    console.log(request)
                    if(request.updatedAt >= moment().subtract(10,'minutes')) {
                        return done(null, false, {message: 'Revisa tu email para activar la cuenta'})                        
                    }

                    let url = 'http://localhost:3000/api/auth/emailVerification/' + request.code

                    /*emailController.sendActivationEmail({email: user.email, url: url}, function() {
                        request.changed('updatedAt', true)
                        
                    })*/
                    return done(null, false, {message: 'Revisa tu email para activar la cuenta'})
                })
                .catch((err) => {
                    console.log(err)
                    return
                })
            } else {
                let token = user.generateJwt()
                return done(null,token)
            }
        })
    }
))

