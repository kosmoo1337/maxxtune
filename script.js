gsap.registerPlugin(ScrollTrigger);

// ====================================
// SMOOTH SCROLL (lerp-based, synced with ScrollTrigger)
// Płynne, "maślane" przewijanie w górę i w dół.
// Zawartość jest przesuwana przez transform, a wysokość
// dokumentu trzyma niewidzialny spacer (body).
// ====================================
var smoother = (function () {
    var wrapper = document.getElementById("smooth-wrapper");
    var content = document.getElementById("smooth-content");
    var prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var isTouch = window.matchMedia("(pointer: coarse)").matches;

    // Na dotyku (telefon) i przy reduced-motion zostawiamy natywny,
    // płynny scroll systemowy — jest lepszy i nie laguje.
    if (!wrapper || !content || prefersReduced || isTouch) {
        document.body.classList.add("native-scroll");
        return null;
    }

    var current = 0;     // aktualna (animowana) pozycja
    var target = 0;      // docelowa pozycja
    var ease = 0.085;    // im mniej, tym bardziej "ślizgająco"
    var height = 0;

    function setBodyHeight() {
        height = content.getBoundingClientRect().height;
        document.body.style.height = height + "px";
    }

    function clampTarget() {
        var max = Math.max(0, height - window.innerHeight);
        if (target < 0) target = 0;
        if (target > max) target = max;
    }

    function onResize() {
        setBodyHeight();
        clampTarget();
    }

    setBodyHeight();
    window.addEventListener("resize", onResize);
    window.addEventListener("load", onResize);
    if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(onResize);
    }

    // Pętla renderująca — interpolacja current -> target
    gsap.ticker.add(function () {
        target = window.scrollY || window.pageYOffset || 0;
        clampTarget();
        current += (target - current) * ease;
        if (Math.abs(target - current) < 0.05) current = target;
        content.style.transform = "translate3d(0," + (-current) + "px,0)";
    });

    // ScrollTrigger czyta animowaną pozycję, nie surowy scroll
    ScrollTrigger.scrollerProxy(document.body, {
        scrollTop: function (value) {
            if (arguments.length) { window.scrollTo(0, value); }
            return current;
        },
        getBoundingClientRect: function () {
            return { top: 0, left: 0, width: window.innerWidth, height: window.innerHeight };
        }
    });

    ScrollTrigger.defaults({ scroller: document.body });
    ScrollTrigger.addEventListener("refreshInit", setBodyHeight);

    return { active: true };
})();

// Płynne przejście do pozycji Y (działa ze smooth scroll i bez niego)
var _scrollObj = { v: 0 };
function smoothGoTo(y) {
    var maxH = Math.max(0, (smoother ? document.body.offsetHeight : document.documentElement.scrollHeight) - window.innerHeight);
    y = Math.max(0, Math.min(y, maxH));
    _scrollObj.v = window.scrollY || window.pageYOffset || 0;
    gsap.killTweensOf(_scrollObj);
    gsap.to(_scrollObj, {
        v: y,
        duration: 0.75,
        ease: "power3.inOut",
        onUpdate: function () { window.scrollTo(0, _scrollObj.v); }
    });
}

// ====================================
// NAVBAR
// ====================================
gsap.from(".navbar", { y: -80, opacity: 0, duration: 0.8, ease: "power3.out", clearProps: "transform" });

// ====================================
// HERO
// ====================================
gsap.from(".badge", { y: 20, opacity: 0, duration: 0.6, delay: 0.3 });
gsap.from(".hero-title", { y: 40, opacity: 0, duration: 0.8, delay: 0.5 });
gsap.from(".hero-subtitle", { y: 30, opacity: 0, duration: 0.8, delay: 0.7 });
gsap.from(".stat-item", { y: 30, opacity: 0, duration: 0.6, stagger: 0.15, delay: 0.9 });
gsap.from(".hero-buttons", { y: 20, opacity: 0, duration: 0.6, delay: 1.2 });

// ====================================
// SMOOTH SCROLL — kliknięcia w linki kotwiczne
// ====================================
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        var href = this.getAttribute('href');
        if (href === "#") { e.preventDefault(); smoothGoTo(0); return; }
        const targetEl = document.querySelector(href);
        if (targetEl) {
            e.preventDefault();
            var rectTop = targetEl.getBoundingClientRect().top + (window.scrollY || window.pageYOffset || 0);
            smoothGoTo(rectTop - 80);
        }
    });
});

// ====================================
// SCROLL REVEAL — PROSTY I NIEZAWODNY
// Każdy element dostaje swój WŁASNY ScrollTrigger.
// gsap.from() ustawia stan startowy i animuje DO naturalnego stanu.
// ScrollTrigger odpali animację natychmiast jeśli element
// jest już widoczny przy ładowaniu strony.
// ====================================
function reveal(selector, fromProps) {
    gsap.utils.toArray(selector).forEach(function(el) {
        gsap.from(el, Object.assign({}, fromProps, {
            opacity: 0,
            duration: 0.7,
            ease: "power3.out",
            scrollTrigger: {
                trigger: el,
                start: "top 93%",
                // domyślne toggleActions = "play none none none"
                // = odpala raz, nigdy nie chowa
            }
        }));
    });
}

// Nagłówki sekcji
reveal('.section-header', { y: 35 });

// Karty cennikowe (pakiety, serwis, dodatkowe)
reveal('.pricing-card', { y: 50 });

// NAPRAWA I UPGRADE — każdy wiersz osobno
reveal('.service-row-detailed', { y: 40 });

// Warning banner
reveal('.warning-banner', { y: 20 });

// Why Me
reveal('.why-me-list li', { x: -30 });
reveal('.glow-box', { scale: 0.9 });

// Proces (kroki 1-4)
reveal('.process-step', { y: 35 });

// Kontakt — wszystkie 4 karty
reveal('.contact-card', { y: 30 });

// Mapa
reveal('.map-container', { y: 30 });

// Gwarancja
reveal('.guarantee-banner', { y: 20 });

// Opinie
reveal('.review-card', { y: 40 });

// ====================================
// CHART ANIMATION
// ====================================
gsap.set(".line-red, .line-cyan", { strokeDasharray: 2000, strokeDashoffset: 2000 });
gsap.set(".area-red, .area-cyan", { opacity: 0 });
gsap.set(".point-anim", { opacity: 0, scale: 0 });
gsap.set(".chart-tooltip", { opacity: 0, scale: 0 });

var chartTl = gsap.timeline({
    scrollTrigger: {
        trigger: ".chart-container",
        start: "top 92%"
    }
});

chartTl
  .to(".line-red", { strokeDashoffset: 0, duration: 0.8, ease: "power1.out" })
  .to(".area-red", { opacity: 1, duration: 0.3 }, "-=0.4")
  .to(".point-red", { opacity: 1, scale: 1, duration: 0.3, stagger: 0.12, ease: "back.out(2)" }, "-=0.2")
  .to(".tt-red", { opacity: 1, scale: 1, duration: 0.3, stagger: 0.12, ease: "back.out(1.5)" }, "-=0.2")
  .to(".point-white", { opacity: 1, scale: 1, duration: 0.4, ease: "elastic.out(1, 0.5)" }, "-=0.1")
  .to(".line-cyan", { strokeDashoffset: 0, duration: 0.8, ease: "power2.out" }, "-=0.5")
  .to(".area-cyan", { opacity: 1, duration: 0.3 }, "-=0.4")
  .to(".point-cyan", { opacity: 1, scale: 1, duration: 0.3, stagger: 0.12, ease: "back.out(2)" }, "-=0.2")
  .to(".tt-cyan", { opacity: 1, scale: 1, duration: 0.3, stagger: 0.12, ease: "back.out(1.5)" }, "-=0.2");


// ====================================
// REFRESH — przelicz pozycje triggerów po pełnym załadowaniu
// (obrazki, czcionki, smooth scroll zmieniają wysokość strony)
// ====================================
window.addEventListener("load", function () { ScrollTrigger.refresh(); });
if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(function () { ScrollTrigger.refresh(); });
}
var _rt;
window.addEventListener("resize", function () {
    clearTimeout(_rt);
    _rt = setTimeout(function () { ScrollTrigger.refresh(); }, 200);
});

// ====================================
// SCROLLSPY — Niezawodny system podświetlania (Natywny)
// ====================================
(function () {
    var links = Array.prototype.slice.call(document.querySelectorAll('.nav-links a[href^="#"]'));
    var items = links
        .map(function (link) {
            var id = link.getAttribute("href");
            var section = (id && id.length > 1) ? document.querySelector(id) : null;
            return section ? { link: link, section: section } : null;
        })
        .filter(Boolean);

    if (!items.length) return;

    function setActive(activeLink) {
        items.forEach(function (it) {
            it.link.classList.toggle("active", it.link === activeLink);
        });
    }
    
    var logoLink = document.querySelector('.navbar .logo');
    if (logoLink) {
        logoLink.addEventListener('click', function () {
            setActive(null);
        });
    }

    var visible = new Set();

    var observer = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
            if (entry.isIntersecting) {
                visible.add(entry.target);
            } else {
                visible.delete(entry.target);
            }
        });
        var activeItem = null;
        for (var i = 0; i < items.length; i++) {
            if (visible.has(items[i].section)) { activeItem = items[i]; break; }
        }
        setActive(activeItem ? activeItem.link : null);
    }, {
        root: null,
        rootMargin: "-40% 0px -40% 0px"
    });

    items.forEach(function (it) {
        observer.observe(it.section);
    });
})();

// ====================================
// SKRYPT MENU MOBILNEGO
// ====================================
(function () {
    var btn = document.getElementById('hamburger');
    var nav = document.getElementById('nav-links');
    var overlay = document.getElementById('nav-overlay');
    if (!btn || !nav) return;

    function closeMenu() {
        nav.classList.remove('open');
        btn.classList.remove('open');
        btn.setAttribute('aria-expanded', 'false');
        document.body.classList.remove('no-scroll');
        document.body.style.overflow = '';
        if (overlay) overlay.classList.remove('visible');
    }

    btn.addEventListener('click', function (e) {
        e.preventDefault();
        var open = nav.classList.toggle('open');
        btn.classList.toggle('open', open);
        btn.setAttribute('aria-expanded', String(open));

        if (open) {
            document.body.classList.add('no-scroll');
            document.body.style.overflow = 'hidden';
            if (overlay) overlay.classList.add('visible');
        } else {
            closeMenu();
        }
    });

    // Zamykanie przez kliknięcie w overlay (tło za panelem)
    if (overlay) {
        overlay.addEventListener('click', closeMenu);
    }

    // Zamykanie po kliknięciu w link
    nav.querySelectorAll('a').forEach(function (link) {
        link.addEventListener('click', closeMenu);
    });

    // Zamykanie klawiszem Escape
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') closeMenu();
    });
})();

// ====================================
// KOPIOWANIE EMAILA DO SCHOWKA
// ====================================
(function () {
    var card = document.getElementById('copy-email');
    if (!card) return;
    var email = 'kontakt.maxxtune@gmail.com';
    var label = card.querySelector('.cc-label');
    var timer;

    function doCopy() {
        navigator.clipboard.writeText(email).then(function () {
            if (label) {
                label.textContent = '✓ SKOPIOWANO!';
                label.classList.add('copied');
            }
            clearTimeout(timer);
            timer = setTimeout(function () {
                if (label) {
                    label.textContent = 'EMAIL';
                    label.classList.remove('copied');
                }
            }, 2000);
        }).catch(function () {
            window.location.href = 'mailto:' + email;
        });
    }

    card.addEventListener('click', doCopy);
    card.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); doCopy(); }
    });
})()

// =============================
// SLIDER OPINII — wklej do script.js
// =============================

document.addEventListener('DOMContentLoaded', function () {
  requestAnimationFrame(function () {
    requestAnimationFrame(function () {
      initExpandButtons();
      initSlider();
    });
  });

  // --- "Pokaż więcej / mniej" ---
  function initExpandButtons() {
    document.querySelectorAll('.review-text').forEach(function (p) {
      // Zdejmij clamp, zmierz pełną wysokość
      p.style.cssText += ';-webkit-line-clamp:unset!important;max-height:none!important;overflow:visible!important';
      var fullHeight = p.scrollHeight;
      // Przywróć
      p.style.cssText = p.style.cssText
        .replace(/;?-webkit-line-clamp:[^;]+/g, '')
        .replace(/;?max-height:[^;]+/g, '')
        .replace(/;?overflow:[^;]+/g, '');
      var clampedHeight = p.clientHeight;

      if (fullHeight > clampedHeight + 5) {
        var btn = document.createElement('button');
        btn.className = 'review-expand-btn';
        btn.textContent = 'Pokaż więcej';
        p.after(btn);
        btn.addEventListener('click', function () {
          var expanded = p.classList.toggle('review-text--expanded');
          btn.textContent = expanded ? 'Pokaż mniej' : 'Pokaż więcej';
        });
      }
    });
  }

  // --- Slider ---
  function initSlider() {
    var slider  = document.getElementById('reviewsSlider');
    var btnLeft = document.getElementById('arrowLeft');
    var btnRight= document.getElementById('arrowRight');
    if (!slider || !btnLeft || !btnRight) return;

    // Owij karty w track
    var track = document.createElement('div');
    track.className = 'reviews-track';
    while (slider.firstChild) track.appendChild(slider.firstChild);
    slider.appendChild(track);

    var cards   = Array.from(track.querySelectorAll('.review-card'));
    var total   = cards.length;
    var current = 0;

    function cardWidth() {
      return cards[0].getBoundingClientRect().width + 24;
    }
    function visible() {
      return Math.max(1, Math.floor(slider.offsetWidth / cardWidth()));
    }
    function maxIdx() {
      return Math.max(0, total - visible());
    }
    function goTo(n) {
      current = Math.max(0, Math.min(n, maxIdx()));
      track.style.transform = 'translateX(-' + (current * cardWidth()) + 'px)';
      btnLeft.disabled  = current <= 0;
      btnRight.disabled = current >= maxIdx();
    }

    btnLeft.addEventListener ('click', function () { goTo(current - 1); });
    btnRight.addEventListener('click', function () { goTo(current + 1); });

    // Swipe
    var tx = 0;
    slider.addEventListener('touchstart', function (e) { tx = e.touches[0].clientX; }, { passive: true });
    slider.addEventListener('touchend',   function (e) {
      var d = tx - e.changedTouches[0].clientX;
      if (Math.abs(d) > 50) goTo(current + (d > 0 ? 1 : -1));
    }, { passive: true });

    window.addEventListener('resize', function () { goTo(current); });
    goTo(0);
  }
});
