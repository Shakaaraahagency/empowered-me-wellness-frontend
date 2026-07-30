const DASHBOARD_LINKS = [
  { href: "dashboard.html", label: "Overview" },
  { href: "my-bookings.html", label: "My Bookings" },
  { href: "my-orders.html", label: "My Orders" },
  { href: "profile.html", label: "Profile" },
  { href: "account-settings.html", label: "Account Settings" },
];

function renderDashboardNav() {
  const el = document.getElementById("dashboard-nav");
  if (!el) return;

  const page = window.location.pathname.split("/").pop();
  const links = DASHBOARD_LINKS.map(
    (l) => `<a href="${l.href}" class="${l.href === page ? "active" : ""}">${l.label}</a>`
  ).join("");

  el.innerHTML = `<nav class="dashboard-nav">${links}</nav>`;
}

document.addEventListener("DOMContentLoaded", renderDashboardNav);
