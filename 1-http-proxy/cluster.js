/*
cluster模块是对child_process模块的进一步封装，专用于解决单进程NodeJS Web服务器无法充分利用多核CPU的问题。使用该模块可以简化多进程服务器程序的开发，让每个核上运行一个工作进程，并统一通过主进程监听端口和分发请求。

cluster启动时， 会在内部启动TCP服务器， 在cluster.fork()子进程时，将这个TCP 服务器端socket 的文件描述符发送给工作进程。
*/

const cluster = require('cluster')
const cpus = require('os').cpus()

cluster.setupMaster({
    exec: 'proxy.js'
})

for (let i = 0; i < cpus.length; i++) {
    let worker = cluster.fork()
    console.log(worker.process.pid)
}
