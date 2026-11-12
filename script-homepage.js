const canvas = document.getElementById("treeCanvas");
const ctx = canvas.getContext("2d");
const whiteCanvas = document.getElementById('treeCanvasWhite');
const whiteCtx = whiteCanvas.getContext('2d');
const textureContainer = document.getElementById('texture-container');
const desktopAbout = document.getElementById('home-about-desktop');
const toggleViewBtnDesktop = document.getElementById('view-toggle-btn-desktop');
const toggleViewBtnMobile = document.getElementById('view-toggle-btn-mobile');
let onMobile = false;
if (window.innerWidth <= 767) {
    onMobile = true;
}

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

// INTRO ANIMATION

const introBtnArr = document.querySelectorAll('.intro-btn');
const introBtnsContainer = document.getElementById('intro-animation');
const introLabel = document.getElementById('intro-label');
const introAnimationContainer = document.getElementById('intro-animation-container');

// ease animation pause on hover

const spinAnims = [introBtnsContainer, ...introBtnArr].flatMap(el => el.getAnimations());
let rate = 1;
let target = 1;
let frameId;

function easeRate() {
    rate += (target - rate) * 0.15; // easing speed
    if (Math.abs(target - rate) < 0.01) rate = target;

    for (const anim of spinAnims) anim.playbackRate = rate;

    if (rate !== target) frameId = requestAnimationFrame(easeRate);
}

function setSpin(newTarget) {
    target = newTarget;
    cancelAnimationFrame(frameId);
    frameId = requestAnimationFrame(easeRate);
}

function arrangeIntroBtns() {
    const radius = (introBtnsContainer.offsetWidth / 2);
    let btnNum = 0;

    let halfBtnWidth = '40px';
    if (window.innerWidth < 400) {
        halfBtnWidth = '30px'
    }

    for (const btn of introBtnArr) {
        const angle = ((btnNum / introBtnArr.length) * 2 * Math.PI) - (Math.PI / 2);
        btn.style.left = `calc(50% + ${radius * Math.cos(angle)}px - ${halfBtnWidth})`;
        btn.style.top = `calc(50% + ${radius * Math.sin(angle)}px - ${halfBtnWidth})`;
        btnNum++;
    }

}

// apply animation

arrangeIntroBtns();

for (const btn of introBtnArr) {
    btn.addEventListener('mouseenter', (e) => {
        setSpin(0);

        const btnId = e.target.id
        const btnType = btnId.slice(btnId.indexOf('-') + 1, btnId.indexOf('-', btnId.indexOf('-') + 1))

        switch (btnType) {
            case 'all':
                introLabel.innerHTML = '<p>All Work</p>'
                break;
            case 'dataviz':
                introLabel.innerHTML = '<p>Data Visualization</p>'
                break;
            case 'exhibition':
                introLabel.innerHTML = '<p>Exhibition Design</p>';
                break;
            case 'uiux':
                introLabel.innerHTML = '<p>UI/UX</p>';
                break;
            case 'publication':
                introLabel.innerHTML = '<p>Publication Design</p>';
                break;
        }
    });
    btn.addEventListener('mouseleave', () => {
        setSpin(1)

        introLabel.innerHTML = '';
    });
};

// LOAD WORKS, tree drawing, list drawing

readWorkJSON('assets/work.json')
    .then(data => {

        // TREE DRAWING

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
        const treeFormContainer = document.getElementById('tree-form-container');
        const treeFormHeader = document.getElementById('form-header');
        const treeLinksContainer = document.getElementById('tree-links-container');

        let drawTimer;
        let isLoopRunning = true;
        if (!(localStorage.getItem("currentType"))) {
            localStorage.setItem("currentType", "all");
        };

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
            let iterations = 5; // fallback
            if (type == 'all' && treeSlider2Value < 50) {
                iterations = 5 // so dots actually draw lol
            } else {
                iterations = (Math.floor((0.01 * treeSlider2Value) * (itMax - 1)) + itMin) // mutiplies iterations by sunlight slider, range of itMin - itMax

            };

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
                        "type": "all",
                        "dis": 10,
                        "ang": 45,
                        "str": "++F-F-F-F-F-F-F-F"
                    },
                    {
                        "type": "dataviz",
                        "dis": 10,
                        "ang": 45,
                        "str": "++F-F-F-F-F-F-F-F"
                    },
                    {
                        "type": "uiux",
                        "dis": 10,
                        "ang": 45,
                        "str": "++F-F-F-F-F-F-F-F"
                    },
                    {
                        "type": "publication",
                        "dis": 10,
                        "ang": 45,
                        "str": "++F-F-F-F-F-F-F-F"
                    },
                    {
                        "type": "exhibition",
                        "dis": 10,
                        "ang": 45,
                        "str": "++F-F-F-F-F-F-F-F"
                    },
                ];

                // set up svg btn icons

                const circleBlue = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 25 25"><circle fill="#445f35" cx="12.5" cy="12.5" r="12.05"/><circle fill="#449af4" cx="12.5" cy="12.5" r="12.05"/><circle fill="none" stroke="#000" stroke-miterlimit="10" stroke-width=".5" cx="12.5" cy="12.5" r="12.05"/></svg>`;
                const circleGreen = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 25 25"><circle fill="#445f35" cx="12.5" cy="12.5" r="12.05"/><circle fill="#79ad3d" cx="12.5" cy="12.5" r="12.05"/><circle fill="none" stroke="#000" stroke-miterlimit="10" stroke-width=".5" cx="12.5" cy="12.5" r="12.05"/></svg>`;
                const circleOrange = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 25 25"><circle fill="#445f35" cx="12.5" cy="12.5" r="12.05"/><circle fill="#ff7c48" cx="12.5" cy="12.5" r="12.05"/><circle fill="none" stroke="#000" stroke-miterlimit="10" stroke-width=".5" cx="12.5" cy="12.5" r="12.05"/></svg>`;
                const circleYellow = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 25 25"><circle fill="#445f35" cx="12.5" cy="12.5" r="12.05"/><circle fill="#ffc217" cx="12.5" cy="12.5" r="12.05"/><circle fill="none" stroke="#000" stroke-miterlimit="10" stroke-width=".5" cx="12.5" cy="12.5" r="12.05"/></svg>`;

                const diamondSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 50 50"><polygon fill="#79ad3d" stroke="#000" stroke-miterlimit="10" stroke-width=".5" points="50 17.28 45.31 5.12 32.22 26.75 31.28 12.72 20.47 5.45 22.17 31.04 13.03 19.67 0 19.92 20.08 44.88 33.41 44.68 50 17.28"/></svg>`;
                const doubleSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 50 50"><path fill="#449af4" stroke="#000" stroke-miterlimit="10" stroke-width=".5" d="M32.76,8.23c-2.96,2.85-5.73,6.87-7.99,11.29-1.99-4.49-4.5-8.6-7.26-11.58C10.84.72,5.27,2.84,5.09,12.68c-.18,9.84,5.09,23.67,11.77,30.9,3.51,3.79,6.7,4.99,8.97,3.86,1.65-.49,3.52-1.65,5.53-3.59,7.08-6.83,13.14-20.34,13.52-30.17.38-9.83-5.05-12.27-12.13-5.44Z"/></svg>`;
                const starSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 50 50"><polygon fill="#ffc217" stroke="#000" stroke-miterlimit="10" stroke-width=".5" points="10.66 19.39 11.1 6.26 24 8.71 36.62 5.07 38.28 18.09 45.65 28.96 33.77 34.57 25.71 44.93 16.7 35.37 4.35 30.91 10.66 19.39"/></svg>`;
                const triangleSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 50 50"><polygon fill="#ff7c48" stroke="#000" stroke-miterlimit="10" stroke-width=".5" points="28.94 6.11 25 29.88 21.06 6.11 .27 16.78 25 41.57 26.66 39.9 49.73 16.78 28.94 6.11"/></svg>`;

                // Count 'F' and 'E' for segment total
                let totalSegments = 0
                for (let z = 0; z < strSplit.length; z++) {
                    if (strSplit[z] == 'F' || strSplit[z] == 'E') { totalSegments++ };
                };

                // DRAWING TREE

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
                                    ctx.strokeStyle = rootStyles.getPropertyValue('--all');
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

                };

                // draw white tree for hover state

                whiteCanvas.width = canvas.width;
                whiteCanvas.height = canvas.height;

                whiteCtx.clearRect(0, 0, whiteCanvas.width, whiteCanvas.height);

                // copy current tree image
                whiteCtx.drawImage(canvas, 0, 0);

                // recolor tree image
                whiteCtx.globalCompositeOperation = 'source-in';
                whiteCtx.fillStyle = '#f7f3eb';
                whiteCtx.fillRect(0, 0, whiteCanvas.width, whiteCanvas.height);

                // once tree is drawn, section 'E' locations based on works of type, then randomly select 'E's to become work links. All others get default flowers

                const worksOfType = data.filter((work) => work.tags.includes(type));

                // Drawing buttons

                const linkBtnHeight = 90; // these come from style.css
                const linkBtnWidth = 60;
                let outerBoundsRect = {};
                const formTopBound = document.getElementById('form-header').getBoundingClientRect().top;
                const padding = 20 // in pixels

                // define bounds rect differently based on screen size
                if (onMobile) {
                    outerBoundsRect = {
                        bottom: formTopBound - padding - linkBtnHeight,
                        left: padding,
                        right: window.innerWidth - padding - linkBtnWidth,
                        top: padding
                    };
                } else {
                    outerBoundsRect = {
                        bottom: formTopBound - padding - linkBtnHeight,
                        left: window.innerWidth / 4 + padding,
                        right: window.innerWidth - (window.innerWidth / 4) - padding - linkBtnWidth,
                        top: padding
                    };
                }

                const maxOverlapAttempts = 400;
                let overlapAttempts = 0;
                let btnRectArr = [];

                // use only E locations that fall above the form and within outerBoundsRect
                const eLocationsBounded = eLocations
                    .filter((eLocation) =>
                        eLocation.yCoord < outerBoundsRect.bottom &&
                        eLocation.xCoord >= outerBoundsRect.left &&
                        eLocation.xCoord <= outerBoundsRect.right
                    );

                const eLocationsYCoords = eLocationsBounded.map((eLocation) => eLocation.yCoord);
                const eLocationsYCoordsSectionSize = (Math.max(...eLocationsYCoords) - Math.min(...eLocationsYCoords)) / worksOfType.length;
                let eYRangeMin = Math.max(...eLocationsYCoords) - eLocationsYCoordsSectionSize;
                let eYRangeMax = Math.max(...eLocationsYCoords);
                const rangePadding = 10;

                for (const work of worksOfType) {

                    if (!isLoopRunning) {
                        break;
                    }

                    //choose location

                    let randomE;
                    let newRect;
                    let isOverlapping = false;
                    overlapAttempts = 0

                    eRange = eLocationsBounded.filter((eLocation) => eLocation.yCoord > (eYRangeMin + rangePadding) && eLocation.yCoord < (eYRangeMax - rangePadding));

                    do {
                        randomE = eRange[Math.floor(Math.random() * eRange.length)];

                        newRect = {
                            bottom: randomE.yCoord + linkBtnHeight,
                            left: randomE.xCoord,
                            right: randomE.xCoord + linkBtnWidth,
                            top: randomE.yCoord
                        };

                        if (overlapAttempts < maxOverlapAttempts) { // only checks overlap if under maxAttempts
                            overlapAttempts++;
                            for (const drawnRect of btnRectArr) {
                                if (!(newRect.right < drawnRect.left || newRect.left > drawnRect.right || newRect.bottom < drawnRect.top || newRect.top > drawnRect.bottom)) {
                                    isOverlapping = true;
                                } else {
                                    isOverlapping = false;
                                }
                            };
                        }

                    } while (isOverlapping && overlapAttempts < maxOverlapAttempts);

                    eYRangeMin -= eLocationsYCoordsSectionSize;
                    eYRangeMax -= eLocationsYCoordsSectionSize;

                    btnRectArr.push(newRect);

                    //set up HTML

                    const rotation = (((Math.atan2(firstBranchCoords[1] - randomE.yCoord, firstBranchCoords[0] - randomE.xCoord)) * 180) / Math.PI) - 90; // radiate from center. It just works

                    let iconSvg;
                    switch (type) {
                        case 'all':
                            switch (work.tags[0]) {
                                case 'dataviz':
                                    iconSvg = circleGreen;
                                    break
                                case 'exhibition':
                                    iconSvg = circleBlue;
                                    break
                                case 'uiux':
                                    iconSvg = circleYellow;
                                    break
                                case 'publication':
                                    iconSvg = circleOrange;
                                    break
                            }
                            break;
                        case 'dataviz':
                            iconSvg = diamondSvg;
                            break;
                        case 'exhibition':
                            iconSvg = doubleSvg;
                            break;
                        case 'uiux':
                            iconSvg = starSvg;
                            break;
                        case 'publication':
                            iconSvg = triangleSvg;
                            break;
                    }

                    const newLinkBtn = document.createElement('a');

                    // centers on location by subtracting half of container size
                    if (type == 'all') {
                        newLinkBtn.style.top = (randomE.yCoord - 15).toString() + 'px';
                        newLinkBtn.style.left = (randomE.xCoord - 15).toString() + 'px';
                    } else {
                        newLinkBtn.style.top = (randomE.yCoord - (linkBtnHeight / 2)).toString() + 'px';
                        newLinkBtn.style.left = (randomE.xCoord - (linkBtnWidth / 2)).toString() + 'px';
                    }

                    newLinkBtn.href = work.link;
                    newLinkBtn.classList.add("tree-link-btn");
                    if (type == 'all') {
                        newLinkBtn.classList.add("all-btn")
                    }

                    const btnIcon = document.createElement('div');
                    btnIcon.style.display = 'flex';
                    btnIcon.style.justifyContent = 'center';
                    btnIcon.style.alignItems = 'center';
                    btnIcon.style.width = '100%';
                    btnIcon.style.aspectRatio = '2';
                    btnIcon.style.zIndex = '2';
                    btnIcon.classList.add("tree-link-btn-icon");

                    btnIcon.innerHTML = iconSvg;
                    const btnIconSvg = btnIcon.firstElementChild;
                    btnIconSvg.style.width = '100%';
                    btnIconSvg.style.height = 'auto';
                    btnIconSvg.style.transform = `rotate(${rotation}deg)`;

                    const btnLabel = document.createElement('div');
                    btnLabel.classList.add("tree-link-btn-label");

                    const btnLabelSpan = document.createElement('span');
                    btnLabelSpan.innerHTML = work.name
                    btnLabelSpan.classList.add(type + "-label");
                    if (type == 'all') {
                        btnLabelSpan.classList.add(work.tags[0] + "-label");
                    }

                    btnLabel.appendChild(btnLabelSpan);
                    newLinkBtn.appendChild(btnIcon);
                    if (type == 'all') {
                        btnLabel.classList.add('hidden');
                    };
                    newLinkBtn.appendChild(btnLabel);
                    treeLinksContainer.appendChild(newLinkBtn);

                    // animate in
                    newLinkBtn.animate([
                        { transform: 'scale(0)' },
                        { transform: 'scale(1)' }
                    ], {
                        duration: 200,
                        easing: "ease-in",
                        fill: "forwards"
                    });

                    btnLabel.animate([
                        { opacity: '0' },
                        { opacity: '1' }
                    ], {
                        duration: 300,
                        easing: "ease-in",
                        fill: "forwards"
                    });

                    await delay(40);

                    // darken on hover
                    if (Object.hasOwn(work, "img-link")) {
                        newLinkBtn.addEventListener('mouseenter', (e) => {

                            // change backgroud image
                            textureContainer.style.backgroundImage = `url(assets/textures/tx-${work.id}.png)`;
                            textureContainer.style.opacity = 1;

                            // turn everything white
                            treeFormContainer.style.opacity = 0;
                            desktopAbout.style.opacity = 0;
                            toggleViewBtnMobile.style.opacity = 0;

                            canvas.style.opacity = 0;
                            whiteCanvas.style.opacity = 1;

                            const linkBtns = document.querySelectorAll('.tree-link-btn');
                            for (const linkBtn of linkBtns) {
                                if (!(linkBtn.matches(':hover'))) {
                                    linkBtn.classList.add('white');
                                }
                            }

                            // if all work, add nametag
                            if (localStorage.getItem('currentType') === 'all') {
                                btnLabel.classList.remove('hidden');
                            }

                        });
                        newLinkBtn.addEventListener('mouseleave', (e) => {

                            // reset background image
                            textureContainer.style.opacity = 0;

                            // return original colors
                            treeFormContainer.style.opacity = 1;
                            desktopAbout.style.opacity = 1;
                            toggleViewBtnMobile.style.opacity = 1;

                            const linkBtns = document.querySelectorAll('.tree-link-btn');
                            for (const linkBtn of linkBtns) {
                                linkBtn.classList.remove('white');
                            }

                            canvas.style.opacity = 1;
                            whiteCanvas.style.opacity = 0;

                            // if all work, remove nametag
                            if (localStorage.getItem('currentType') === 'all') {
                                btnLabel.classList.add('hidden');
                            }
                        });
                    }
                }

            };

        };

        // set up cases where trees are drawn

        function drawToCanvas(type, delay) {
            if (localStorage.getItem("pastIntro") === "true") { // only draw if user has passed through intro animation
                isLoopRunning = false;
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                treeLinksContainer.replaceChildren();
                clearTimeout(drawTimer);

                drawTimer = setTimeout(async () => { //do this once user has stopped resizing or inputting
                    resizeCanvasToDisplaySize(canvas);
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                    isLoopRunning = true

                    // catch when buttons can't be drawn and retry full tree draw
                    const maxRetries = 5;
                    let attempt = 1;
                    while (attempt <= maxRetries) {
                        attempt++
                        try {
                            await drawFractal(type);
                            break;
                        } catch (err) {

                            if (!isLoopRunning || attempt === maxRetries) break;

                            // clear the failed attempt before trying again
                            ctx.clearRect(0, 0, canvas.width, canvas.height);
                            treeLinksContainer.replaceChildren();
                        }
                    }
                }, delay);

            }
        };

        function drawOnBtnClick(e) {

            // check if this is being drawn on a button click, or being drawn if user is past intro

            if (typeof e?.target?.id !== "undefined") {
                const btnId = e.target.id
                const btnType = btnId.slice(btnId.indexOf('-') + 1, btnId.indexOf('-', btnId.indexOf('-') + 1)) // extracts only type name
                localStorage.setItem('currentType', btnType);
            }

            let localCurrentType = localStorage.getItem('currentType');

            // draw tree

            let headerText;

            switch (localCurrentType) {
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
            }, 200);
            drawToCanvas(localCurrentType, 400); // small delay, just so isLoopRunning can work

            drawList();

        }

        window.addEventListener('resize', () => {
            arrangeIntroBtns();
            drawToCanvas(localStorage.getItem('currentType'), 1000);
            if (window.innerWidth <= 767) {
                onMobile = true;
            };
        })

        //on form action behavior

        treeSlider1.addEventListener('input', (e) => {
            treeSlider1Value = e.target.value;
            drawToCanvas(localStorage.getItem('currentType'), 1000)
        });

        treeSlider2.addEventListener('input', (e) => {
            treeSlider2Value = e.target.value;
            drawToCanvas(localStorage.getItem('currentType'), 1000)
        });

        // on form seed button click

        for (const treeBtn of treeBtns) {
            treeBtn.addEventListener('click', (e) => drawOnBtnClick(e));
        }

        // on intro seed btn click
        for (const btn of introBtnArr) {

            btn.addEventListener('click', (e) => {
                localStorage.setItem("pastIntro", "true");

                const desktopAbout = document.getElementById('home-about-desktop');
                const mobileAbout = document.getElementById('home-about-mobile');
                treeFormContainer.style.opacity = 1;
                desktopAbout.style.opacity = 1;
                mobileAbout.style.opacity = 0;
                toggleViewBtnMobile.style.opacity = 1;
                introAnimationContainer.style.opacity = 0;
                setTimeout(() => {
                    introAnimationContainer.style.display = 'none';
                }, 200);

                drawOnBtnClick(e);
            })
        }

        // LIST VIEW

        const listSection = document.getElementById('list-section');
        const listHeader = document.getElementById('list-header');
        const listMenu = document.getElementById('list-menu');
        const listContainer = document.getElementById('list-container');
        const listBtns = document.querySelectorAll('#list-header-btns span');

        function drawList() {

            let localCurrentType = localStorage.getItem('currentType');

            // fill header text

            let headerText; // this section is copied from tree form header replacement above

            switch (localCurrentType) {
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

            listHeader.classList.add('hidden');
            listContainer.style.transition = 'none';
            listContainer.style.opacity = '0';
            listContainer.style.transform = 'translateY(10px)';

            setTimeout(() => {
                listHeader.innerHTML = headerText;
                listHeader.classList.remove('hidden');
                listContainer.style.transition = 'transform 0.2s ease-in-out, opacity 0.2s ease-in-out';
                listContainer.style.opacity = '1';
                listContainer.style.transform = 'translateY(0)';
            }, 200);

            // create new list elements

            listContainer.replaceChildren();

            const worksOfType = data.filter((work) => work.tags.includes(localStorage.getItem('currentType')));
            for (const work of worksOfType) {

                const listLinkBtn = document.createElement('a');
                listLinkBtn.classList.add('list-link-btn');
                listLinkBtn.href = work.link;

                const title = document.createElement('div');
                title.classList.add('list-link-title');
                title.innerText = work.name;

                const subtitle = document.createElement('div');
                subtitle.classList.add('list-link-subtitle');
                subtitle.innerText = work.kind;

                let tags = [];
                for (const tag of work.tags) {
                    if (tag !== "all") {
                        tags.push(`<span class="${tag}-highlight">${tag}</span>`);
                    }
                }
                const tagsStr = tags.join("&ensp;");
                const tagsContainer = document.createElement('div');
                tagsContainer.classList.add('list-link-tags');
                tagsContainer.innerHTML = tagsStr;

                listLinkBtn.addEventListener('mouseenter', () => {

                    // turn everything white
                    // copied from above "turn everything white"

                    textureContainer.style.backgroundImage = `url(assets/textures/tx-${work.id}.png)`;
                    textureContainer.style.opacity = 1;

                    desktopAbout.style.opacity = 0;
                    listMenu.style.opacity = 0;
                    toggleViewBtnMobile.style.opacity = 0;
                    listLinkBtn.classList.add('white');

                    const listLinkBtns = document.querySelectorAll('.list-link-btn');
                    for (const b of listLinkBtns) {
                        if (!(b.matches(':hover'))) {
                            b.style.opacity = 0;
                        }
                    };
                });

                listLinkBtn.addEventListener('mouseleave', () => {

                    // return original colors
                    // copied from above "return original colors"

                    textureContainer.style.opacity = 0;
                    desktopAbout.style.opacity = 1;
                    listMenu.style.opacity = 1;
                    toggleViewBtnMobile.style.opacity = 1;
                    listLinkBtn.classList.remove('white');

                    const listLinkBtns = document.querySelectorAll('.list-link-btn');
                    for (const b of listLinkBtns) {
                        b.style.opacity = 1;
                    };
                });

                listLinkBtn.append(title, subtitle, tagsContainer);
                listContainer.append(listLinkBtn);

                // color btns

                for (const b of listBtns) {
                    b.className = "";
                    if (b.innerText == localCurrentType) {
                        b.classList.add(`${localCurrentType}-highlight`);
                    }
                }

            }
        };

        drawList();

        // list menu

        for (const b of listBtns) {
            b.addEventListener('click', () => {
                localStorage.setItem('currentType', b.innerText);
                drawList();
            })
        }

        // TOGGLE VIEW

        const toggleBtnTextDesktop = document.querySelector("#view-toggle-btn-desktop span");
        const toggleBtnTextMobile = document.querySelector("#view-toggle-btn-mobile span");

        function switchView() {
            if (treeFormContainer.style.display !== "none") {

                listSection.style.display = "flex";
                setTimeout(() => {
                    listSection.style.opacity = 1;
                }, 1);

                treeFormContainer.style.opacity = 0;
                treeLinksContainer.style.opacity = 0;
                canvas.style.opacity = 0;

                setTimeout(() => {
                    treeFormContainer.style.display = "none";
                    treeLinksContainer.style.display = "none";
                    canvas.style.display = "none";
                }, 200);

                toggleBtnTextDesktop.innerText = ' List View';
                toggleBtnTextMobile.innerText = ' List View';


            } else {

                drawOnBtnClick();

                treeFormContainer.style.display = "";
                treeLinksContainer.style.display = "";
                canvas.style.display = "";

                setTimeout(() => {
                    treeFormContainer.style.opacity = 1;
                    treeLinksContainer.style.opacity = "1";
                    canvas.style.opacity = 1;
                }, 1);

                listSection.style.opacity = 0;

                setTimeout(() => {
                    listSection.style.display = "none";
                }, 200);

                toggleBtnTextDesktop.innerText = ' Tree View';
                toggleBtnTextMobile.innerText = ' Tree View';

            }
        }

        toggleViewBtnDesktop.addEventListener('click', () => {
            switchView();
        })

        toggleViewBtnMobile.addEventListener('click', () => {
            switchView();
        })


        // CHECK PASTINTRO

        if (localStorage.getItem("pastIntro") === "true") {
            introAnimationContainer.style.display = "none";
            drawOnBtnClick(localStorage.getItem('currentType'));
            const mobileAbout = document.getElementById('home-about-mobile');
            treeFormContainer.style.opacity = 1;
            desktopAbout.style.opacity = 1;
            toggleViewBtnMobile.style.opacity = 1;
            mobileAbout.style.opacity = 0;
            introAnimationContainer.style.display = 'none';
            introAnimationContainer.style.opacity = 0;
        } else {
            introAnimationContainer.style.opacity = 1; // so that it doesn't show for a brief second on reload
        };

    });
