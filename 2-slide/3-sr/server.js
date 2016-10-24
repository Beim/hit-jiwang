const print = console.log.bind()
const dgram = require('dgram')
const socket = dgram.createSocket('udp4')
const Window = require('./window.js')

const winSize = parseInt(process.argv[2]) || 3
const seqSize = parseInt(process.argv[3]) || 8
if (seqSize <= winSize) print(`warning: seqSize(${seqSize}) <= winSize(${winSize})`)
// 储存发送窗口的信息
const swindow = Window(winSize, seqSize)
const PORT = 2333
// 丢失概率
const probability = 0.3

const fillWindow = () => {
    while(true) {
        if (!swindow.push(0)) break
    }
}

const sendAck = (ack, msg, address, port) => {
    if (Math.random() < probability) {
        print(`==X drop : ${msg}, ack: ${ack}\n`)
    } else {
        print(`==> accept : ${msg}, ack: ${ack}\n`)
        let buf = Buffer.alloc(1)
        buf.writeInt8(ack)
        msg = Buffer.concat([buf, Buffer.from(msg)])
        socket.send(msg, 0, msg.length, port, address, (err) => {
            if (err) socket.close()
        })
    }
}

const accept = ((want = 0, gotFirst = 0) => {
    return (seq) => {
        if (seq === want) {
            if (!gotFirst) gotFirst = 1
            want = ++want % seqSize
            return seq
        } else {
            // 返回已接收的序号
            if (gotFirst) return (want + seqSize - 1) % seqSize
            // 返回-1表示还未接收任何正确的序号
            else return -1
        }
    }
})()

socket.on('message', (msg, rinfo) => {
    let [address, port] = [rinfo.address, rinfo.port]
    let seq = msg.readInt8()
    msg = msg.slice(1).toString()

    sendAck(seq, msg, address, port)
    if (swindow.ackLegal(seq)) {
        swindow.saveAck(seq)
        if (swindow.isAllAck()) {
            let length = swindow.minus(swindow.getCurr()) + 1
            swindow.go(length)
            swindow.resetAcks()
            fillWindow()
        }
    }
})

fillWindow()
socket.bind(PORT)
