const print = console.log.bind()
const net = require('net')
const fetchRemote = require('./dbRoutes.js').getParser
const isAcceptConnect = require('./dbRoutes.js').isAcceptConnect

const HOST = '127.0.0.1'
const PORT = 2333

let catchInfo = {}

const diffHeaderAndBody = (data) => {
    data = data.toString()
    let arr = data.split('\r\n\r\n')
    if (arr.length < 2) arr = data.split('\r\n\n')
    return {
        header: arr[0],
        body: arr[1]
    }
}

const parseResHeader = (header) => {
    header = header.split('\r\n'); header = header.slice(0, header.length)
    let headerObj = {}
    for (let i of header) {
        let item = i.split(': ')
        if (item.length < 2) headerObj.firstLine = item[0]
        else headerObj[item[0]] = item[1]
    }
    return headerObj
}

const parseReqHeader = (header) => {
    let isHTTPRequest = header.match(/(GET|POST|DELETE|PUT|OPTIONS|CONNECT) (.*) HTTP/)
    let hostInfo = header.match(/Host: (.*)\r/)
    if (!isHTTPRequest || !hostInfo) return {isHTTPRequest: false}
    hostInfo = hostInfo[1].split(':')
    return {
        isHTTPRequest: true,
        headInfo: {
            host: hostInfo[0],
            port: hostInfo[1] ? hostInfo[1] : 80,
            url: isHTTPRequest[2],
            headerObj: parseResHeader(header)
        }
    }
}

const listener = (sock) => {
    if (!isAcceptConnect(sock.remoteAddress, sock.remotePort)) return sock.destroy()
    print('server: new connection')
    sock.on('data', (data) => {
        print(data.toString())
        let {header, body} = diffHeaderAndBody(data)
        const {isHTTPRequest, headInfo} = parseReqHeader(header)
        if (isHTTPRequest) {
            fetchRemote(headInfo, data)
                .then((res) => {
                    let {header, body} = diffHeaderAndBody(res)
                    // print(header)
                    let headerObj = parseResHeader(header)
                    // print(header)
                    sock.write(res)
                })
                .catch((e) => {
                    print('fetch error: ', e)
                })
        } else {
            print(`#unexpected error: ${data.toString()}`)
        }
    })
    sock.on('end', () => { sock.end() })
    sock.on('close', (err) => { if (err) {print('#sock closed, hasError: ', err); sock.destroy()} })
    sock.on('error', (err) => { print('#sock error: ', err) })
}

let server = net.createServer(listener)
server.listen(PORT, HOST)
