const net = require('net')
const fetchRemote = require('./dbRoutes.js').getParser

const HOST = '127.0.0.1'
const PORT = 2333

const listener = (sock) => {
    console.log('server: new connection')
    sock.on('data', (data) => {
        const {isHTTPRequest, host, port} = parseHeader(data.toString())
        if (isHTTPRequest) {
            fetchRemote(host, port, data)
                .then((res) => {
                    console.log('will write: ', res.toString())
                    sock.write(res)
                })
                .catch((e) => {
                    console.log('fetch error: ', e)
                })
        } else {
            console.log(`#unexpected error: ${data.toString()}`)
        }
    })
    sock.on('end', () => { console.log('sock end'); sock.end() })
    sock.on('close', (err) => { console.log('sock closed, hasError: ', err) })
    sock.on('error', (e) => { console.log('#sock error: ', e) })
}

const parseHeader = (header) => {
    let isHTTPRequest = header.match(/(GET|POST|DELETE|PUT|OPTIONS|CONNECT) (.*) HTTP/)
    let hostInfo = header.match(/Host: (.*)\r/)
    if (!isHTTPRequest || !hostInfo) return {isHTTPRequest: false}
    hostInfo = hostInfo[1].split(':')
    return {
        isHTTPRequest: true,
        host: hostInfo[0],
        port: hostInfo[1] ? hostInfo[1] : 80
    }
}

let server = net.createServer(listener)
server.listen(PORT, HOST)
