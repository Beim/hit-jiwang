const print = console.log.bind()
const dgram= require('dgram')
const socket = dgram.createSocket('udp4')
const Window = require('./window.js')

const winSize = parseInt(process.argv[2]) || 3
const seqSize = parseInt(process.argv[3]) || (winSize + 1)
if (seqSize <= winSize) print(`warning: seqSize(${seqSize}) <= winSize(${winSize})`)
// 储存发送窗口的信息
const swindow = Window(winSize, seqSize)
const data = process.argv[4] || 'abcdefg'
const SERVER = '127.0.0.1'
const PORT = '2333'
const TIMEOUT = 'timeout'
// 超时时间
const outtime = 1000 * 3
// 丢失概率
const probability = 0.3

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

const sendOne = (seq, chunk) => {
    // 随机丢弃
    if (Math.random() < probability) {
        print(`==X seq: ${seq}, do not send ${chunk}\n`)
    } else {
        print(`==> seq: ${seq}, send out ${chunk}\n`)
        let buf = Buffer.alloc(1)
        buf.writeInt8(seq)
        // 填入序号
        chunk = Buffer.concat([buf, Buffer.from(chunk)])
        socket.send(chunk, 0, chunk.length, PORT, SERVER, (err) => {
            if (err) socket.close()
        })
    }
}

const sendWindow = () => {
    let windata = swindow.getData()
    for (let item of windata) {
        sendOne(item.seq, item.chunk)
    }
}

// 定时重传
const getTimer = () => {
    return setInterval(() => {
        print('== resend\n')
        sendWindow()
    }, outtime)
}

socket.on('message', (msg, info) => {
    if (timer) {
        clearInterval(timer)
        timer = getTimer()
    }
    let ack = msg.readInt8()
    msg = msg.slice(1)
    print(`<== ${msg.toString()}, ack: ${ack}\n`)

    if (swindow.ackLegal(ack)) {
        let length = swindow.minus(ack) + 1
        swindow.go(length)
        if (ack === swindow.getCurr()) {
            fillWindow()
            if (swindow.isEmpty()) {
                socket.close()
                print(`finish!, time cost: ${Math.floor((new Date() - startTime) / 1000)}s`)
                process.exit(0)
            }
            sendWindow()
        }
    }
})

socket.bind()

let startTime = new Date()
let timer = getTimer()
fillWindow()
sendWindow()
