
// init

const canvas = document.getElementById("treeCanvas");
const ctx = canvas.getContext("2d");
let drawTimer;
let isLoopRunning = true;

// delay

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function resizeCanvasToDisplaySize(canvas) {
    const dpr = window.devicePixelRatio || 1;
    const displayWidth = canvas.clientWidth;
    const displayHeight = canvas.clientHeight;

    const targetWidth = Math.round(displayWidth * dpr);
    const targetHeight = Math.round(displayHeight * dpr);

    const needResize = canvas.width !== displayWidth || canvas.height !== displayHeight;
    if (needResize) {
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        ctx.scale(dpr, dpr);
    }
}

// random num

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
}

function getRandomDecimal(min, max) {
    const minScaled = Math.round(min * 10000);
    const maxScaled = Math.round(max * 10000);

    return (Math.floor(Math.random() * (maxScaled - minScaled + 1)) + minScaled) / 10000;
}

//tree drawing function

async function drawFractal() { // async so we can use delay inside

    // flower count

    const flowerCount = getRandomInt(3, 6);
    let g = 1

    while (g <= flowerCount) {

        // set parameters based on type

        let rules = [];
        const iterations = 7
        let ang = getRandomDecimal(0.2, 0.5);
        let colorType

        const randomShapeNum = getRandomInt(1, 5);
        const randomFlowerNum = getRandomInt(1, 5);
        const randomColorNum = getRandomInt(1, 5);
        let randomHeightModifier = 1; // ensures first flower draws at full height
        if (g !== 1) {
            randomHeightModifier = getRandomDecimal(0.5, 1);
        }

        switch (randomColorNum) {
            case 1:
                colorType = 'all'
                break;
            case 2:
                colorType = 'dataviz'
                break;
            case 3:
                colorType = 'exhibition'
                break;
            case 4:
                colorType = 'uiux'
                break;
            case 5:
                colorType = 'publication'
                break;

        }

        switch (randomShapeNum) {
            case 1:
                rules = [['F', 'FF'], ['E', 'F-[[E]+E]+F[+FE]-E,F+[[E]-E]-F[-FE]+E']];
                deg = 20;
                break;
            case 2:
                rules = [['F', 'FF'], ['E', 'F-[[E]+E]+F[+E]FE,F+[[E]-E]-F[-E]FE']];
                deg = 22;
                break;
            case 3:
                rules = [['F', 'FF'], ['E', 'F-F+[[E]+E]-F[+E][-E],F+F-[[E]-E]+F[-E][+E]']];
                deg = 18;
                break;
            case 4:
                rules = [['F', 'FF'], ['E', 'F[E]+F[-E]-[++E][-E],F[E]-F[+E]+[--E][+E]']];
                deg = 20;
                break;
            case 5:
                rules = [['F', 'FF'], ['E', 'F-[-E+F+E]+[+E-F-E],F+[-E+F+E]-[+E-F-E]']];
                deg = 22;
                break;

        }

        let str = 'E';
        let stochasticArr = [];
        for (const rule of rules) {
            if (rule[1].includes(',')) {
                stochasticArr = rule[1].split(','); // if rule uses a comma, add individual rules separated by it to stochasticArr 
            }
        };

        let i = 0
        while (i < iterations) {
            i++

            // apply rule(s) to axiom

            let newStr = '';
            for (const char of str) {
                const matchRule = rules.find(r => r[0] === char); // returns pair where r[0] matches char, if no match returns undefined
                if (matchRule) {

                    if (!matchRule[1].includes(',')) { // if only using F's (like in node rewriting, apply stochastic rule to them)
                        newStr += matchRule[1];
                    } else {
                        let randomInt = Math.floor(Math.random() * (stochasticArr.length)) //selects random rule from stochastic rules
                        newStr += stochasticArr[randomInt];
                    };
                } else {
                    newStr += char;
                }
            }
            str = newStr

        };

        // draw turtle based on str

        if (i === iterations) { // only draw once string is done being iterated

            function assignDefaults() {
                tx = canvas.clientWidth / 2;
                ty = canvas.clientHeight;
                tr = 270 * (Math.PI / 180);
                tState = [tx, ty, tr];
                saveStack = [];
            };

            // init variables

            const strSplit = str.split('');
            const rootStyles = window.getComputedStyle(document.documentElement);
            let firstBranchCoords
            let recordedFirstBranch = false;
            let strokewidth = 1;

            let tx;
            let ty;
            let tr;
            let tState;
            let saveStack = [];
            let dis = 1;
            let segCount = 0;
            let eLocations = [];
            let eCount = 0;

            assignDefaults();

            let maxTy = ty;
            let maxTx = tx;

            const typeParams = [
                {
                    "num": 1,
                    "dis": 10,
                    "ang": 45,
                    "str": "++F-F-F-F-F-F-F-F"
                },
                {
                    "num": 2,
                    "dis": 10,
                    "ang": 45,
                    "str": "++F-F-F-F-F-F-F-F"
                },
                {
                    "num": 3,
                    "dis": 10,
                    "ang": 45,
                    "str": "++F-F-F-F-F-F-F-F"
                },
                {
                    "num": 4,
                    "dis": 10,
                    "ang": 45,
                    "str": "++F-F-F-F-F-F-F-F"
                },
                {
                    "num": 5,
                    "dis": 10,
                    "ang": 45,
                    "str": "++F-F-F-F-F-F-F-F"
                },
            ];

            // Count 'F' and 'E' for segment total
            let totalSegments = 0
            for (let z = 0; z < strSplit.length; z++) {
                if (strSplit[z] == 'F' || strSplit[z] == 'E') { totalSegments++ };
            };

            // DRAWING TREE

            const timeToDraw = 0.5;
            let segmentsPerFrame = Math.ceil((totalSegments / (timeToDraw * 62.5))); // sets segmentsPerFrame to value needed to draw in timeToDraw. derived in sketchbook it just works ok

            // run with dis = 1 to get initial height

            for (const char of strSplit) {
                if (!isLoopRunning) {
                    break;
                }

                if (char == 'F' || char == 'E') {
                    let fromX = tx;
                    let fromY = ty;
                    tx += dis * Math.cos(tr);
                    ty += dis * Math.sin(tr);
                } else if (char == '+') {
                    tr += ang;
                } else if (char == '-') {
                    tr -= ang
                } else if (char == '[') {
                    saveStack.push([tx, ty, tr]);
                } else if (char == ']') {
                    [tx, ty, tr] = saveStack.pop();
                };

                tState = [tx, ty, tr];

                if (ty < maxTy) { // using negatives bc canvas "up" is negative
                    maxTy = ty;
                };
                if (tx < maxTx) {
                    maxTx = tx;
                };

            };

            // run to draw

            assignDefaults();
            dis = randomHeightModifier * ((0.9 * canvas.clientHeight) / (canvas.clientHeight - Math.abs(maxTy))); // get ratio for dis to take up 90% of canvas height

            for (const char of strSplit) {
                if (!isLoopRunning) {
                    break;
                }

                if (char == 'F' || char == 'E') {
                    let fromX = tx;
                    let fromY = ty;
                    tx += dis * Math.cos(tr);
                    ty += dis * Math.sin(tr);

                    ctx.beginPath();
                    ctx.moveTo(fromX, fromY); // starts new path at end of old path
                    ctx.lineTo(tx, ty);
                    ctx.strokeStyle = rootStyles.getPropertyValue('--primary-color');
                    ctx.lineWidth = strokewidth;
                    ctx.stroke();

                    if (char == 'E') {
                        eCount++;
                        eLocations.push({
                            xCoord: tx,
                            yCoord: ty,
                            currentAng: tr,
                        });

                        // save current state

                        const savedDis = dis;
                        const savedTr = tr;
                        const savedAng = ang;
                        const savedTx = tx;
                        const savedTy = ty;

                        // draw flower
                        const typeParamsObj = typeParams.find(param => param.num === randomFlowerNum);
                        dis = typeParamsObj.dis / iterations;
                        ang = (typeParamsObj.ang) * (Math.PI / 180); // converts to rad

                        for (const char of typeParamsObj.str) {
                            if (!isLoopRunning) {
                                break;
                            }

                            if (char == 'F') {
                                let fromX = tx;
                                let fromY = ty;
                                tx += dis * Math.cos(tr);
                                ty += dis * Math.sin(tr);

                                ctx.beginPath();
                                ctx.moveTo(fromX, fromY); // starts new path at end of old path
                                ctx.lineTo(tx, ty);
                                ctx.strokeStyle = rootStyles.getPropertyValue(`--${colorType}`);
                                ctx.lineWidth = strokewidth;
                                ctx.globalAlpha = 0.6;
                                ctx.stroke();

                            } else if (char == '+') {
                                tr += ang;
                            } else if (char == '-') {
                                tr -= ang
                            }
                        }

                        // reset to saved
                        ctx.globalAlpha = 1;
                        dis = savedDis;
                        tr = savedTr;
                        ang = savedAng;
                        tx = savedTx;
                        ty = savedTy;
                    };

                    segCount++;
                    if (segCount % segmentsPerFrame === 0) {
                        await delay(16);
                    }

                } else if (char == '+') {
                    tr += ang;
                } else if (char == '-') {
                    tr -= ang
                } else if (char == '[') {
                    if (recordedFirstBranch == false) {
                        firstBranchCoords = [tx, ty];
                        recordedFirstBranch = true
                    }
                    strokewidth -= 0.1;
                    saveStack.push([tx, ty, tr]);
                } else if (char == ']') {
                    strokewidth += 0.1;
                    [tx, ty, tr] = saveStack.pop();
                    ctx.moveTo(tx, ty)
                };

                tState = [tx, ty, tr];

            }
        }

        g++;

    }

};

function redraw(delay) {
    isLoopRunning = false;
    clearTimeout(drawTimer);

    drawTimer = setTimeout(() => {
        resizeCanvasToDisplaySize(canvas);
        isLoopRunning = true;
        drawFractal();

    }, delay);
}

redraw(0);

const drawBtn = document.getElementById('draw-btn');
const clearBtn = document.getElementById('clear-btn');

drawBtn.addEventListener('click', () => redraw(100));
window.addEventListener('resize', () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    redraw(1000)
});
clearBtn.addEventListener('click', () => {
    isLoopRunning = false;
    ctx.clearRect(0, 0, canvas.width, canvas.height)
});