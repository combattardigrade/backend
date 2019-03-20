const request = require('request')
const API_HOST = process.env.API_HOST
const SERVER_HOST = process.env.SERVER_HOST

module.exports.renderLogin = function(req,res) {
    res.render('admin/login',{
        host: process.env.SERVER_HOST,
        title: 'Iniciar sesion',
        csrf: req.csrfToken(),
        captcha: true
    })
}

module.exports.login = function(req,res) {
    if(req.recaptcha.error) {
        res.render('admin/login', {
            host: SERVER_HOST,
            title: 'Iniciar sesion',
            csrf: req.csrfToken(),
            serverMsg: 'Verifica que eres humano',
            captcha: true
        })
        return
    }

    const email = req.body.email
    const password = req.body.password

    const options = {
        url: API_HOST + '/login',
        method: 'POST',
        json: { email: email, password: password }
    }

}