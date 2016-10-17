const print = console.log.bind()
const net = require('net')
const fetchRemote = require('./dbRoutes.js').getParser
const isAcceptConnect = require('./dbRoutes.js').isAcceptConnect

const HOST = '127.0.0.1'
const PORT = 2333

let cache = {}

/**
 * 将data Buffer 解析成header 和body 对象
 * @param data Buffer
 * @return Object
 */
const diffHeaderAndBody = (data) => {
    data = data.toString()
    let arr = data.split('\r\n\r\n')
    if (arr.length < 2) arr = data.split('\r\n\n')
    return {
        header: arr[0],
        body: arr[1]
    }
}

/**
 * 将header解析成对象, 首行存储在headerObj.firstLine
 * @param header String
 * @return headerObj Object
 */
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

/**
 * @param header String
 * @return Object
 */
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

/**
 * 将header对象 和body 拼接成报文
 * @param headerObj Object
 * @param body String
 * @return newData Buffer
 */
const combineMsg = (headerObj, body) => {
    let newData = ''
    for (let i in headerObj) {
        newData += `${i}: ${headerObj[i]}\r\n`
    }
    newData += `\r\n${body}`
    return Buffer.from(newData)
}

/**
 * @param header String
 * @param body String
 * @param data Buffer
 * @return newData Buffer
 */
const searchCache = (header, body, data) => {
    let {headInfo} = parseReqHeader(header)
    let newData = ''
    if (cache[headInfo.url]) {
        print('get Cache')
        let headerObj = headInfo.headerObj
        headerObj['If-Modified-Since'] = cache[headInfo.url]['Last-Modified']
        newData = combineMsg(headerObj, body)
    }
    return newData ? newData : data
}

/**
 * 没有缓存则缓存
 * 有缓存, 但过时, 更新缓存
 * 有缓存, 没过时, 取出缓存
 * @param data Buffer
 * @param url String
 * @return data Buffer
 */
const saveCache = (data, url) => {
    let {header, body} = diffHeaderAndBody(data)
    let headerObj = parseResHeader(header)
    // 如果返回头里有'Last-Modified' 字段
    if (headerObj['Last-Modified']) {
        // 如果有该缓存
        let hasCache = !!cache[url]
        if (hasCache) {
            // 如果返回头里的修改时间 比 缓存里的修改时间  晚, 则说明文件有改动
            let isModified = headerObj['Last-Modified'] > cache[url]['Last-Modified']
            // 如果文件没有改动, 从cache 中取出body, 与header 组合
            if (!isModified) {
                data = combineMsg(headerObj, cache[url].body)
            // 如果文件被改动, 更新cache
            } else {
                cache[url] = {
                    'Last-Modified': headerObj['Last-Modified'],
                    body
                }
            }
        // 如果没有缓存, 存入cache
        } else {
            cache[url] = {
                'Last-Modified': headerObj['Last-Modified'],
                body
            }
        }
    }
    return data
}

const listener = (sock) => {
    // 若禁止该主机访问, 销毁socket
    if (!isAcceptConnect(sock.remoteAddress, sock.remotePort)) return sock.destroy()
    print('server: new connection')
    sock.on('data', (data) => {
        // 取出header 和body
        let {header, body} = diffHeaderAndBody(data)
        // 根据请求头的url 查找cache, 如果存在, 在请求头中添加'If-Modified-Since'
        data = searchCache(header, body, data)
        // 更新header
        header = diffHeaderAndBody(data).header
        // 解析请求头
        let {isHTTPRequest, headInfo} = parseReqHeader(header)
        if (isHTTPRequest) {
            // print(headInfo)
            // 访问目标服务器, 获取数据
            fetchRemote(headInfo, data)
                .then((res) => {
                    // 从cache 中获取数据, 或 更新cache
                    res = saveCache(res, headInfo.url)
                    sock.write(res)
                    print(cache)
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
