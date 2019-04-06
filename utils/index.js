

module.exports.sendJSONresponse = function(res,status,content) {
    res.status(status)
    res.json(content)
}

module.exports.printMoney = function(amount,currency) {
    return '$' + ((amount / 100000000)).toFixed(2) + ' ' + currency
}

module.exports.validateEmail = function(email) {
    var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
}