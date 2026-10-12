const canvas = document.getElementById("treeCanvas");
const ctx = canvas.getContext("2d");
let pastIntro = false;
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

// intro animation

const introBtnArr = document.querySelectorAll('.intro-btn');
const introBtnsContainer = document.getElementById('intro-animation');
const introLabel = document.getElementById('intro-label');

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

// load works and tree drawing

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
        const thumbnailPopupContainer = document.getElementById('home-thumbnail-popup');

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

                // once tree is drawn, section 'E' locations based on works of type, then randomly select 'E's to become work links. All others get default flowers

                const worksOfType = data.filter((work) => work.tags.includes(type));

                // DRAWING BUTTONS:

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

                    let imgSrc;
                    switch (type) {
                        case 'all':
                            switch (work.tags[0]) {
                                case 'dataviz':
                                    imgSrc = 'assets/circle-2-green.svg';
                                    break
                                case 'exhibition':
                                    imgSrc = 'assets/circle-2-blue.svg';
                                    break
                                case 'uiux':
                                    imgSrc = 'assets/circle-2-yellow.svg';
                                    break
                                case 'publication':
                                    imgSrc = 'assets/circle-2-orange.svg';
                                    break
                            }
                            break;
                        case 'dataviz':
                            imgSrc = 'assets/diamond-1.svg';
                            break;
                        case 'exhibition':
                            imgSrc = 'assets/double-1.svg';
                            break;
                        case 'uiux':
                            imgSrc = 'assets/star-1.svg';
                            break;
                        case 'publication':
                            imgSrc = 'assets/triangle-1.svg';
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

                    const btnIconImg = document.createElement('img');
                    btnIconImg.style.transform = `rotate(${rotation}deg)`;
                    btnIconImg.src = imgSrc;
                    btnIcon.appendChild(btnIconImg);

                    const btnLabel = document.createElement('div');
                    btnLabel.classList.add("tree-link-btn-label");

                    const btnLabelSpan = document.createElement('span');
                    btnLabelSpan.innerHTML = work.name
                    btnLabelSpan.classList.add(type + "-label");

                    btnLabel.appendChild(btnLabelSpan);
                    newLinkBtn.appendChild(btnIcon);
                    if (type !== 'all') {
                        newLinkBtn.appendChild(btnLabel);
                    }
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

                    // thumbnail popup on hover
                    if (Object.hasOwn(work, "img-link")) {
                        newLinkBtn.addEventListener('mouseenter', (e) => {
                            thumbnailPopupContainer.style.display = 'block';

                            const img = document.createElement('img');
                            img.src = work['img-link'];

                            const title = document.createElement('h1');
                            title.innerHTML = work.name;

                            const tags = document.createElement('div');
                            const tagsArr = work.tags.filter(item => item !== 'all');
                            let tagsList = ''
                            for (const tag of tagsArr) {
                                switch (tag) {
                                    case 'dataviz':
                                        tagsList += '<span class="dataviz-highlight">Data Visualization</span>&ensp;'
                                        break;
                                    case 'exhibition':
                                        tagsList += '<span class="exhibition-highlight">Exhibition Design</span>&ensp;';
                                        break;
                                    case 'uiux':
                                        tagsList += '<span class="uiux-highlight">UI/UX</span>&ensp;';
                                        break;
                                    case 'publication':
                                        tagsList += '<span class="publication-highlight">Publication Design</span>&ensp;';
                                        break;
                                }
                            }
                            tags.innerHTML = tagsList;

                            thumbnailPopupContainer.appendChild(img);
                            thumbnailPopupContainer.appendChild(title);
                            thumbnailPopupContainer.appendChild(tags);

                        });
                        newLinkBtn.addEventListener('mouseleave', (e) => {
                            thumbnailPopupContainer.style.display = 'none';
                            thumbnailPopupContainer.replaceChildren();
                            thumbnailPopupContainer.style.backgroundImage = '';
                        });
                    }
                }

            };

        };

        // set up cases where trees are drawn

        function drawToCanvas(type, delay) {
            if (pastIntro === true) { // only draw if user has passed through intro animation
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
            }
        };

        function drawOnBtnClick(e) {
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
        }

        window.addEventListener('resize', () => {
            arrangeIntroBtns();
            drawToCanvas(currentType, 1000);
            if (window.innerWidth <= 767) {
                onMobile = true;
            };
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

        // on form seed button click

        for (const treeBtn of treeBtns) {
            treeBtn.addEventListener('click', (e) => drawOnBtnClick(e));
        }

        // on intro seed btn click
        for (const btn of introBtnArr) {

            btn.addEventListener('click', (e) => {
                pastIntro = true;

                const treeFormContainer = document.getElementById('tree-form-container');
                const desktopAbout = document.getElementById('home-about-desktop');
                const introAnimationContainer = document.getElementById('intro-animation-container');
                treeFormContainer.style.opacity = 1;
                desktopAbout.style.opacity = 1;
                introAnimationContainer.style.opacity = 0;

                drawOnBtnClick(e);
            })
        }

    });

//TODO:
// fix animated change of text on mobile
//add animated intro