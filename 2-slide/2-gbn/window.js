module.exports = (winSize, seqSize) => {
    let data = []
        , next = 0
        , base = 0
    return {
        getNext: () => next,

        getData: () => data,

        getCurr: () => {
            let x = next - 1
            if (x < 0) x += seqSize
            return x
        },

        ackLegal: function (ack) {
            if (ack < 0) return false
            let legalMax = this.minus(next)
            if (this.minus(ack) < legalMax) return true
            else return false
        },

        minus: (x) => {
            let minus = x - base
            while (minus < 0) minus += seqSize
            return minus
        },

        go: (length) => {
            data = data.slice(length)
            base = (base + length) % seqSize
        },

        push: function (c) {
            let isWindowFull = !!(this.minus(next) >= winSize)
            if (isWindowFull) return false
            else {
                data.push({
                    seq: next,
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
