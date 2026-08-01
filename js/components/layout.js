/**
 * layout.js — injects the shared nav + footer into any page that has
 * <div id="site-header"></div> and <div id="site-footer"></div>.
 * One place to change the nav instead of editing six HTML files.
 */

const FROND_ICON = `
<svg viewBox="-90 -145 180 155" width="34" height="29" aria-hidden="true">
  <path d="M 0,0 Q -49.4,-32.5 -73.6,-81.7 Q -27.1,-52.5 0,0 Z" fill="#5C6B3E"/>
  <path d="M 0,0 Q -17,-72.8 0,-140 Q 17,-72.8 0,0 Z" fill="#C08A34"/>
  <path d="M 0,0 Q 27.1,-52.5 73.6,-81.7 Q 49.4,-32.5 0,0 Z" fill="#5C6B3E"/>
  <circle cx="0" cy="0" r="9" fill="#241C13"/>
</svg>`;

const NAV_LINKS = [
  { href: "index.html", label: "Home" },
  { href: "about.html", label: "About" },
  { href: "services.html", label: "Services" },
  { href: "schedule.html", label: "Schedule" },
  { href: "shop.html", label: "Shop" },
  { href: "testimonials.html", label: "Testimonials" },
  { href: "blog.html", label: "Blog" },
  { href: "contact.html", label: "Contact" },
];

function currentPage() {
  return window.location.pathname.split("/").pop() || "index.html";
}

async function renderHeader() {
  const el = document.getElementById("site-header");
  if (!el) return;

  const page = currentPage();

  // Default links for guests
  let linksArray = [...NAV_LINKS];
  let user = null;

  // Always verify auth state by calling /me — never rely solely on localStorage.
  // localStorage CSRF tokens are used for POST security only, not as auth gate.
  if (typeof AuthAPI !== 'undefined') {
    try {
      user = await AuthAPI.me();
      // Cache CSRF tokens if returned (fresh login scenario)
      if (user && user.csrf_access) localStorage.setItem('csrf_access', user.csrf_access);
      if (typeof startTokenAutoRefresh === 'function') startTokenAutoRefresh();
    } catch (err) {
      // Access token expired — try a silent refresh
      try {
        const refreshed = await AuthAPI.refresh();
        if (refreshed) {
          user = await AuthAPI.me();
          if (typeof startTokenAutoRefresh === 'function') startTokenAutoRefresh();
        } else {
          // Refresh token also expired — fully logged out
          localStorage.removeItem('csrf_access');
          localStorage.removeItem('csrf_refresh');
        }
      } catch (_) {
        localStorage.removeItem('csrf_access');
        localStorage.removeItem('csrf_refresh');
      }
    }
  }

  if (user) {
    // Remove Contact from primary desktop links to make space for user links
    linksArray = linksArray.filter(l => l.href !== "contact.html");
    
    if (user.role === "admin") {
      linksArray.push({ href: "admin-overview.html", label: "Admin Panel" });
    } else {
      linksArray.push({ href: "dashboard.html", label: "Dashboard" });
    }
  } else {
    // Add Login link for guests on desktop
    linksArray.push({ href: "login.html", label: "Log In" });
  }

  const links = linksArray.map(
    (l) => `<li><a href="${l.href}" class="${l.href === page ? "active" : ""}">${l.label}</a></li>`
  ).join("");

  const mobileLinks = linksArray.map(
    (l) => `<a href="${l.href}" class="${l.href === page ? "active" : ""}">${l.label}</a>`
  ).join("");

  // Determine CTA
  let ctaHtml = `
    <a href="schedule.html" class="hn-cta">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <rect x="3" y="4" width="18" height="18" rx="2"/>
        <line x1="16" y1="2" x2="16" y2="6"/>
        <line x1="8" y1="2" x2="8" y2="6"/>
        <line x1="3" y1="10" x2="21" y2="10"/>
      </svg>
      Book a Class
    </a>
  `;

  if (user) {
    const displayName = user.full_name || user.first_name || user.email.split("@")[0];
    const firstName = displayName.split(" ")[0];
    const initial = firstName.charAt(0).toUpperCase();

    ctaHtml = `
      <div class="hn-user-menu-wrap" id="hn-user-menu-wrap">
        <button class="hn-user-trigger" id="hn-user-trigger" aria-haspopup="true" aria-expanded="false" type="button" aria-label="User account menu">
          <span class="hn-avatar">${escapeHtml(initial)}</span>
          <span class="hn-user-name">${escapeHtml(firstName)}</span>
          <svg class="hn-chevron" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </button>
        <div class="hn-user-dropdown" id="hn-user-dropdown" role="menu">
          <div class="hn-dropdown-header">
            <div class="hn-dropdown-user-name">${escapeHtml(displayName)}</div>
            <div class="hn-dropdown-user-email">${escapeHtml(user.email)}</div>
            <span class="hn-role-badge ${user.role === 'admin' ? 'admin' : 'member'}">${user.role === 'admin' ? 'Admin' : 'Member'}</span>
          </div>
          <div class="hn-dropdown-divider"></div>
          <div class="hn-dropdown-links">
            <a href="dashboard.html" class="hn-dropdown-item" role="menuitem">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
              Dashboard
            </a>
            <a href="profile.html" class="hn-dropdown-item" role="menuitem">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              Personal Information
            </a>
            <a href="my-bookings.html" class="hn-dropdown-item" role="menuitem">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              My Bookings
            </a>
            <a href="my-orders.html" class="hn-dropdown-item" role="menuitem">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
              My Orders
            </a>
            <a href="account-settings.html" class="hn-dropdown-item" role="menuitem">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
              Account Settings
            </a>
            ${user.role === 'admin' ? `
            <a href="admin-overview.html" class="hn-dropdown-item" style="color:var(--clay);" role="menuitem">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              Admin Panel
            </a>` : ''}
          </div>
          <div class="hn-dropdown-divider"></div>
          <button id="hn-logout-btn" class="hn-dropdown-item logout-btn" type="button" role="menuitem">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            Log Out
          </button>
        </div>
      </div>
    `;
  }

  el.innerHTML = `
    <nav class="hero-nav-sticky" aria-label="Main navigation">
      <!-- Brand -->
      <a href="index.html" class="hn-brand" aria-label="Empowered Me Wellness — Home">
        <img src="assets/brand/logo-transparent.png" alt="Empowered Me Wellness Logo" style="height: 48px; width: auto; display: block; filter: drop-shadow(0 1px 2px rgba(0,0,0,0.05));" />
      </a>

      <!-- Desktop nav links -->
      <ul class="hn-links" role="list">
        ${links}
      </ul>

      <!-- Desktop CTA / User Block -->
      <div class="hn-cta-container">
        ${ctaHtml}
      </div>

      <!-- Hamburger (mobile) -->
      <button
        class="hn-hamburger"
        aria-label="Open navigation menu"
        aria-expanded="false"
      >
        <span></span>
        <span></span>
        <span></span>
      </button>

      <!-- Mobile dropdown -->
      <div class="hn-mobile-menu" role="navigation" aria-label="Mobile navigation">
        ${mobileLinks}
        ${user 
          ? `<a href="profile.html" style="display:block;padding:10px 0;border-bottom:1px solid var(--sand);color:var(--ink);">Personal Information</a>
             <button id="hn-mobile-logout-btn" style="width: 100%; text-align: left; background: none; border: none; padding: 12px 0; color: #c0392b; font-family: var(--font-body); font-size: 16px; font-weight: 600; cursor: pointer;">Log Out</button>`
          : `<a href="schedule.html" style="color: var(--clay); font-weight: 600;">Book a Class &rarr;</a>`
        }
      </div>
    </nav>
  `;

  // Attach dropdown & logout event listeners if logged in
  if (user) {
    const wrap = el.querySelector("#hn-user-menu-wrap");
    const trigger = el.querySelector("#hn-user-trigger");
    if (wrap && trigger) {
      trigger.addEventListener("click", (e) => {
        e.stopPropagation();
        const isOpen = wrap.classList.toggle("open");
        trigger.setAttribute("aria-expanded", String(isOpen));
      });

      document.addEventListener("click", (e) => {
        if (!wrap.contains(e.target)) {
          wrap.classList.remove("open");
          trigger.setAttribute("aria-expanded", "false");
        }
      });
    }

    const handleLogout = async () => {
      try {
        await AuthAPI.logout();
        localStorage.removeItem("csrf_access");
        localStorage.removeItem("csrf_refresh");
        window.location.href = "index.html";
      } catch (err) {
        window.location.href = "index.html";
      }
    };

    const logoutBtn = el.querySelector("#hn-logout-btn");
    const mobileLogoutBtn = el.querySelector("#hn-mobile-logout-btn");
    if (logoutBtn) logoutBtn.addEventListener("click", handleLogout);
    if (mobileLogoutBtn) mobileLogoutBtn.addEventListener("click", handleLogout);
  }

  el.addEventListener("click", (e) => {
    // 1. Hamburger button click
    const btn = e.target.closest(".hn-hamburger");
    if (btn) {
      const menu = el.querySelector(".hn-mobile-menu");
      if (menu) {
        const isOpen = menu.classList.toggle("open");
        btn.setAttribute("aria-expanded", String(isOpen));
      }
      return;
    }

    // 2. Mobile menu link click
    const link = e.target.closest(".hn-mobile-menu a");
    if (link) {
      const menu = el.querySelector(".hn-mobile-menu");
      if (menu) {
        menu.classList.remove("open");
        const hBtn = el.querySelector(".hn-hamburger");
        if (hBtn) hBtn.setAttribute("aria-expanded", "false");
      }
    }
  });

  const nav = el.querySelector(".hero-nav-sticky");
  if (nav) {
    const onScroll = () => {
      if (window.scrollY > 20) {
        nav.classList.add("scrolled");
      } else {
        nav.classList.remove("scrolled");
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }
}

function renderFooter() {
  const el = document.getElementById("site-footer");
  if (!el) return;

  el.innerHTML = `
    <footer class="site-footer">
      <div class="footer-cols">
        <div>
          <div class="brand-lockup">${FROND_ICON}<span class="brand-text">Empowered Me <em>wellness</em></span></div>
          <p class="mono">Hamilton, Bermuda</p>
        </div>
        <div>
          <h3>Explore</h3>
          <a href="services.html">Services</a>
          <a href="schedule.html">Schedule</a>
          <a href="shop.html">Shop</a>
          <a href="blog.html">Blog</a>
        </div>
        <div>
          <h3>Legal</h3>
          <a href="privacy-policy.html">Privacy Policy</a>
          <a href="terms.html">Terms &amp; Conditions</a>
          <a href="refund-policy.html">Refund Policy</a>
          <a href="cookie-notice.html">Cookie Notice</a>
          <a href="admin-login.html" style="margin-top:10px; opacity:0.6; font-size:12px;">Admin Portal</a>
        </div>
        <div>
          <h3>Contact</h3>
          <p class="mono">info@emw.yoga</p>
          <p class="mono">+441-595-4105</p>
        </div>
      </div>
      <div class="footer-bottom">
        <ul class="footer-social" aria-label="Social media links" role="list">
          <li>
            <a href="https://www.instagram.com/empoweredmewellness/" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
              <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" width="18" height="18" fill="currentColor">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
              </svg>
            </a>
          </li>
          <li>
            <a href="https://x.com/EmpoweredMeWell" target="_blank" rel="noopener noreferrer" aria-label="X (formerly Twitter)">
              <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" width="18" height="18" fill="currentColor">
                <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z"/>
              </svg>
            </a>
          </li>
          <li>
            <a href="https://www.youtube.com/@empoweredmewellness" target="_blank" rel="noopener noreferrer" aria-label="YouTube">
              <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" width="18" height="18" fill="currentColor">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
              </svg>
            </a>
          </li>
          <li>
            <!-- TODO: Replace with real Facebook page URL when available -->
            <a href="#" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
              <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" width="18" height="18" fill="currentColor">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
            </a>
          </li>
        </ul>
        <p class="mono">&copy; ${new Date().getFullYear()} Empowered Me Wellness</p>
      </div>
    </footer>
  `;
}

document.addEventListener("DOMContentLoaded", () => {
  renderHeader();
  renderFooter();
  loadAnalyticsIfConfigured();
});

function loadAnalyticsIfConfigured() {
  const script = document.createElement("script");
  script.src = "js/analytics.js";
  document.head.appendChild(script);
}

