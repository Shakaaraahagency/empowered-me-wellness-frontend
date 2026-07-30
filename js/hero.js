/**
 * hero.js — IntersectionObserver-driven entrance animations for .hero-mnml.
 * Vanilla JS only. No external libraries. No console.log in production.
 * Also handles: sticky nav scroll behaviour, hamburger toggle.
 */

(function () {
  "use strict";

  /* -----------------------------------------------------------------------
     Sticky nav — scroll behaviour
  ----------------------------------------------------------------------- */
  function initStickyNav() {
    const nav = document.querySelector(".hero-nav-sticky");
    if (!nav) return;

    function onScroll() {
      if (window.scrollY > 20) {
        nav.classList.add("scrolled");
      } else {
        nav.classList.remove("scrolled");
      }
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll(); // run once on load
  }

  /* -----------------------------------------------------------------------
     Hamburger toggle
  ----------------------------------------------------------------------- */
  /* -----------------------------------------------------------------------
     Entrance animations via IntersectionObserver
  ----------------------------------------------------------------------- */
  function initHeroObserver() {
    const hero = document.querySelector(".hero-mnml");
    if (!hero) return;

    // Respect prefers-reduced-motion — just show everything instantly
    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (prefersReduced) {
      hero.classList.add("is-visible");
      return;
    }

    const observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target); // fire once
          }
        });
      },
      { threshold: 0.08 }
    );

    observer.observe(hero);
  }

  /* -----------------------------------------------------------------------
     Active nav link highlighting based on current page
  ----------------------------------------------------------------------- */
  function highlightActiveNavLink() {
    const page = window.location.pathname.split("/").pop() || "index.html";
    document.querySelectorAll(".hero-nav-sticky a, .hn-mobile-menu a").forEach(function (link) {
      const href = link.getAttribute("href");
      if (href && (href === page || (page === "" && href === "index.html"))) {
        link.classList.add("active");
      }
    });
  }

  /* -----------------------------------------------------------------------
     Boot
  ----------------------------------------------------------------------- */
  function init() {
    initStickyNav();
    initHeroObserver();
    highlightActiveNavLink();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
