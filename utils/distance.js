module.exports.calculateDistance = function (prevLocation, currentLocation) {
    let r = 6371000 // meters
    let dLat = toRadians(currentLocation.lat - prevLocation.lat)
    let dLon = toRadians(currentLocation.lng - prevLocation.lng)
    let lat1 = toRadians(prevLocation.lat)
    let lat2 = toRadians(currentLocation.lat)
    let a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2)
    let c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    let d = r * c
    return d
}

// Converts numeric degrees to radians
function toRadians(num) {
    return num * Math.PI / 180
}