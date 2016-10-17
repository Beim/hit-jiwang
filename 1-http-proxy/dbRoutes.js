const routes = require('./routes.js')

const notAcceptConnect = [
    {
        address: /127\.0\.0\.1/,
        port: /8888/
    }
]

const dbForbidRoutes = [
    /github.com/,
    /evernote.com/
]
const dbAllowRoutes = [
    {
        patt: /google.com/,
        parser: 'fetchBaidu'
    },
    {
        patt: /.*/,
        parser: 'fetchRemote'
    }
]

// ---------------------------------------------------------------------

const dbRoutes = ((forbid, allow) => {
    let res = []
    for (let i of forbid) res.push({patt: i, parser: routes.fetchForbid})
    for (let i of allow) res.push({patt: i.patt, parser: routes[i.parser]})
    return res
})(dbForbidRoutes, dbAllowRoutes)

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
