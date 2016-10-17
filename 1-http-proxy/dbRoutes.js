const routes = require('./routes.js')

const dbRoutes = [
    {
        patt: /baidu.com/,
        parser: routes.fetchBaidu
    },
    {
        patt: /.*/,
        parser: routes.fetchRemote
    }
]

/**
 * @param info Array
 * @param info[0] => desHost
 * @[param] info[1] => desPort
 * @return parser Object
 */
const getParser = (...info) => {
    let parser = null
    let host = info[0]
    let port = info[1]
    for (let item of dbRoutes) {
        if (item.patt.test(host)) {
            parser = item.parser
            break
        }
    }
    return parser.call(null, ...info)
}

module.exports = {
    getParser
}
