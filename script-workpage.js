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

readWorkJSON('assets/work.json')
    .then(data => {

        // find work
        const internalId = document.getElementById("internal-id").textContent
        const work = data.find((work) => work.id === internalId);

        // set up header
        document.getElementById("intro-head").innerText = work.name;
        document.getElementById("intro-head-mobile").innerText = work.name;
        document.getElementById("intro-subhead").innerText = work.kind;
        document.getElementById("intro-subhead-mobile").innerText = work.kind;

        let tags = [];
        for (const tag of work.tags) {
            if (tag !== "all") {
                tags.push(`<span class="${tag}-highlight">${tag}</span>`);
            }
        }
        const tagsStr = tags.join("&ensp;");
        document.getElementById("intro-tags").innerHTML = tagsStr;
        document.getElementById("intro-tags-mobile").innerHTML = tagsStr;

        // set up large images
        const galleryImages = document.getElementById("work-gallery");
        for (const link of work["img-arr-lg"]) {

            if ((link.slice(link.lastIndexOf(".") + 1)) !== "mp4" && (link.slice(link.lastIndexOf(".") + 1)) !== "mov") {
                const img = document.createElement('img');
                img.src = link;
                galleryImages.appendChild(img);
            } else {
                const videoContainer = document.createElement("div");
                videoContainer.style.position = "relative";

                const video = document.createElement("video");
                video.src = link;
                video.autoplay = "true";
                video.loop = "true";
                video.muted = "true"
                videoContainer.appendChild(video);

                if (work.id === 'lnt') { // only add audio controls for videos with audio, which is only lnt currently
                    const volumeBtn = document.createElement("div");
                    volumeBtn.style.backgroundImage = 'url(assets/icons/vol-mute.svg)';
                    volumeBtn.classList.add("volume-btn");

                    volumeBtn.addEventListener('click', () => {
                        if (video.muted === true) {
                            video.muted = false
                            volumeBtn.style.backgroundImage = 'url(assets/icons/vol-unmute.svg)';
                        } else if (video.muted === false) {
                            video.muted = true
                            volumeBtn.style.backgroundImage = 'url(assets/icons/vol-mute.svg)';
                        }
                    })

                    videoContainer.appendChild(volumeBtn);
                }

                galleryImages.appendChild(videoContainer);
            }

        }

        // DESKTOP ONLY

        // set up small images 
        const introImages = document.getElementById("intro-images");
        for (const link of work["img-arr-sm"]) {

            if (link.includes("https")) {
                const iframe = document.createElement("iframe");
                iframe.src = link;
                introImages.appendChild(iframe);
            } else if ((link.slice(link.lastIndexOf(".") + 1)) === "webp" || (link.slice(link.lastIndexOf(".") + 1)) === "png") {
                const img = document.createElement('img');
                img.src = link;
                introImages.appendChild(img);
            } else if ((link.slice(link.lastIndexOf(".") + 1)) === "mp4" || (link.slice(link.lastIndexOf(".") + 1)) === "mov") {
                const video = document.createElement("video");
                video.src = link;
                video.autoplay = "true";
                video.loop = "true";
                video.muted = "true"
                introImages.appendChild(video);
            };

        }

        // set up descriptions
        const introAbout = document.getElementById("intro-about-container");

        function setUpDescriptions() {
            if (onMobile === false) {

                introAbout.replaceChildren();

                if (introImages.clientHeight <= window.innerHeight) { // case for if everything fits in window

                    for (const descr of work["desc-arr"]) {
                        const p = document.createElement("p");
                        p.textContent = descr;
                        p.style.position = 'relative';
                        introAbout.appendChild(p);
                    }

                } else {

                    let i = 0
                    let n = 1

                    // add paragraphs
                    for (const descr of work["desc-arr"]) {
                        i++
                        const p = document.createElement("p");
                        p.innerHTML = descr;
                        if (i === 1) {
                            p.classList.add("visible-description");
                        } else {
                            p.classList.add("hidden-description");
                        }
                        p.id = `para-${i}`;
                        introAbout.appendChild(p);
                    }

                    // set paragraph container height to tallest paragraph
                    const lastP = document.getElementById(`para-${i}`)
                    introAbout.style.height = lastP.clientHeight + 'px';

                    // show paragraphs based on scroll
                    const introHeight = introImages.clientHeight - (window.innerHeight / 2); // subtract half of screen height to ensure last paragraph gets seen
                    const increment = introHeight / i;
                    const ranges = [];
                    while (n <= i) { // assign scroll height ranges to description paragraphs
                        ranges.push({
                            "num": n,
                            "range": [(increment * (n - 1)), (increment * n)]
                        })
                        n++
                    }

                    let currentP = document.getElementById('para-1');

                    document.getElementById("intro-about-container");
                    window.addEventListener('scroll', () => {
                        const scrollTop = window.scrollY;

                        for (const item of ranges) {
                            if (scrollTop > item.range[0] && scrollTop <= item.range[1]) {
                                const newP = document.getElementById(`para-${item.num}`);
                                if (newP !== currentP) {
                                    currentP.classList.replace("visible-description", "hidden-description");
                                    newP.classList.replace("hidden-description", "visible-description");
                                    currentP = newP;
                                }
                            }
                        }

                    });

                }
            }
        }

        setUpDescriptions();

        let timer;
        window.addEventListener('resize', () => {
            clearTimeout(timer);
            timer = setTimeout(() => {
                setUpDescriptions();
            }, 50);

        })

        // MOBILE ONLY

        // set up hero image
        const heroImgContainer = document.getElementById("hero-image-mobile");
        const heroImg = document.createElement("img");
        heroImg.src = work["img-arr-sm"][0];
        heroImgContainer.appendChild(heroImg);

        // alternate intro images and text
        const shortenedImgs = work["img-arr-sm"].slice(1);
        const introInfo = document.getElementById("intro-info-mobile");
        let i = 0;
        for (const link of shortenedImgs) {
            i++
            if (i <= work["desc-arr"].length) {
                const p = document.createElement("p");
                p.textContent = work["desc-arr"][i - 1];
                introInfo.appendChild(p);
            }

            if (link.includes("https")) {
                const iframe = document.createElement("iframe");
                iframe.src = link;
                introInfo.appendChild(iframe);
            } else if ((link.slice(link.lastIndexOf(".") + 1)) === "webp" || (link.slice(link.lastIndexOf(".") + 1)) === "png") {
                const img = document.createElement('img');
                img.src = link;
                introInfo.appendChild(img);
            } else if ((link.slice(link.lastIndexOf(".") + 1)) === "mp4" || (link.slice(link.lastIndexOf(".") + 1)) === "mov") {
                const video = document.createElement("video");
                video.src = link;
                video.autoplay = "true";
                video.loop = "true";
                video.muted = "true"
                introInfo.appendChild(video);
            };

        }
        if (i < work["desc-arr"].length) {
            while (i <= work["desc-arr"].length) {
                i++
                const p = document.createElement("p");
                p.textContent = work["desc-arr"][i - 1];
                introInfo.appendChild(p);
            }
        }

        // FOOTER

        const workIndex = data.indexOf(work);
        const previousWork = data.at(workIndex - 1);
        const nextWork = data.at(workIndex + 1);

        const footer = document.getElementById("footer");
        const footerBtns = document.createElement("div");
        footerBtns.id = "footer-btns"

        const leftBtn = document.createElement('a');
        leftBtn.id = "footer-btn-left";
        leftBtn.href = previousWork.link;
        leftBtn.innerText = previousWork.name;
        const rightBtn = document.createElement('a');
        rightBtn.id = "footer-btn-right";
        rightBtn.href = nextWork.link;
        rightBtn.innerText = nextWork.name;
        footerBtns.append(leftBtn, rightBtn);

        const footerInfo = document.createElement("div");
        footerInfo.id = "footer-info"

        const copyright = document.createElement("div");
        copyright.innerText = "© 2026 Del Cro Halter"
        const socialLinks = document.createElement("div");
        socialLinks.innerText = "social links";
        footerInfo.append(copyright, socialLinks);

        footer.append(footerBtns, footerInfo);

        leftBtn.addEventListener('mouseenter', () => {
            leftBtn.classList.add(`${previousWork.tags[0]}-highlight`)
        })
        leftBtn.addEventListener('mouseleave', () => {
            leftBtn.className = "";
        })

        rightBtn.addEventListener('mouseenter', () => {
            rightBtn.classList.add(`${nextWork.tags[0]}-highlight`)
        })
        rightBtn.addEventListener('mouseleave', () => {
            rightBtn.className = "";
        })

    })

// TODO:
// fix height of description paragraphs
// fix error on intro images all fitting in screen