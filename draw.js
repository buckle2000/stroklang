const fs = require('fs')
const assert = require('assert')
const { createCanvas, loadImage } = require('canvas')

const SQ_WIDTH = 8
const SQ_HEIGHT = 32

function drawLine(ctx, a, b, c, d) {
    ctx.beginPath()
    ctx.lineTo(a, b)
    ctx.lineTo(c, d)
    ctx.stroke()
}

function drawOctals(ctx, octals) {
    ctx.save()
    for (let i of octals) {
        assert(i >= 0 && i < 8, i)
        if (i == 0) {
            ctx.beginPath()
            ctx.lineTo(0, SQ_HEIGHT / 4)
            ctx.lineTo(-SQ_WIDTH / 2, SQ_HEIGHT / 2)
            ctx.lineTo(0, SQ_HEIGHT / 4 * 3)
            ctx.lineTo(SQ_WIDTH / 2, SQ_HEIGHT / 2)
            ctx.fill()
        } else {
            if (i & 1) drawLine(ctx, 0, 0, 0, SQ_HEIGHT)
            if (i & 2) drawLine(ctx, -SQ_WIDTH, 0, SQ_WIDTH, SQ_HEIGHT)
            if (i & 4) drawLine(ctx, SQ_WIDTH, 0, -SQ_WIDTH, SQ_HEIGHT)
        }
        ctx.translate(SQ_WIDTH, 0)
    }
    ctx.restore()
}

function buffer2oct_helper(buffer, offset, size) {
    assert(size > 0, 'buffer too short')
    assert(size <= 3, 'buffer too long')
    let ord = buffer[offset+0] << 16
        | ((size > 1 ? buffer[offset+1] : 0) << 8)
        | ((size > 2 ? buffer[offset+2] : 0))
    let octs = [
        ord >>> 21,
        (ord >>> 18) & 7,
        (ord >>> 15) & 7,
    ];
    if (size > 1) {
        octs = [
            ...octs,
            (ord >>> 12) & 7,
            (ord >>> 9) & 7,
            (ord >>> 6) & 7,
        ]
    }
    if (size > 2) {
        octs = [
            ...octs,
            (ord >>> 3) & 7,
            ord & 7,
        ]
    }
    return octs;
};

function buffer2oct(bytes) {
    let result = []
    let i = 0
    while (true) {
        let increment = bytes.length - i
        if (increment <= 0) break
        if (increment > 3) increment = 3
        result = [...result, ...buffer2oct_helper(bytes, i, increment)]
        i += increment
    }
    return result
}

// init
const ROWS = 30
const BUFFER_SIZE = 64
let octals = buffer2oct(new Buffer(BUFFER_SIZE))
const canvas = createCanvas(SQ_WIDTH * (octals.length + 1),  SQ_HEIGHT * ROWS)
canvas.antialias = false
const ctx = canvas.getContext('2d')

// clear image
ctx.fillStyle = 'white'
ctx.fillRect(0, 0, SQ_WIDTH * (octals.length + 1), SQ_HEIGHT * ROWS)

// draw
ctx.translate(SQ_WIDTH + 0.5, 0)
ctx.fillStyle = 'black'
ctx.strokeStyle = 'black'

for (let i = 0; i < ROWS; ++i) {
    octals = buffer2oct(require('crypto').randomBytes(128))
    drawOctals(ctx, octals)
    ctx.translate(0, SQ_HEIGHT)
}

// save image
const s = canvas.createPNGStream()
s.pipe(fs.createWriteStream('out.png'))
s.on('end', () => {
    require('child_process').exec('xdg-open out.png')
})
