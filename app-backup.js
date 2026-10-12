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
        const treeFormHeader = document.getElementById('form-header');
        const treeLinksContainer = document.getElementById('tree-links-container');

        let drawTimer;
        let currentType = 'all';
        let isLoopRunning = true;

        // tree drawing function

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

        //tree drawing function

        async function drawFractal(type) { // async so we can use delay inside

            // set parameters based on type

            let rules = [];
            let deg = 0;
            let itMin = 3;
            let itMax = 6;

            switch (type) {
                case 'all':
                    rules = [['F', 'FF'], ['E', 'F-[[E]+E]+F[+FE]-E,F+[[E]-E]-F[-FE]+E']];
                    deg = 20;
                    break;
                case 'dataviz':
                    rules = [['F', 'FF'], ['E', 'F-[[E]+E]+F[+E]FE,F+[[E]-E]-F[-E]FE']];
                    deg = 22;
                    break;
                case 'exhibition':
                    rules = [['F', 'FF'], ['E', 'F-F+[[E]+E]-F[+E][-E],F+F-[[E]-E]+F[-E][+E]']];
                    deg = 18;
                    break;
                case 'uiux':
                    rules = [['F', 'FF'], ['E', 'F[E]+F[-E]-[++E][-E],F[E]-F[+E]+[--E][+E]']];
                    deg = 20;
                    break;
                case 'publication':
                    rules = [['F', 'FF'], ['E', 'F-[-E+F+E]+[+E-F-E],F+[-E+F+E]-[+E-F-E]']];
                    deg = 22;
                    break;

            }

            let ang = (deg + 0.2 * (70 - treeSlider1Value)) * (Math.PI / 180); // converts to rad, flips sign, and applies slider value
            const iterations = (Math.floor((0.01 * treeSlider2Value) * (itMax - 1)) + itMin) // mutiplies iterations by sunlight slider, range of itMin - itMax

            let str = 'E';
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
                let eLocations = [];
                let eCount = 0;

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


                // Count 'F' and 'E' for segment total
                let totalSegments = 0
                for (let z = 0; z < strSplit.length; z++) {
                    if (strSplit[z] == 'F' || strSplit[z] == 'E') { totalSegments++ };
                };

                const timeToDraw = 1;
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
                dis = (0.9 * canvas.clientHeight) / (canvas.clientHeight - Math.abs(maxTy)); // get ratio for dis to take up 90% of canvas height

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
                                index: eCount,
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

                // once tree is drawn, section 'E' locations based on works of type, then randomly select 'E's to become work links. All others get default flowers

                const worksOfType = data.filter((work) => work.tags.includes(type));

                const eLocationsYCoords = eLocations.map((eLocation) => eLocation.yCoord);
                const eLocationsYCoordsSectionSize = (Math.max(...eLocationsYCoords) - Math.min(...eLocationsYCoords)) / worksOfType.length;
                let eYRangeMin = Math.min(...eLocationsYCoords);
                let eYRangeMax = Math.min(...eLocationsYCoords) + eLocationsYCoordsSectionSize;

                // add link buttons

                let outerBoundsRect = {};
                const formTopBound = document.getElementById('form-header').getBoundingClientRect().top;
                const padding = 10 // in pixels

                if (window.innerWidth < 767) {
                    outerBoundsRect = {
                        bottom: formTopBound + padding,
                        left: padding,
                        right: window.innerWidth - padding,
                        top: padding
                    };
                } else {
                    outerBoundsRect = {
                        bottom: formTopBound + padding,
                        left: window.innerWidth / 4 + padding,
                        right: window.innerWidth - (window.innerWidth / 4) - padding,
                        top: padding
                    };
                    console.log(outerBoundsRect);
                }

                let rangePadding = 10; // in pixels

                for (const work of worksOfType) {
                    eRange = eLocations.filter((eLocation) => eLocation.yCoord > (eYRangeMin + rangePadding) && eLocation.yCoord < (eYRangeMax - rangePadding));
                    randomE = eRange[Math.floor(Math.random() * eRange.length)];

                    let rotation = randomE.currentAng * (180 / Math.PI);

                    let imgSrc;
                    switch (type) {
                        case 'all':
                            imgSrc = 'assets/circle-2.svg';
                            break;
                        case 'dataviz':
                            imgSrc = 'assets/diamond-2.svg';
                            break;
                        case 'exhibition':
                            imgSrc = 'assets/double-2.svg';
                            break;
                        case 'uiux':
                            imgSrc = 'assets/star-2.svg';
                            break;
                        case 'publication':
                            imgSrc = 'assets/triangle-2.svg';
                            break;
                    }

                    const newLinkBtn = document.createElement('a');
                    newLinkBtn.style.top = randomE.yCoord.toString() + 'px';
                    newLinkBtn.style.left = randomE.xCoord.toString() + 'px';
                    newLinkBtn.href = work.link;
                    newLinkBtn.classList.add("tree-link-btn");

                    const btnIcon = document.createElement('div');
                    btnIcon.style.display = 'flex';
                    btnIcon.style.justifyContent = 'center';
                    btnIcon.style.alignItems = 'center';
                    btnIcon.style.width = '100%';
                    btnIcon.style.aspectRatio = '2';
                    btnIcon.style.zIndex = '2';
                    btnIcon.classList.add("tree-link-btn-icon");

                    const btnIconImg = document.createElement('img');
                    btnIconImg.style.transform = `rotate(${rotation}deg)`;
                    btnIconImg.style.filter = ` ${'drop-shadow(0 0 16px rgba(247, 243, 235, 1))'.repeat(4)}`;
                    btnIconImg.src = imgSrc;

                    btnIcon.appendChild(btnIconImg);

                    const btnLabel = document.createElement('div');
                    btnLabel.classList.add("tree-link-btn-label");

                    const btnLabelSpan = document.createElement('span');
                    btnLabelSpan.innerHTML = work.name
                    btnLabelSpan.classList.add(type + "-label");

                    btnLabel.appendChild(btnLabelSpan);
                    newLinkBtn.appendChild(btnIcon);
                    newLinkBtn.appendChild(btnLabel);
                    treeLinksContainer.appendChild(newLinkBtn);

                    console.log(newLinkBtn.getBoundingClientRect());

                    eYRangeMin += eLocationsYCoordsSectionSize;
                    eYRangeMax += eLocationsYCoordsSectionSize;

                }

            };

        };

        // set up cases where trees are drawn

        function drawToCanvas(type, delay) {
            isLoopRunning = false;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            treeLinksContainer.replaceChildren();
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
                let headerText;

                switch (btnType) {
                    case 'all':
                        headerText = 'All Work';
                        break;
                    case 'dataviz':
                        headerText = 'Data Visualization';
                        break;
                    case 'exhibition':
                        headerText = 'Exhibition Design';
                        break;
                    case 'uiux':
                        headerText = 'UI/UX';
                        break;
                    case 'publication':
                        headerText = 'Publication Design';
                        break;
                }

                treeFormHeader.classList.add('hidden');
                setTimeout(() => {
                    treeFormHeader.innerHTML = headerText;
                    treeFormHeader.classList.remove('hidden');
                }, 300);
                drawToCanvas(currentType, 400); // small delay, just so isLoopRunning can work
            });
        }


    });

//TODO:
// prevent fruits overlap by creating "boxes" surrounding already generated fruits, if newly generated fruit falls within box pick new random number and try again
// limit "fruits" to middle range of Y coords?
// color "all" fruits to their types
// fix fruits not clearing sometimes
// fix animated change of text on mobile
// animate in fruits
//add animated intro