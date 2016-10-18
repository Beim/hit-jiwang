const routes = require('./routes.js')

const notAcceptConnect = ((arr) => {
    let resArr = []
    for (let item of arr) {
        let obj = {}
        for (let i in item) {
            obj[i] = new RegExp(item[i])
        }
        resArr.push(obj)
    }
    return resArr
})(require('./DB/refuseHost.json'))

const dbForbidRoutes = ((arr) => {
    let resArr = []
    for (let item of arr) {
        resArr.push(new RegExp(item))
    }
    return resArr
})(require('./DB/forbidRoutes.json'))

const dbAllowRoutes = ((arr) => {
    let resArr = []
    for (let item of arr) {
        resArr.push({
            patt: new RegExp(item.patt),
            parser: item.parser
        })
    }
    return resArr
})(require('./DB/allowRoutes.json'))

const dbRoutes = ((forbid, allow) => {
    let res = []
    for (let i of forbid) res.push({patt: i, parser: routes.fetchForbid})
    for (let i of allow) res.push({patt: i.patt, parser: routes[i.parser]})
    return res
})(dbForbidRoutes, dbAllowRoutes)

// ---------------------------------------------------------------------

/**
 * @param info Array
 * @param info[0] => {host, port, url}
 * @param info[1] => data
 * @return parser Object
 */
const getParser = (...info) => {
    let parser = null
        ,host = info[0].host
        ,port = info[0].port
    for (let item of dbRoutes) {
        if (item.patt.test(host)) {
            parser = item.parser
            break
        }
    }
    return parser.call(null, ...info)
}

/**
 * @param address String
 * @param port Number
 * @return Boolean
 */
const isAcceptConnect = (address, port) => {
    for (let item of notAcceptConnect) {
        let isRefuse = item.address.test(address)
        if (item.port) isRefuse = (isRefuse && item.port.test(port))
        if (isRefuse) return false
    }
    return true
}

module.exports = {
    getParser,
    isAcceptConnect,
}
