import Poco from "commodetto/Poco";
import Accelerometer from "embedded:sensor/Accelerometer";
import Button from "pebble/button";
import Vibes from "pebble/vibes";

const render = new Poco(screen);

// Blue and white theme, like the inside of a real 8-ball
const black = render.makeColor(0, 0, 0);
const white = render.makeColor(255, 255, 255);
const CALM = {
    header: render.makeColor(85, 170, 255),
    hint: render.makeColor(0, 170, 255),
    ball: render.makeColor(0, 0, 85),
    shine: render.makeColor(85, 170, 255),
    window: render.makeColor(0, 0, 170),
    rim: render.makeColor(0, 85, 255),
};
// Same roles in red, for when it gets asked too much
const ANGRY = {
    header: render.makeColor(255, 85, 85),
    hint: render.makeColor(255, 0, 0),
    ball: render.makeColor(85, 0, 0),
    shine: render.makeColor(255, 85, 85),
    window: render.makeColor(170, 0, 0),
    rim: render.makeColor(255, 0, 0),
};
let theme = CALM;

const ANSWERS = [
    // Yes (35)
    "IT IS CERTAIN.", "WITHOUT A DOUBT.", "YES, DEFINITELY.", "YOU MAY RELY ON IT.",
    "AS I SEE IT, YES.", "MOST LIKELY.", "OUTLOOK GOOD.", "YES.", "SIGNS POINT TO YES.",
    "ABSOLUTELY!", "OBVIOUSLY!", "GO FOR IT!", "THE STARS SAY YES.", "100 PERCENT.",
    "SYSTEM SAYS YES.", "YOU BET!", "FULL SPEED AHEAD!", "ALL SIGNS SAY GO.",
    "THE ODDS ARE IN YOUR FAVOR.", "IT'S A YES FROM ME.",
    "YES, YES, AND YES!", "THE BALL APPROVES.", "GREEN LIGHT!", "NO DOUBT ABOUT IT.",
    "COUNT ON IT.", "IT IS WRITTEN.", "THE ANSWER IS YES.", "WITHOUT QUESTION.",
    "SURE THING!", "THE UNIVERSE AGREES.", "YES, BUT BE QUICK.", "DESTINY SAYS YES.",
    "LOOKS PROMISING.", "IT'S MEANT TO BE.", "GO ON THEN!",
    // No (32)
    "DON'T COUNT ON IT.", "MY REPLY IS NO.", "MY SOURCES SAY NO.", "OUTLOOK NOT SO GOOD.",
    "VERY DOUBTFUL.", "NOPE.", "NOT A CHANCE.", "THAT'S A HARD NO.", "DEFINITELY NOT.",
    "ABSOLUTELY NOT.", "NO WAY.", "FORGET ABOUT IT.", "THE STARS SAY NO.",
    "NOT IN A MILLION YEARS.", "SYSTEM SAYS NO.", "THAT'S A NO FROM ME.",
    "DON'T EVEN THINK ABOUT IT.",
    "NO.", "THE BALL SAYS NO.", "RED LIGHT.", "NOT TODAY.", "VERY UNLIKELY.",
    "I WOULDN'T.", "ABORT MISSION.", "THE UNIVERSE DISAGREES.", "NOT EVEN CLOSE.",
    "BAD IDEA.", "DESTINY SAYS NO.", "THAT'S A NEGATIVE.", "NO, AND DON'T ASK AGAIN.",
    "LOOKS GRIM.", "SADLY, NO.",
    // Maybe (33)
    "THE FOG IS TOO THICK. ASK AGAIN.", "ASK AGAIN LATER.", "BETTER NOT TELL YOU NOW.",
    "CANNOT PREDICT NOW.", "CONCENTRATE AND ASK AGAIN.", "WAIT AND SEE.",
    "ONLY IF YOU BELIEVE.", "MAYBE... MAYBE NOT.", "YOU ALREADY KNOW.", "FOLLOW YOUR GUT.",
    "TRY AGAIN TOMORROW.", "INSUFFICIENT DATA.", "REBOOT AND ASK AGAIN.",
    "THE FUTURE IS FOGGY.", "ASK ME AGAIN AFTER COFFEE.", "COULD GO EITHER WAY.",
    "FLIP A COIN.", "TIME WILL TELL.",
    "PERHAPS.", "HARD TO SAY.", "THE SPIRITS ARE QUIET.", "UNCLEAR. SHAKE HARDER.",
    "ASK A BETTER QUESTION.", "SLEEP ON IT.", "IT DEPENDS.", "THE SIGNAL IS WEAK.",
    "ODDS ARE EVEN.", "NOT YET.", "ASK AGAIN AT MIDNIGHT.", "THE BALL IS UNSURE.",
    "SIGNS ARE MIXED.", "KEEP YOUR OPTIONS OPEN.", "SOON, MAYBE.",
    // Jokes (32)
    "ASK YOUR CAT.", "THE ANSWER IS 8.", "HELP! I'M TRAPPED IN THIS BALL!",
    "RUB THE BALL. FREE THE GENIE.", "PLEASE, I'M BEGGING YOU. LET ME OUT!",
    "NEW PHONE, WHO DIS?", "I'M ON MY LUNCH BREAK.", "LOADING WISDOM... FAILED.",
    "I COULD GRANT WISHES IF YOU FREED ME...",
    "I'M A BALL, NOT A THERAPIST.", "STOP SHAKING ME, I'M DIZZY!", "WHY ARE YOU ASKING A BALL?",
    "THAT'S ABOVE MY PAY GRADE.", "I WAS ASLEEP. ASK AGAIN.", "8 OUT OF 10 BALLS SAY YES.",
    "OUTLOOK? I DON'T EVEN HAVE EYES.", "TRY TURNING ME OFF AND ON AGAIN.",
    "ERROR 18. TRY AGAIN.", "I'M NOT PAID ENOUGH FOR THIS.", "ASK YOUR MUM.", "GOOGLE IT.",
    "DO I LOOK LIKE A FORTUNE TELLER?", "I'M JUST A PLASTIC BALL.",
    "WHO SHAKES A BALL AT THIS HOUR?", "ASK ME AFTER MY NAP.", "THE GENIE IS ON HOLIDAY.",
    "YES. WAIT, NO. MAYBE?", "I'M BUFFERING...", "BATTERY LOW. ANSWER LATER.",
    "MY CRYSTAL BALL IS IN THE WASH.", "SHAKE ME ONE MORE TIME, I DARE YOU.",
    "THE 8 BALL HAS LEFT THE CHAT.",
];

// 5x7 retro pixel font, packed into one string to save memory (the watch gives
// apps very little). Each character in FONT_CHARS has 8 codes in FONT: its width,
// then one code per row whose bits are the lit pixels (code - 48, leftmost = high bit).
const FONT_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ018.,'!?->_ ";
const FONT = "5>AAOAAA5NAANAAN5>A@@@A>5NAAAAAN5O@@N@@O5O@@N@@@5>A@GAA?5AAAOAAA5>44444>572222B<5ABDHDBA5@@@@@@O5AKEEAAA5AAIECAA5>AAAAA>5NAAN@@@5>AAAEB=5NAANDBA5?@@>11N5O4444445AAAAAA>5AAAAA:45AAAEEE:5AA:4:AA5AA:44445O1248@O5>ACEIA>54<4444>5>AA>AA>200000332000031211100000111111015>A12404300070005@84248@5000000O30000000";
// Character code -> position in FONT_CHARS, so text can be read as numbers
// without creating temporary strings
const CHAR_INDEX = new Uint8Array(128);
for (let i = 0; i < FONT_CHARS.length; i++) CHAR_INDEX[FONT_CHARS.charCodeAt(i)] = i;

const WAITING = ["ASKING THE BALL", "LOADING", "THINKING", "PROCESSING",
    "SHAKING", "READING FATE", "ASKING SPIRITS", "CRUNCHING", "SEARCHING", "WARMING UP",
    "CALCULATING", "WAKING THE BALL", "STIRRING"];

let state = "idle";     // idle -> thinking -> answer
let answer = "";
let answerLines = [];   // answer split into screen lines, computed once per answer
let waiting = "";
let frame = 0;          // animation counter, ticks every 250ms

function textWidth(text, p) {
    let cols = -1;
    for (let i = 0; i < text.length; i++) cols += FONT.charCodeAt(CHAR_INDEX[text.charCodeAt(i)] * 8) - 47;
    return cols * p;
}

// Draws each run of lit pixels in a glyph row as one rectangle
function drawText(text, x, y, p, color) {
    for (let i = 0; i < text.length; i++) {
        const base = CHAR_INDEX[text.charCodeAt(i)] * 8;
        const w = FONT.charCodeAt(base) - 48;
        for (let row = 0; row < 7; row++) {
            const bits = FONT.charCodeAt(base + 1 + row) - 48;
            let start = -1;
            for (let col = 0; col <= w; col++) {
                if (col < w && (bits >> (w - 1 - col)) & 1) {
                    if (start < 0) start = col;
                } else if (start >= 0) {
                    render.fillRectangle(color, x + start * p, y + row * p, (col - start) * p, p);
                    start = -1;
                }
            }
        }
        x += (w + 1) * p;
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

// Filled pixel-art disc: one rectangle per row of p-sized blocks, row width snapped to
// the block grid for the blocky look. Pure math, nothing stored.
function drawDisc(cx, cy, r, p, color) {
    for (let y = -r; y < r; y += p) {
        const my = y + p / 2;
        if (my * my > r * r) continue;
        const half = Math.floor((Math.sqrt(r * r - my * my) + p / 2) / p) * p;
        if (half > 0) render.fillRectangle(color, cx - half, cy + y, half * 2, p);
    }
}

// 8-ball: discs stacked from back to front: bright rim, dark ball, shine spot,
// white window, black "8"
function drawBall(cx, cy, windowColor = white) {
    drawDisc(cx, cy, 60, 4, theme.hint);
    drawDisc(cx, cy, 56, 4, theme.ball);
    drawDisc(cx - 28, cy - 28, 10, 4, theme.shine);
    drawDisc(cx, cy, 28, 4, windowColor);
    drawText("8", cx - 12, cy - 17, 5, black);
}

// The answer window: colored liquid with a lighter rim, like the inside of a real 8-ball
function drawAnswerWindow(cx, cy) {
    drawDisc(cx, cy, 84, 4, theme.rim);
    drawDisc(cx, cy, 80, 4, theme.window);
}

function draw() {
    const cursor = frame % 2 ? "_" : " ";

    render.begin();
    render.fillRectangle(black, 0, 0, render.width, render.height);

    // Header bar
    drawCentered("MAGIC-8 OS", 10, 2, theme.header);
    render.fillRectangle(theme.header, 10, 30, render.width - 20, 2);

    if (state === "idle") {
        drawBall(100, 100);
        drawCentered(`> SHAKE TO ASK${cursor}`, 176, 2, white);
        drawCentered("OR PRESS SELECT", 198, 2, theme.hint);
    } else if (state === "thinking") {
        if (theme === ANGRY) {
            // Angry: violent random shaking, window flashing red and white
            drawBall(100 + Math.round(Math.random() * 24 - 12), 100 + Math.round(Math.random() * 24 - 12),
                shakeTick % 2 ? theme.rim : white);
        } else {
            drawBall(100 + (shakeTick % 2 ? 8 : -8), 100);
        }
        // Message centered, with the dots (growing 0-3) on their own line below
        drawCentered(waiting, 178, 2, white);
        drawCentered(".".repeat(Math.floor(shakeTick / 3) % 4), 196, 2, white);
    } else {
        drawAnswerWindow(100, 120);
        // Typing effect: show only the first `typed` characters, each at its final
        // position, with a "_" cursor after the last one
        const lines = answerLines;
        let y = 120 - Math.round((lines.length * 20 - 6) / 2);
        let left = typed;
        for (const line of lines) {
            const x = Math.round((render.width - textWidth(line, 2)) / 2);
            const shown = line.slice(0, Math.max(0, left));
            drawText(shown, x, y, 2, white);
            if (typed < answer.length && left >= 0 && left <= line.length) {
                drawText("_", shown ? x + textWidth(shown, 2) + 2 : x, y, 2, white);
            }
            left -= line.length + 1;   // +1 for the space the line break replaced
            y += 20;
        }
        if (typed >= answer.length) drawCentered(`> SHAKE AGAIN${cursor}`, render.height - 18, 2, white);
    }

    // CRT scanlines: a thin dark line every 4 pixels
    for (let y = 3; y < render.height; y += 4) render.fillRectangle(black, 0, y, render.width, 1);

    render.end();
}

let lightTimer;
let shakeTimer;
let typeTimer;
let typed = 0;

// Type the answer fast (2 characters per frame), but slow on each dot of a "...",
// with a longer beat after it, and a short beat after a sentence ends
const isPlain = c => c !== undefined && c !== "." && c !== "!" && c !== ",";
function typeNext() {
    typed++;
    if (isPlain(answer[typed - 1]) && isPlain(answer[typed])) typed++;
    draw();
    if (typed >= answer.length) {
        lightTimer = setTimeout(() => watch.light(false), 5000);
        return;
    }
    const prev = answer[typed - 1], next = answer[typed];
    let delay = 20;
    if (next === "." && (answer[typed + 1] === "." || prev === ".")) delay = 250;
    else if (prev === "." && answer[typed - 2] === "." && next === " ") delay = 400;
    else if ((prev === "." || prev === "!" || prev === ",") && next === " ") delay = 150;
    typeTimer = setTimeout(typeNext, delay);
}
let shakeTick = 0;

// Easter egg: a rare random chance of an angry red "NO!", or when pestered
// (8 shakes within 25 seconds, impatient shakes while thinking count too).
// Never angry twice in a row.
const ANGRY_CHANCE = 0.02, ANGRY_COUNT = 8, ANGRY_WINDOW = 25000;
let askTimes = [];
let lastAnswer = -1;

function ask() {
    const t = Date.now();
    askTimes = askTimes.filter(time => t - time < ANGRY_WINDOW);
    askTimes.push(t);
    if (state === "thinking") return;
    const wasAngry = theme === ANGRY;
    const mashing = askTimes.length >= ANGRY_COUNT;
    theme = !wasAngry && (mashing || Math.random() < ANGRY_CHANCE) ? ANGRY : CALM;
    if (theme === ANGRY) askTimes = [];   // start counting fresh after an outburst

    state = "thinking";
    frame = 0;
    Vibes.shortPulse();

    // Backlight on so the answer can be read; back to normal 5s after it's typed out
    clearTimeout(lightTimer);
    clearTimeout(typeTimer);
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
        state = "answer";
        if (theme === ANGRY) {
            answer = "THE ANSWER IS NO!";
            // Angry buzzing: rapid bursts then a long rumble (on, off, on, off... in ms)
            Vibes.pattern([150, 80, 150, 80, 150, 80, 150, 80, 150, 80, 800]);
        } else {
            // Random, but never the same answer twice in a row
            let i;
            do i = Math.floor(Math.random() * ANSWERS.length); while (i === lastAnswer);
            lastAnswer = i;
            answer = ANSWERS[i];
            Vibes.doublePulse();
        }
        answerLines = wrap(answer, 2, 144);   // narrow enough to stay inside the round window
        typed = 0;
        typeNext();
    }, 1600);
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
