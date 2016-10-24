const print = console.log.bind()
const dgram= require('dgram')
const socket = dgram.createSocket('udp4')

const data = process.argv[2] || 'abcd'
const SERVER = '127.0.0.1'
const PORT = '2333'
const TIMEOUT = 'timeout'
const outtime = 1000 * 3
let flag = 1

const write = (seq, msg) => {
    let buf = Buffer.alloc(1)
    buf.writeInt8(seq)
    msg = Buffer.concat([buf, Buffer.from(msg)])
    socket.send(msg, 0, msg.length, PORT, SERVER, (err) => {
        if (err) client.close()
    })
}

const send = ((index = 0) => {
    return (ack) => {
        if (ack !== flag) {
            flag = ack
            index++
        }
        if (index >= data.length) return false
        if (Math.random() < 0.5) {
            print(`lose ${data[index]}`)
        } else {
            print(`send out ${data[index]}`)
            write(flag, data[index])
        }
        return true
    }
})()

const getTimer = () => {
    return setInterval(() => {
        print('resent')
        send(flag)
    }, outtime)
}

socket.on('message', (msg, info) => {
    if (timer) {
        clearInterval(timer)
        timer = getTimer()
    }
    let ack = msg.readInt8()
    msg = msg.slice(1)

    print('sent : ', msg.toString())
    let isMore = send(ack)
    if (!isMore) {
        clearInterval(timer)
        print(`cost time : ${Math.floor((new Date() - startTime) / 1000)}s`)
        process.exit(0)
    }
})

socket.bind()

let startTime = new Date()
let timer = getTimer()
send(flag)
