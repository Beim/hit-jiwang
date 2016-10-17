// HTTP/1.1 200 OK
// Content-Type: text/plain; charset=utf-8
// Content-Length: 6892
// Date: Mon, 17 Oct 2016 04:51:55 GMT
// Connection: keep-alive

const net = require('net')
const fetchObj = {}

fetchObj.fetchRemote = (host, port, data, client = new net.Socket()) => {
    return new Promise((rsl, rej) => {
        let resArr = []
        client.connect(port, host, () => {
            console.log(`client: connect to ${host}:${port}`)
            client.end(data)
        })
        client.on('data', (chunk) => { resArr.push(chunk) })
        client.on('end', () => {
            console.log('client: end')
            rsl(Buffer.concat(resArr))
        })
        client.on('close', (err) => {
            console.log('client: closed, hasError: ', err)
        })
        client.on('error', (e) => rej(e))
    })
}

fetchObj.fetchBaidu = (host, port, data, client = new net.Socket()) => {
    return new Promise((rsl, rej) => {
        let bodyData = `这是百度~`
        let response = `HTTP/1.1 200 OK\n` +
            `Content-Type: text/plain; charset=utf-8\n` +
            `Content-Length: ${Buffer.byteLength(bodyData)}\n` +
            `Date: ${new Date().toGMTString()}\n` + 
            `Connection: keep-alive\n\n` +
            bodyData
        console.log(response)
        rsl(response)
    })
}

module.exports = fetchObj
