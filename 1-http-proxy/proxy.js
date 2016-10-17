const print = console.log.bind()
const net = require('net')
const fetchRemote = require('./dbRoutes.js').getParser
const isAcceptConnect = require('./dbRoutes.js').isAcceptConnect

const HOST = '127.0.0.1'
const PORT = 2333

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

const listener = (sock) => {
    if (!isAcceptConnect(sock.remoteAddress, sock.remotePort)) return sock.destroy()
    print('server: new connection')
    sock.on('data', (data) => {
        const {isHTTPRequest, host, port} = parseHeader(data.toString())
        if (isHTTPRequest) {
            fetchRemote(host, port, data)
                .then((res) => {
                    // print('will write: ', res.toString())
                    sock.write(res)
                })
                .catch((e) => {
                    print('fetch error: ', e)
                })
        } else {
            print(`#unexpected error: ${data.toString()}`)
        }
    })
    sock.on('end', () => { /*print('#sock end');*/ sock.end() })
    sock.on('close', (err) => { if (err) {print('#sock closed, hasError: ', err); sock.destroy()} })
    sock.on('error', (err) => { print('#sock error: ', err) })
}

let server = net.createServer(listener)
server.listen(PORT, HOST)
