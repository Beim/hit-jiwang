const print = console.log.bind()
const dgram = require('dgram')
const socket = dgram.createSocket('udp4')

const PORT = 2333

const write = (seq, msg, address, port) => {
    let buf = Buffer.alloc(1)
    buf.writeInt8(seq)
    msg = Buffer.concat([buf, Buffer.from(msg)])
    socket.send(msg, 0, msg.length, port, address, (err) => {
        if (err) socket.close()
    })
}

socket.on('message', (msg, rinfo) => {
    let [address, port] = [rinfo.address, rinfo.port]
    let seq = !!msg.readInt8() ? 0 : 1
    msg = msg.slice(1).toString()

    print(`receive : ${msg}`)
    if (Math.random() < 0.5) {
        print(`drop : ${msg}`)
    } else {
        write(seq, msg, address, port)
    }
})

socket.bind(PORT)
