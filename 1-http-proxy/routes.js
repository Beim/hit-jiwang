const print = console.log.bind()
const net = require('net')
const fetchObj = {}

const statusCode = {
    '200': 'OK',
    '301': 'Moved Permanently',
    '302': 'Found',
    '303': 'See Other',
    '304': 'Not Modified',
    '400': 'Bad Request',
    '403': 'Forbidden',
    '404': 'NOT FOUND',
    '500': 'Internal Server Error',
    '502': 'Bad Gateway',
    '503': 'Service Unvailable'
}

const createResponse = (body, options = {}, status = 200) => {
    if (!statusCode[status]) status = 404
    let result = `HTTP/1.1 ${status} ${statusCode[status]}\r\n`
    let plainOpt = {
        'is-proxy': true,
        'Content-Type': `text/plain; charset=utf-8`,
        'Content-Length': Buffer.byteLength(body),
        'Date': new Date().toGMTString(),
        'Connection': 'keep-alive',
        'Last-Modified': new Date().toGMTString()
    }
    for (let i in options) plainOpt[i] = options[i]
    for (let i in plainOpt) result += `${i}: ${plainOpt[i]}\r\n`
    result += `\r\n${body}`
    return result
}

// ---------------------------------------------------------------------------------

/**
 * @param headInfo Object
 * @param data Buffer
 * @param client net.Socket
 * @return Promise
 */
fetchObj.fetchRemote = (headInfo, data, client = new net.Socket()) => {
    let host = headInfo.host
        ,port = headInfo.port
        ,url = headInfo.url
    return new Promise((rsl, rej) => {
        let resArr = []
        client.connect(port, host, () => {
            client.end(data)
        })
        client.on('data', (chunk) => { resArr.push(chunk) })
        client.on('end', () => {
            rsl(Buffer.concat(resArr))
        })
        client.on('close', (err) => {
            if (err) print('client: closed, hasError: ', err)
        })
        client.on('error', (e) => rej(e))
    })
}

fetchObj.fetchForbid = (...args) => {
    return new Promise((rsl, rej) => {
        rsl(createResponse('禁止访问'))
    })
}

fetchObj.fetchBaidu = (headInfo, data, client = new net.Socket()) => {
    return new Promise((rsl, rej) => {
        let response = createResponse('这是谷歌~')
        rsl(response)
    })
}

module.exports = fetchObj
