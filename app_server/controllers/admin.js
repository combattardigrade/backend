const request = require('request')
const rp = require('request-promise')
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
        url: API_HOST + '/auth/email/login',
        method: 'POST',
        json: { email: email, password: password }
    }

    request(options, function(err, response, body) {
        const token = body.token
        if(token) {
            request({
                url: API_HOST + '/admin/checkPrivileges/' + email,
                method: 'GET'
            }, function(errAdmin, responseAdmin, bodyAdmin) {
                var bodyAdmin = JSON.parse(bodyAdmin)
                if('admin' in bodyAdmin) {
                    if(bodyAdmin.admin.level > 0) {
                        // to do: set cookie exp time and secure for production
                        if(process.env.NODE_ENV == 'production') {
                            // set cookie
                            res.cookie('adminToken',token,{httpOnly: true, secure: true})
                        } else {
                            // set cookie
                            res.cookie('adminToken',token,{httpOnly:true})
                        }
                        // redirect to dashboard
                        res.writeHead(302,{
                            'Location': 'dashboard'
                        })
                        res.end()
                    }
                } else {
                    res.render('admin/login', {
                        title: 'Iniciar sesion',
                        csrf:req.csrfToken(),
                        'serverMsg': bodyAdmin.message,
                        captcha: true
                    })
                }
            })
        } else {
            res.render('admin/login', {
                title: 'Iniciar sesion',
                csrf:req.csrfToken(),
                'serverMsg': body.message,
                captcha: true
            })
        }
    })
}

module.exports.renderDashboard = function(req,res) {
    const options1 = {
        url: API_HOST + '/admin/users/countAll',
        method: 'GET',
        headers: {
            'Authorization': 'Bearer ' + req.cookies.adminToken
        } 
    }
    const options2 = {
        url: API_HOST + '/admin/scooters/count/all',
        method: 'GET',
        headers: {
            'Authorization': 'Bearer ' + req.cookies.adminToken
        } 
    }
    const options3 = {
        url: API_HOST + '/admin/scooters/count/all',
        method: 'GET',
        headers: {
            'Authorization': 'Bearer ' + req.cookies.adminToken
        } 
    }
   

    Promise.all([rp(options1),rp(options2)])
    .then((values) => {
        let users = JSON.parse(values[0])
        let scooters = JSON.parse(values[1])
        
        res.render('admin/dashboard',{
            host: SERVER_HOST,
            title: 'Dashboard',
            data: {
                users,
                scooters,
            }
        })
        return
    }) 
}

module.exports.logout = function(req,res) {
    res.clearCookie('token')
    res.writeHead(302, {
        'Location': 'login'
    })
    res.end()
}