

module.exports.sendJSONresponse = function(res,status,content) {
    res.status(status)
    res.json(content)
}

module.exports.printMoney = function(amount,currency) {
    return '$' + ((amount / 100000000)).toFixed(2) + ' ' + currency
}

