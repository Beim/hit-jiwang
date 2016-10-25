const print = console.log.bind()
const dgram= require('dgram')
const socket = dgram.createSocket('udp4')
const Window = require('./window.js')

const winSize = parseInt(process.argv[2]) || 3
const seqSize = parseInt(process.argv[3]) || 8
if (seqSize <= winSize) print(`warning: seqSize(${seqSize}) <= winSize(${winSize})`)
// 储存发送窗口的信息
const swindow = Window(winSize, seqSize)
// 储存接收窗口的信息
const rwindow = Window(winSize, seqSize)
const data = process.argv[4] || 'abcdefghij'
const SERVER = '127.0.0.1'
const PORT = '2333'
const TIMEOUT = 'timeout'
// 超时时间
const outtime = 1000 * 3
// 丢失概率
const probability = 0.3

const fillWindow_s = () => {
    while (true) {
        if (!rwindow.push(0)) break
    }
}

const fillWindow = ((index = 0) => {
    return () => {
        while (index < data.length) {
            if (swindow.push(data[index])) {
                index++
            } else {
                break
            }
        }
    }
})()

const sendAck = (ack, msg, address, port) => {
    if (Math.random() < probability) {
        print(`==X drop : ${msg}, ack: ${ack}\n`)
    } else {
        print(`==> accept: ${msg}, ack: ${ack}\n`)
        let buf = Buffer.alloc(2)
        buf.writeInt8(0, 0)
        buf.writeInt8(ack, 1)
        msg = Buffer.concat([buf, Buffer.from(msg)])
        socket.send(msg, 0, msg.length, port, address, (err) => {
            if (err) socket.close()
        })
    }
}

const sendOne = (seq, chunk, address, port) => {
    // 随机丢弃
    if (Math.random() < probability) {
        print(`==X seq: ${seq}, do not send ${chunk}\n`)
    } else {
        print(`==> seq: ${seq}, send out ${chunk}\n`)
        let buf = Buffer.alloc(2)
        buf.writeInt8(1, 0)
        buf.writeInt8(seq, 1)
        // 填入序号
        chunk = Buffer.concat([buf, Buffer.from(chunk)])
        socket.send(chunk, 0, chunk.length, port, address, (err) => {
            if (err) socket.close()
        })
    }
}

const sendWindow = (address = SERVER, port = PORT) => {
    let windata = swindow.getData()
    for (let item of windata) {
        if (!swindow.isAck(item.seq))
            sendOne(item.seq, item.chunk, address, port)
    }
}

// 定时重传
const getTimer = (address, port) => {
    return setInterval(() => {
        print('== resend\n')
        sendWindow(address, port)
    }, outtime)
}

let sendFinish = 0

socket.on('message', (msg, rinfo) => {
    let [address, port] = [rinfo.address, rinfo.port]
    let type = msg.readInt8(0)
    let ack = msg.readInt8(1)
    let seq = ack
    msg = msg.slice(2)
    // 作为client
    if (type === 0) {
        if (timer) {
            clearInterval(timer)
            if (!sendFinish) timer = getTimer()
        }
        print(`<== ${msg.toString()}, ack: ${ack}\n`)

        if (swindow.ackLegal(ack)) {
            swindow.saveAck(ack)
            if (swindow.isAllAck()) {
                let length = swindow.minus(swindow.getCurr()) + 1
                swindow.go(length)
                swindow.resetAcks()
                fillWindow()
                if (swindow.isEmpty()) {
                    // socket.close()
                    print(`finish!, time cost: ${Math.floor((new Date() - startTime) / 1000)}s`)
                    clearInterval(timer)
                    sendFinish = 1
                    // process.exit(0)
                }
                sendWindow()
            }
        }
    // 发送
    } else if (type === 1) {
        sendAck(seq, msg, address, port)
        rwindow.updateData(seq, msg.toString())
        if (rwindow.ackLegal(seq)) {
            rwindow.saveAck(seq)
            if (rwindow.isAllAck()) {
                let length = rwindow.minus(rwindow.getCurr()) + 1
                let outData = rwindow.go(length)
                print(`# receive ${JSON.stringify(outData)}\n`)
                rwindow.resetAcks()
                fillWindow_s()
            }
        }
    }

    /*
     * 接收
    if (timer) {
        clearInterval(timer)
        timer = getTimer()
    }
    let ack = msg.readInt8()
    msg = msg.slice(1)
    print(`<== ${msg.toString()}, ack: ${ack}\n`)

    if (swindow.ackLegal(ack)) {
        swindow.saveAck(ack)
        if (swindow.isAllAck()) {
            let length = swindow.minus(swindow.getCurr()) + 1
            swindow.go(length)
            swindow.resetAcks()
            fillWindow()
            if (swindow.isEmpty()) {
                socket.close()
                print(`finish!, time cost: ${Math.floor((new Date() - startTime) / 1000)}s`)
                process.exit(0)
            }
            sendWindow()
        }
    }
    */
})

socket.bind()

let startTime = new Date()
let timer = getTimer()
fillWindow()
fillWindow_s()
sendWindow()
