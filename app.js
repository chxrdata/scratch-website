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

readWorkJSON('assets/work.json')
    .then(data => {

        // init
        const treeSlider1 = document.getElementById('tr-range-1');
        let treeSlider1Value = treeSlider1.value;
        const treeSlider2 = document.getElementById('tr-range-2');
        let treeSlider2Value = treeSlider2.value;
        const treeAllBtn = document.getElementById('tree-all-btn');
        const treeDatavizBtn = document.getElementById('tree-dataviz-btn');
        const treeExhibitionBtn = document.getElementById('tree-exhibition-btn');
        const treeUiuxBtn = document.getElementById('tree-uiux-btn');
        const treePublicationBtn = document.getElementById('tree-publication-btn');
        const treeBtns = [treeAllBtn, treeDatavizBtn, treeExhibitionBtn, treeUiuxBtn, treePublicationBtn]

        let drawTimer;
        let currentType = 'all';
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

        //tree drawing function

        async function drawFractal(type) { // async so we can use delay inside

            // set parameters based on type

            let rules = [];
            let deg = 0;
            let itMin = 3;
            let itMax = 6;

            switch (type) {
                case 'all':
                    rules = [['F', 'FF'], ['X', 'F-[[X]+X]+F[+FX]-X,F+[[X]-X]-F[-FX]+X']];
                    deg = 20;
                    break;
                case 'dataviz':
                    rules = [['F', 'FF'], ['X', 'F-[[X]+X]+F[+X]FX,F+[[X]-X]-F[-X]FX']];
                    deg = 22;
                    break;
                case 'exhibition':
                    rules = [['F', 'FF'], ['X', 'F-F+[[X]+X]-F[+X][-X],F+F-[[X]-X]+F[-X][+X]']];
                    deg = 18;
                    break;
                case 'uiux':
                    rules = [['F', 'FF'], ['X', 'F[X]+F[-X]-[++X][-X],F[X]-F[+X]+[--X][+X]']];
                    deg = 20;
                    break;
                case 'publication':
                    rules = [['F', 'FF'], ['X', 'F-[-X+F+X]+[+X-F-X],F+[-X+F+X]-[+X-F-X]']];
                    deg = 22;
                    break;

            }

            let ang = (deg + 0.2 * (70 - treeSlider1Value)) * (Math.PI / 180); // converts to rad, flips sign, and applies slider value
            const iterations = (Math.floor((0.01 * treeSlider2Value) * (itMax - 1)) + itMin) // mutiplies iterations by sunlight slider, range of itMin - itMax

            let str = 'X';
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


                // Count 'F' and 'X' for segment total
                let totalSegments = 0
                for (let z = 0; z < strSplit.length; z++) {
                    if (strSplit[z] == 'F' || strSplit[z] == 'X') { totalSegments++ };
                };

                const timeToDraw = 1.5;
                let segmentsPerFrame = Math.ceil((totalSegments / (timeToDraw * 62.5))); // sets segmentsPerFrame to value needed to draw in timeToDraw. derived in sketchbook it just works ok

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
                            });

                            // save current state

                            const savedDis = dis;
                            const savedTr = tr;
                            const savedAng = ang;
                            const savedTx = tx;
                            const savedTy = ty;

                            // draw flower
                            const typeParamsObj = typeParams.find(param => param.type === type);
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
                                    ctx.strokeStyle = rootStyles.getPropertyValue('--' + type);
                                    ctx.lineWidth = strokewidth;
                                    ctx.stroke();

                                } else if (char == '+') {
                                    tr += ang;
                                } else if (char == '-') {
                                    tr -= ang
                                }
                            }

                            // reset to saved
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
                        strokewidth -= 0.1;
                        saveStack.push([tx, ty, tr]);
                    } else if (char == ']') {
                        strokewidth += 0.1;
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

                // add link buttons
                // change this to draw element in HTML on top of canvas. Also, animate in like fruit

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

        // set up cases where trees are drawn


        function drawToCanvas(type, delay) {
            isLoopRunning = false;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            clearTimeout(drawTimer);
            drawTimer = setTimeout(() => { //do this once user has stopped resizing or inputting
                resizeCanvasToDisplaySize(canvas);
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                isLoopRunning = true
                drawFractal(type);
            }, delay);
        };

        window.addEventListener('resize', () => {
            drawToCanvas(currentType, 1000)
        })

        //on form action behavior

        treeSlider1.addEventListener('input', (e) => {
            treeSlider1Value = e.target.value;
            drawToCanvas(currentType, 1000)
        });

        treeSlider2.addEventListener('input', (e) => {
            treeSlider2Value = e.target.value;
            drawToCanvas(currentType, 1000)
        });

        // on seed button click

        for (const treeBtn of treeBtns) {
            treeBtn.addEventListener('click', (e) => {
                const btnId = e.target.id
                const btnType = btnId.slice(btnId.indexOf('-') + 1, btnId.indexOf('-', btnId.indexOf('-') + 1)) // extracts only type name
                currentType = btnType;
                drawToCanvas(currentType, 100); // small delay, just so isLoopRunning can work
            });
        }


    });

//TODO:
// add fruits
// limit "fruits" to middle range of Y coords?
// link clickable buttons
//add animated intro