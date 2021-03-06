const print = console.log.bind()
const dgram = require('dgram')
const socket = dgram.createSocket('udp4')

const PORT = 2333
const seqSize = parseInt(process.argv[2]) || 4
// 丢失概率
const probability = 0.3

const write = (seq, msg, address, port) => {
    let buf = Buffer.alloc(1)
    buf.writeInt8(seq)
    msg = Buffer.concat([buf, Buffer.from(msg)])
    socket.send(msg, 0, msg.length, port, address, (err) => {
        if (err) socket.close()
    })
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

    let ack = accept(seq)
    if (Math.random() < probability) {
        print(`==X drop : ${msg}, seq: ${seq}, ack: ${ack}`)
        // print(`==X drop : ${msg}, seq: ${seq}, ack: ${ack}\n`)
    } else {
        print(`==> accept : ${msg}, seq: ${seq}, ack: ${ack}`)
        // print(`==> accept : ${msg}, seq: ${seq}, ack: ${ack}\n`)
        write(ack, msg, address, port)
    }
})

socket.bind(PORT)
