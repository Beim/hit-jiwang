const cluster = require('cluster')
const cpus = require('os').cpus()

cluster.setupMaster({
    exec: 'proxy.js'
})

for (let i = 0; i < cpus.length; i++) {
    let worker = cluster.fork()
    console.log(worker.process.pid)
}
