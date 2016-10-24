module.exports = (winSize, seqSize) => {
    let data = []
        , next = 0
        , base = 0
        , acks = {}
    return {
        getNext: () => next,

        getData: () => data,

        isEmpty: () => data.length === 0,

        showAcks: () => {console.log(`${JSON.stringify(acks)}\n`)},

        isAck: (ack) => {
            return acks[ack]
        },

        resetAcks: () => acks = {},

        // 保存ack, 成功返回1, 失败返回0
        saveAck: function (ack) {
            if (this.ackLegal(ack)) return acks[ack] = 1
            else return 0
        },

        isAllAck: function () {
            let length = this.minus(next)
            for (let i = 0; i < length; i++) {
                let k = (base + i) % seqSize
                if (!acks[k]) return false
            }
            return true
        },

        // 获得当前发送序列末尾序列号
        getCurr: () => {
            let x = next - 1
            if (x < 0) x += seqSize
            return x
        },

        // 若ack在 [base, next) 内, 则合法
        ackLegal: function (ack) {
            if (ack < 0) return false
            let legalMax = this.minus(next)
            if (this.minus(ack) < legalMax) return true
            else return false
        },

        // 返回x到base的距离
        minus: (x) => {
            let minus = x - base
            while (minus < 0) minus += seqSize
            return minus
        },

        // 将窗口移动length 距离
        go: (length) => {
            data = data.slice(length)
            base = (base + length) % seqSize
        },

        // 存入数据, 将next前移
        push: function (c, seq = null) {
            let isWindowFull = !!(this.minus(next) >= winSize)
            if (isWindowFull) return false
            else {
                data.push({
                    seq: seq || next,
                    chunk: c
                })
                next = ++next % seqSize
                return true
            }
        }
    }
}

/*
0 1 2 3 4 5 6 7 0 1 2 3 4 5 6 7 0 1 2 3 4
          5 6 7 0 1 2 3


*/
