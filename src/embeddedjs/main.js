import Poco from "commodetto/Poco";
import Accelerometer from "embedded:sensor/Accelerometer";
import Button from "pebble/button";
import Vibes from "pebble/vibes";

const render = new Poco(screen);

// Blue and white theme, like the inside of a real 8-ball
const black = render.makeColor(0, 0, 0);
const white = render.makeColor(255, 255, 255);
const lightBlue = render.makeColor(85, 170, 255);
const midBlue = render.makeColor(0, 170, 255);
const ballColor = render.makeColor(0, 0, 85);
const shineColor = render.makeColor(85, 170, 255);
const blue = render.makeColor(0, 0, 170);
const blueRim = render.makeColor(0, 85, 255);

const ANSWERS = [
    "IT IS CERTAIN.", "WITHOUT A DOUBT.", "YES, DEFINITELY.", "YOU MAY RELY ON IT.",
    "AS I SEE IT, YES.", "MOST LIKELY.", "OUTLOOK GOOD.", "YES.", "SIGNS POINT TO YES.",
    "REPLY HAZY, TRY AGAIN.", "ASK AGAIN LATER.", "BETTER NOT TELL YOU NOW.",
    "CANNOT PREDICT NOW.", "CONCENTRATE AND ASK AGAIN.", "DON'T COUNT ON IT.",
    "MY REPLY IS NO.", "MY SOURCES SAY NO.", "OUTLOOK NOT SO GOOD.", "VERY DOUBTFUL.",
    // Extra answers
    "ABSOLUTELY!", "NOPE.", "OBVIOUSLY!", "NOT A CHANCE.",
    "THAT'S A HARD NO.", "GO FOR IT!", "WAIT AND SEE.", "DEFINITELY NOT.",
    "THE STARS SAY YES.", "ONLY IF YOU BELIEVE.", "MAYBE... MAYBE NOT.", "YOU ALREADY KNOW.",
    "FOLLOW YOUR GUT.", "ASK YOUR CAT.", "TRY AGAIN TOMORROW.", "100 PERCENT.",
    "SYSTEM SAYS YES.", "INSUFFICIENT DATA.", "REBOOT AND ASK AGAIN.", "THE ANSWER IS 8.",
    "HELP! I'M TRAPPED IN THIS BALL!", "RUB THE BALL. FREE THE GENIE.",
];

// 5x7 retro pixel font ("#" = lit pixel). Narrow glyphs for punctuation.
const GLYPHS = {
    "A": [".###.", "#...#", "#...#", "#####", "#...#", "#...#", "#...#"],
    "B": ["####.", "#...#", "#...#", "####.", "#...#", "#...#", "####."],
    "C": [".###.", "#...#", "#....", "#....", "#....", "#...#", ".###."],
    "D": ["####.", "#...#", "#...#", "#...#", "#...#", "#...#", "####."],
    "E": ["#####", "#....", "#....", "####.", "#....", "#....", "#####"],
    "F": ["#####", "#....", "#....", "####.", "#....", "#....", "#...."],
    "G": [".###.", "#...#", "#....", "#.###", "#...#", "#...#", ".####"],
    "H": ["#...#", "#...#", "#...#", "#####", "#...#", "#...#", "#...#"],
    "I": [".###.", "..#..", "..#..", "..#..", "..#..", "..#..", ".###."],
    "J": ["..###", "...#.", "...#.", "...#.", "...#.", "#..#.", ".##.."],
    "K": ["#...#", "#..#.", "#.#..", "##...", "#.#..", "#..#.", "#...#"],
    "L": ["#....", "#....", "#....", "#....", "#....", "#....", "#####"],
    "M": ["#...#", "##.##", "#.#.#", "#.#.#", "#...#", "#...#", "#...#"],
    "N": ["#...#", "#...#", "##..#", "#.#.#", "#..##", "#...#", "#...#"],
    "O": [".###.", "#...#", "#...#", "#...#", "#...#", "#...#", ".###."],
    "P": ["####.", "#...#", "#...#", "####.", "#....", "#....", "#...."],
    "Q": [".###.", "#...#", "#...#", "#...#", "#.#.#", "#..#.", ".##.#"],
    "R": ["####.", "#...#", "#...#", "####.", "#.#..", "#..#.", "#...#"],
    "S": [".####", "#....", "#....", ".###.", "....#", "....#", "####."],
    "T": ["#####", "..#..", "..#..", "..#..", "..#..", "..#..", "..#.."],
    "U": ["#...#", "#...#", "#...#", "#...#", "#...#", "#...#", ".###."],
    "V": ["#...#", "#...#", "#...#", "#...#", "#...#", ".#.#.", "..#.."],
    "W": ["#...#", "#...#", "#...#", "#.#.#", "#.#.#", "#.#.#", ".#.#."],
    "X": ["#...#", "#...#", ".#.#.", "..#..", ".#.#.", "#...#", "#...#"],
    "Y": ["#...#", "#...#", ".#.#.", "..#..", "..#..", "..#..", "..#.."],
    "Z": ["#####", "....#", "...#.", "..#..", ".#...", "#....", "#####"],
    "0": [".###.", "#...#", "#..##", "#.#.#", "##..#", "#...#", ".###."],
    "1": ["..#..", ".##..", "..#..", "..#..", "..#..", "..#..", ".###."],
    "8": [".###.", "#...#", "#...#", ".###.", "#...#", "#...#", ".###."],
    ".": ["..", "..", "..", "..", "..", "##", "##"],
    ",": ["..", "..", "..", "..", "##", ".#", "#."],
    "'": ["#", "#", ".", ".", ".", ".", "."],
    "!": ["#", "#", "#", "#", "#", ".", "#"],
    "?": [".###.", "#...#", "....#", "...#.", "..#..", ".....", "..#.."],
    "-": ["...", "...", "...", "###", "...", "...", "..."],
    ">": ["#....", ".#...", "..#..", "...#.", "..#..", ".#...", "#...."],
    "_": [".....", ".....", ".....", ".....", ".....", ".....", "#####"],
    " ": ["...", "...", "...", "...", "...", "...", "..."],
};

const WAITING = ["ASKING THE BALL", "LOADING", "THINKING", "PROCESSING"];

let state = "idle";     // idle -> thinking -> answer
let answer = "";
let waiting = "";
let frame = 0;          // animation counter, ticks every 250ms

function textWidth(text, p) {
    let cols = -1;
    for (const c of text) cols += GLYPHS[c][0].length + 1;
    return cols * p;
}

function drawText(text, x, y, p, color) {
    for (const c of text) {
        const glyph = GLYPHS[c];
        for (let row = 0; row < 7; row++) {
            for (let col = 0; col < glyph[row].length; col++) {
                if (glyph[row][col] === "#") render.fillRectangle(color, x + col * p, y + row * p, p, p);
            }
        }
        x += (glyph[0].length + 1) * p;
    }
}

function drawCentered(text, y, p, color) {
    drawText(text, Math.round((render.width - textWidth(text, p)) / 2), y, p, color);
}

// Split text into lines that fit the screen
function wrap(text, p, maxWidth) {
    const lines = [];
    let line = "";
    for (const word of text.split(" ")) {
        const next = line ? `${line} ${word}` : word;
        if (line && textWidth(next, p) > maxWidth) {
            lines.push(line);
            line = word;
        } else {
            line = next;
        }
    }
    lines.push(line);
    return lines;
}

// Pixel-art circle on a grid of p-sized blocks. colorAt(x, y, d) picks each block's
// color (d = squared distance from the center). Same-colored blocks in a row are merged.
function drawPixelCircle(cx, cy, r, p, colorAt) {
    for (let y = -r; y < r; y += p) {
        let runStart = 0, runColor;
        for (let x = -r; x <= r; x += p) {
            const mx = x + p / 2, my = y + p / 2;
            const d = mx * mx + my * my;
            const color = x < r && d <= r * r ? colorAt(mx, my, d) : undefined;
            if (color !== runColor) {
                if (runColor !== undefined) render.fillRectangle(runColor, cx + runStart, cy + y, x - runStart, p);
                runStart = x;
                runColor = color;
            }
        }
    }
}

// 8-ball: dark blue ball, bright rim, shine spot, white window with a black "8"
function drawBall(cx, cy, r, p) {
    const windowR = r * 0.45, shineR = r * 0.16, shineX = -r * 0.45, shineY = -r * 0.45;
    drawPixelCircle(cx, cy, r, p, (x, y, d) => {
        if (d > (r - p) * (r - p)) return midBlue;
        if (d <= windowR * windowR) return white;
        if ((x - shineX) ** 2 + (y - shineY) ** 2 <= shineR * shineR) return shineColor;
        return ballColor;
    });
    drawText("8", cx - 12, cy - 17, 5, black);
}

// The answer window: blue liquid with a lighter rim, like the inside of a real 8-ball
function drawAnswerWindow(cx, cy, r, p) {
    drawPixelCircle(cx, cy, r, p, (x, y, d) => d > (r - p) * (r - p) ? blueRim : blue);
}

function draw() {
    const cursor = frame % 2 ? "_" : " ";

    render.begin();
    render.fillRectangle(black, 0, 0, render.width, render.height);

    // Header bar
    drawCentered("MAGIC-8 OS", 10, 2, lightBlue);
    render.fillRectangle(lightBlue, 10, 30, render.width - 20, 2);

    if (state === "idle") {
        drawBall(100, 100, 60, 4);
        drawCentered(`> SHAKE TO ASK${cursor}`, 176, 2, white);
        drawCentered("OR PRESS SELECT", 198, 2, midBlue);
    } else if (state === "thinking") {
        drawBall(100 + (shakeTick % 2 ? 8 : -8), 100, 60, 4);
        // Message centered, with the dots (growing 0-3) on their own line below
        drawCentered(waiting, 178, 2, white);
        drawCentered(".".repeat(Math.floor(shakeTick / 3) % 4), 196, 2, white);
    } else {
        drawAnswerWindow(100, 120, 84, 4);
        const lines = wrap(answer, 2, 150);
        let y = 120 - Math.round((lines.length * 20 - 6) / 2);
        for (const line of lines) {
            drawCentered(line, y, 2, white);
            y += 20;
        }
        drawCentered(`> SHAKE AGAIN${cursor}`, render.height - 14, 1, midBlue);
    }

    // CRT scanlines: a thin midBlue line every 4 pixels
    for (let y = 3; y < render.height; y += 4) render.fillRectangle(black, 0, y, render.width, 1);

    render.end();
}

let lightTimer;
let shakeTimer;
let shakeTick = 0;

function ask() {
    if (state === "thinking") return;
    state = "thinking";
    frame = 0;
    Vibes.shortPulse();

    // Backlight on so the answer can be read; back to normal 5s after it shows
    clearTimeout(lightTimer);
    watch.light(true);

    // Shake the ball quickly while "thinking", with a random waiting message
    waiting = WAITING[Math.floor(Math.random() * WAITING.length)];
    shakeTick = 0;
    shakeTimer = setInterval(() => {
        shakeTick++;
        draw();
    }, 100);

    draw();
    setTimeout(() => {
        clearInterval(shakeTimer);
        answer = ANSWERS[Math.floor(Math.random() * ANSWERS.length)];
        state = "answer";
        Vibes.doublePulse();
        draw();
        lightTimer = setTimeout(() => watch.light(false), 5000);
    }, 1500);
}

// Wrist flick/shake
new Accelerometer({onTap: ask});

// Select button as a backup (and for testing in the emulator)
new Button({type: "select", onPush(pushed) { if (pushed) ask(); }});

// Blinking cursor and "..." animation
setInterval(() => {
    frame++;
    draw();
}, 500);

draw();
