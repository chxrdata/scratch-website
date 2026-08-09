const canvas = document.getElementById("treeCanvas");
const ctx = canvas.getContext("2d");
async function readWorkJSON(filePath) {
    try {
        const response = await fetch(filePath)

        if (!response.ok) {
            throw new Error(`Failed to load file: ${response.status}`)
        }

        const jsonData = await response.json()
        return jsonData
    } catch (error) {
        console.error('Error reading JSON file:', error)
        throw error
    }
};

readWorkJSON('../assets/work.json')
    .then(data => {

        // init
        const treeSlider1 = document.getElementById('tr-range-1');
        let treeSlider1Value = 50;

        const treeSlider2 = document.getElementById('tr-range-2');
        let treeSlider2Value = 50;

        let isLoopRunning = true;

        // tree drawing function

        function delay(ms) {
            return new Promise(resolve => setTimeout(resolve, ms));
        }

        function resizeCanvasToDisplaySize(canvas) {
            const displayWidth = canvas.clientWidth;
            const displayHeight = canvas.clientHeight;

            const needResize = canvas.width !== displayWidth || canvas.height !== displayHeight;
            if (needResize) {
                canvas.width = displayWidth;
                canvas.height = displayHeight;
            }
        }

        async function drawFractal(axiom, rules, deg, itMin, itMax, type) { // async so we can use delay inside

            let ang = (deg + 0.2 * (70 - treeSlider1Value)) * (Math.PI / 180); // converts to rad, flips sign, and applies slider value
            const iterations = (Math.floor((0.01 * treeSlider2Value) * (itMax - 1)) + itMin) // mutiplies iterations by sunlight slider, range of itMin - itMax

            let str = axiom;
            let shapeCoordsArr = [];
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
                let strokewidth = 1;

                let tx;
                let ty;
                let tr;
                let tState;
                let saveStack = [];
                let dis = 1;
                let segCount = 0;
                let xLocations = [];
                let xCount = 0;

                assignDefaults();

                let maxTy = ty;
                let maxTx = tx;

                const typeParams = [
                    {
                        "type": "all",
                        "dis": 10,
                        "ang": 45,
                        "str": "++F-F-F-F-F-F-F-F"
                    },
                    {
                        "type": "dataviz",
                        "dis": 10,
                        "ang": 45,
                        "str": "++F-FF-F---FF+++F-F---FF+++F-F---FF"
                    },
                    {
                        "type": "uiux",
                        "dis": 10,
                        "ang": 10,
                        "str": "++++F+++F----------F+++F----------F+++F----------F+++F----------F++F"
                    },
                    {
                        "type": "publication",
                        "dis": 10,
                        "ang": 15,
                        "str": "+++FF-------F-------FF++++++FF-------F-------FF++++++FF-------F-------FF"
                    },
                    {
                        "type": "exhibition",
                        "dis": 10,
                        "ang": 15,
                        "str": "++++F-F-F-F--F----F---F--F-F-F-F----------F-F-F-F--F----F---F--F-F-F-F"
                    },
                ];


                // Count 'F' for segment total
                let totalSegments = 0
                for (let z = 0; z < strSplit.length; z++) {
                    if (strSplit[z] == 'F') { totalSegments++ };
                };

                const timeToDraw = 1.5;
                let segmentsPerFrame = Math.floor(((totalSegments / timeToDraw) / 40)); // contols speed of drawing, divided by ms in delay

                // run with dis = 1 to get initial height

                for (const char of strSplit) {
                    if (!isLoopRunning) {
                        break;
                    }

                    if (char == 'F' || char == 'X') {
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
                dis = (0.9 * canvas.height) / (canvas.height - Math.abs(maxTy)); // get ratio for dis to take up 90% of canvas height

                for (const char of strSplit) {
                    if (!isLoopRunning) {
                        break;
                    }

                    if (char == 'F' || char == 'X') {
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

                        if (char == 'X') {
                            xCount++;
                            xLocations.push({
                                index: xCount,
                                xCoord: tx,
                                yCoord: ty,
                                currentAng: tr,
                                currentWidth: strokewidth
                            });
                        };

                        segCount++;
                        if (segCount % segmentsPerFrame === 0) {
                            await delay(40);
                        }

                    } else if (char == '+') {
                        tr += ang;
                    } else if (char == '-') {
                        tr -= ang
                    } else if (char == '[') {
                        strokewidth -= 0.2;
                        saveStack.push([tx, ty, tr]);
                    } else if (char == ']') {
                        strokewidth += 0.2;
                        [tx, ty, tr] = saveStack.pop();
                        ctx.moveTo(tx, ty)
                    };

                    tState = [tx, ty, tr];

                };

                // once tree is drawn, section 'X' locations based on works of type, then randomly select 'X's to become work links. All others get default flowers

                const worksOfType = data.filter((work) => work.tags.includes(type));

                const xLocationsYCoords = xLocations.map((xLocation) => xLocation.yCoord);
                const xLocationsYCoordsSectionSize = (Math.max(...xLocationsYCoords) - Math.min(...xLocationsYCoords)) / worksOfType.length;
                let xsToLink = [];
                let xYRangeMin = Math.min(...xLocationsYCoords);
                let xYRangeMax = Math.min(...xLocationsYCoords) + xLocationsYCoordsSectionSize;

                // run turtle on Xs to draw type-based flowers
                for (const xLocation of xLocations) {
                    const typeParamsObj = typeParams.find(param => param.type === type);
                    dis = typeParamsObj.dis / iterations;
                    tr = xLocation.currentAng;
                    ang = (typeParamsObj.ang) * (Math.PI / 180); // converts to rad
                    tx = xLocation.xCoord;
                    ty = xLocation.yCoord;

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
                            ctx.strokeStyle = rootStyles.getPropertyValue('--' + type);
                            ctx.lineWidth = xLocation.currentWidth;
                            ctx.stroke();

                            segmentsPerFrame = 10; // make this proportional to iterations.. somehow
                            segCount++;
                            if (segCount % segmentsPerFrame === 0) {
                                await delay(0);
                            }

                        } else if (char == '+') {
                            tr += ang;
                        } else if (char == '-') {
                            tr -= ang
                        }
                    }
                };

                // add link buttons

                i = 0
                let rangePadding = 10; // in pixels
                while (i < worksOfType.length) {
                    i++;

                    xRange = xLocations.filter((xLocation) => xLocation.yCoord > (xYRangeMin + rangePadding) && xLocation.yCoord < (xYRangeMax - rangePadding));
                    randomX = xRange[Math.floor(Math.random() * xRange.length)];

                    ctx.beginPath();
                    ctx.arc(randomX.xCoord, randomX.yCoord, 10, 0, 2 * Math.PI);
                    ctx.strokeStyle = rootStyles.getPropertyValue('--' + type);
                    ctx.lineWidth = 2;
                    ctx.stroke();

                    xYRangeMin += xLocationsYCoordsSectionSize;
                    xYRangeMax += xLocationsYCoordsSectionSize;

                };

            };

        };


        let fuzzyWeedParams = [['F', 'FF'], ['X', 'F[-X]F[-X]+X']];
        let stochasticFuzzyWeedParams = [['F', 'FF'], ['X', 'F-[[X]+X]+F[+FX]-X,F+[[X]-X]-F[-FX]+X']];
        let stochasticArrowWeedParams = [['F', 'FF'], ['X', 'F[+X][-X]FX,F[-X][+X]FX']];
        let tallSeaweedParams = [['F', 'F[+F]F[-F]F']];
        let stochasticTallSeaweedParams = [['F', 'F[+F]F[-F]F,F[-F]F[+F]F']];

        let drawTimer;

        function drawToCanvas() {
            isLoopRunning = false;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            clearTimeout(drawTimer);
            drawTimer = setTimeout(() => { //do this once user has stopped resizing
                resizeCanvasToDisplaySize(canvas);
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                isLoopRunning = true
                drawFractal('X', stochasticFuzzyWeedParams, 22, 2, 5, 'exhibition');
            }, 1000);
        };

        window.addEventListener('resize', () => {
            drawToCanvas()
        })

        //on form action behavior

        treeSlider1.addEventListener('input', (e) => {
            treeSlider1Value = e.target.value;
            drawToCanvas()
        });

        treeSlider2.addEventListener('input', (e) => {
            treeSlider2Value = e.target.value;
            drawToCanvas()
        });

    });

// TODO:
// fix timer
// decide tree forms
// link clickable buttons
//add animated intro