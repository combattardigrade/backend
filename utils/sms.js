const Nexmo = require('nexmo')

var nexmo = new Nexmo({
    apiKey: process.env.NEXMO_API_KEY,
    apiSecret: process.env.NEXMO_API_SECRET    
})


module.exports = nexmo


