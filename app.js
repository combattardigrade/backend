require('dotenv').load()
const cors = require('cors')
const express = require('express')
const path = require('path')
const favicon = require('serve-favicon')
const bodyParser = require('body-parser')
var passport = require('passport')
const fileUpload = require('express-fileupload')
const csurf = require('csurf')
const cookieParser = require('cookie-parser')

require('./app_api/config/passport')
const routes = require('./app_server/routes/index')
const routesApi = require('./app_api/routes/index')
const routesAdmin = require('./app_server/routes/admin')
const app = express()

// app.use(favicon(path.join(__dirname ,'public','favicon','favicon.ico')));
app.use(cors({ origin: '*' }))
app.use(fileUpload({ limits: { fileSize: 10 * 1024 * 1024 } }))

// view engine setup
app.set('views', path.join(__dirname, 'app_server', 'views'))
app.set('view engine', 'pug')

app.use(bodyParser.json({ limit: '50mb' }))
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }))
app.use(express.static(path.join(__dirname, 'public')))
app.use(passport.initialize())
app.use('/api', routesApi)
// csrf and cookies
app.use(cookieParser())
app.use(csurf({ cookie: true }))
// app.use('/',routes)
app.use('/admin',routesAdmin) 

// error handlers
// catch unauthorized errors
app.use((err, req, res, next) => {
    if (err.name === 'UnauthorizedError') {
        res.status(401)
        res.json({ message: err.name + ': ' + err.message })
    } else if (err.code === 'EBADCSRFTOKEN') {
        res.status(403)
        res.send('CSRF verification failed')
    } else if (err.message === 'missing_admin_token_cookie') {
        res.writeHead(302, {
            Location: process.env.SERVER_HOST + '/admin/login'
        })
        res.end()
    } else if (err.message === 'missing_token_cookie') {
        res.writeHead(302, {
            'Location': process.env.SERVER_HOST + '/login'
        });
        res.end();
    }    
})

if(process.env.NODE_ENV === 'production'){
	app.set('port',process.env.PORT || 3000);
	app.listen(app.get('port'),function(){
		console.log('Listening on port ' + app.get('port'));
	});
} else if(process.env.NODE_ENV === 'dev'){
	app.set('port',process.env.PORT || 3000);
	app.listen(app.get('port'),function(){
		console.log('Listening on port ' + app.get('port'));
	});
}

module.exports = app