document.addEventListener("DOMContentLoaded", () => {
    /* ============================================================
       ELEMENTS
       ============================================================ */
    const items = document.querySelectorAll(".menu-overlay__main ul li");
    const bgImgs = Array.from(document.querySelectorAll(".menu-overlay__bg-img img"));
    const menuOverlay = document.querySelector(".menu-overlay");
    const toggleButton = document.querySelector("#menu-toggle");
    const navbar = document.querySelector(".navbar");

    /* ============================================================
       GSAP PLUGINS
       ============================================================ */
    gsap.registerPlugin(SplitText, ScrollTrigger);

    /* ============================================================
       LENIS + GSAP TICKER + SCROLLTRIGGER BRIDGE
       ============================================================ */
    const lenis = new Lenis({
        duration: 1.15,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        orientation: "vertical",
        gestureOrientation: "vertical",
        smoothWheel: true,
        wheelMultiplier: 1,
        touchMultiplier: 1.5,
        infinite: false,
    });

    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
    lenis.on("scroll", ScrollTrigger.update);

    /* ============================================================
       NAVBAR — hide on scroll down, show on scroll up
       ============================================================ */
    const NAV_THRESHOLD = 120;
    let navbarHidden = false;

    function setNavbarHidden(hidden) {
        if (hidden === navbarHidden) return;
        navbarHidden = hidden;

        gsap.to(navbar, {
            yPercent: hidden ? -180 : 0,
            opacity: hidden ? 0 : 1,
            duration: 0.45,
            ease: hidden ? "power3.in" : "power3.out",
            overwrite: "auto",
            onComplete: () => {
                navbar.style.pointerEvents = hidden ? "none" : "auto";
            },
        });
    }

    lenis.on("scroll", ({ scroll, direction }) => {
        if (document.body.classList.contains("menu-open")) return;
        if (direction === 1 && scroll > NAV_THRESHOLD) setNavbarHidden(true);
        else if (direction === -1 || scroll <= NAV_THRESHOLD) setNavbarHidden(false);
    });

    /* ============================================================
       MENU OVERLAY BACKGROUND IMAGES
       ============================================================ */
    bgImgs.forEach((img, i) => {
        img.style.opacity = i === 0 ? "1" : "0";
        img.style.transform = "scale(1)";
        img.style.visibility = "visible";
        img.style.display = "block";
    });

    gsap.set(bgImgs[0], { opacity: 1, scale: 1 });
    bgImgs.slice(1).forEach((img) => gsap.set(img, { opacity: 0, scale: 1 }));

    function showBgImage(targetIndex) {
        bgImgs.forEach((img, i) => {
            const isTarget = i === targetIndex;
            gsap.to(img, {
                opacity: isTarget ? 1 : 0,
                scale: isTarget ? 1.18 : 1,
                duration: 0.5,
                ease: "power3.inOut",
                overwrite: "auto",
            });
        });
    }

    items.forEach((item, index) => {
        item.addEventListener("mouseenter", () => showBgImage(index + 1));
        item.addEventListener("mouseleave", () => showBgImage(0));
    });

    /* ============================================================
       SPLIT LINK TEXT INTO CHARS
       ============================================================ */
    const splitChars = [];
    document.querySelectorAll("[data-text-anim]").forEach((el) => {
        gsap.set(el, { visibility: "visible" });

        try {
            const split = SplitText.create(el, {
                type: "chars",
                smartWrap: true,
                mask: "chars",
            });
            splitChars.push(...split.chars);
        } catch (e) {
            console.warn("SplitText failed for", el, e);
        }
    });

    /* ============================================================
       MENU OPEN / CLOSE TIMELINE
       ============================================================ */
    const menuTimeline = gsap.timeline({
        paused: true,
        onStart: () => { menuOverlay.style.pointerEvents = "auto"; },
        onReverseComplete: () => {
            menuOverlay.style.pointerEvents = "none";
            menuOverlay.style.clipPath = "polygon(0 0, 100% 0, 100% 0, 0 0)";
        },
    });

    menuTimeline
        .to(menuOverlay, {
            clipPath: "polygon(0% 0%, 100% 0%, 100% 120%, 0% 100%)",
            duration: 0.8,
            ease: "power3.inOut",
        }, 0)
        .to(".menu-overlay__bg-img img", {
            scale: 1.1,
            duration: 1,
            ease: "power3.inOut",
        }, 0)
        .fromTo(splitChars,
            { yPercent: -200 },
            { yPercent: 0, ease: "power2.inOut", duration: 0.5, stagger: 0.01 },
            0.2
        )
        .to(".toggle-line-top", {
            transformOrigin: "center",
            y: 4, scaleX: 0.8, rotation: 45,
            duration: 0.4, ease: "back.out(1.5)",
        }, 0.2)
        .to(".toggle-line-bottom", {
            transformOrigin: "center",
            y: -4, scaleX: 0.8, rotation: -45,
            duration: 0.4, ease: "back.out(1.5)",
        }, 0.2);

    /* ============================================================
       MENU TOGGLE
       ============================================================ */
    let isMenuOpen = false;

    function toggleMenu() {
        if (isMenuOpen) {
            menuTimeline.reverse();
            lenis.start();
            document.body.classList.remove("menu-open");
            isMenuOpen = false;
            toggleButton.setAttribute("aria-expanded", "false");
        } else {
            setNavbarHidden(false);
            menuTimeline.play();
            lenis.stop();
            document.body.classList.add("menu-open");
            isMenuOpen = true;
            toggleButton.setAttribute("aria-expanded", "true");
        }
    }

    toggleButton.addEventListener("click", toggleMenu);
    toggleButton.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            toggleMenu();
        }
    });

    /* ============================================================
       CAROUSEL — EXPLORE THE WORLD
       ============================================================ */
    const cards = gsap.utils.toArray('.carousel-card');
    const timelineProgress = document.querySelector('.timeline-progress');
    const slideCurrent = document.querySelector('.slide-counter .current');
    const totalCards = cards.length;

    gsap.set(cards, { autoAlpha: 0, scale: 0.9, zIndex: 0 });
    gsap.set(cards[0], { autoAlpha: 1, scale: 1, zIndex: 1 });

    const carouselTl = gsap.timeline({
        scrollTrigger: {
            trigger: ".carousel-section",
            start: "top top",
            end: "bottom bottom",
            scrub: 1,
            onUpdate: (self) => {
                const progress = self.progress * 100;
                timelineProgress.style.width = `${progress}%`;
                const currentCardIndex = Math.min(
                    Math.floor(self.progress * totalCards) + 1,
                    totalCards
                );
                slideCurrent.textContent = `0${currentCardIndex}`;
            },
        },
    });

    cards.forEach((card, i) => {
        if (i === 0) return;
        carouselTl
            .to(cards[i - 1], {
                autoAlpha: 0, scale: 1.1, zIndex: 0,
                duration: 1, ease: "power2.inOut",
            })
            .to(card, {
                autoAlpha: 1, scale: 1, zIndex: 1,
                duration: 1, ease: "power2.inOut",
            }, "-=0.5");
    });

    /* ============================================================
       BENTO GRID — pinned + scrubbed (desktop), reveal (mobile)
       ============================================================ */
    const isDesktop = window.matchMedia("(min-width: 1025px)").matches;

    if (isDesktop) {
        const bentoTl = gsap.timeline({
            scrollTrigger: {
                trigger: ".bento-section",
                start: "top top",
                end: "+=300%",
                scrub: 1,
                pin: true,
                anticipatePin: 1,
                invalidateOnRefresh: true,
            },
        });

        bentoTl
            .from(".bento-metric", { x: -150, y: -80, rotate: -15, opacity: 0 })
            .from(".bento-desc", { y: -150, rotate: 8, opacity: 0 }, "-=0.8")
            .from(".bento-portrait", { scale: 0.5, rotate: -10, opacity: 0 }, "-=0.8")
            .from(".bento-typography", { x: -200, opacity: 0 }, "-=0.8")
            .from(".bento-logo", { y: 150, scale: 0.8, opacity: 0 }, "-=0.8")
            .from(".bento-colors", { x: 200, rotate: 12, opacity: 0 }, "-=0.8")
            .from(".bento-users", { x: 120, y: 150, rotate: 5, opacity: 0 }, "-=0.8")
            .from(".bento-oren", { x: 150, scale: 0.8, rotate: -5, opacity: 0 }, "-=0.8");
    } else {
        const bentoTl = gsap.timeline({
            scrollTrigger: {
                trigger: ".bento-section",
                start: "top 75%",
                toggleActions: "play none none reverse",
            },
        });

        bentoTl
            .from(".bento-metric", { x: -100, y: -60, rotate: -15, opacity: 0, duration: 0.8 })
            .from(".bento-desc", { y: -100, rotate: 8, opacity: 0, duration: 0.8 }, "-=0.6")
            .from(".bento-portrait", { scale: 0.5, rotate: -10, opacity: 0, duration: 0.8 }, "-=0.6")
            .from(".bento-typography", { x: -120, opacity: 0, duration: 0.8 }, "-=0.6")
            .from(".bento-logo", { y: 100, scale: 0.8, opacity: 0, duration: 0.8 }, "-=0.6")
            .from(".bento-colors", { x: 120, rotate: 12, opacity: 0, duration: 0.8 }, "-=0.6")
            .from(".bento-users", { x: 100, y: 100, rotate: 5, opacity: 0, duration: 0.8 }, "-=0.6")
            .from(".bento-oren", { x: 100, scale: 0.8, rotate: -5, opacity: 0, duration: 0.8 }, "-=0.6");
    }

    /* ============================================================
       BEACH SECTION — main frame reveal + inner card staggers
       ------------------------------------------------------------
       The whole frame scales + fades in.
       Then the inner card's frost side and clear side reveal,
       followed by the content stagger. All reversible.
       ============================================================ */
    gsap.from(".beach-frame", {
        y: 60,
        opacity: 0,
        scale: 0.96,
        duration: 1.1,
        ease: "power3.out",
        scrollTrigger: {
            trigger: ".beach-section",
            start: "top 80%",
            end: "top 40%",
            toggleActions: "play none none reverse",
        },
    });

    gsap.from(".beach-glass__frost > *, .beach-glass__clear", {
        y: 30,
        opacity: 0,
        duration: 0.8,
        ease: "power2.out",
        stagger: 0.1,
        scrollTrigger: {
            trigger: ".beach-section",
            start: "top 70%",
            end: "top 30%",
            toggleActions: "play none none reverse",
        },
    });

    /* ============================================================
       REFRESH
       ============================================================ */
    ScrollTrigger.refresh();
    window.addEventListener("load", () => ScrollTrigger.refresh());

    window.matchMedia("(min-width: 1025px)").addEventListener("change", () => {
        ScrollTrigger.refresh();
    });
});