const ADMIN_LINKS = [
  { href: "admin-overview.html", label: "Overview" },
  { href: "admin-sessions.html", label: "Classes & Sessions" },
  { href: "admin-bookings.html", label: "Bookings" },
  { href: "admin-products.html", label: "Products" },
  { href: "admin-reviews.html", label: "Product Reviews" },
  { href: "admin-orders.html", label: "Orders" },
  { href: "admin-testimonials.html", label: "Testimonials" },
  { href: "admin-contact.html", label: "Contact Inbox" },
  { href: "admin-blog.html", label: "Blog" },
  { href: "admin-subscribers.html", label: "Subscribers" },
  { href: "admin-audit-log.html", label: "Activity Log" },
];

function renderAdminNav() {
  const el = document.getElementById("admin-nav");
  if (!el) return;

  const page = window.location.pathname.split("/").pop();
  const links = ADMIN_LINKS.map(
    (l) => `<a href="${l.href}" class="${l.href === page ? "active" : ""}">${l.label}</a>`
  ).join("");

  el.innerHTML = `<nav class="dashboard-nav">${links}</nav>`;
}

document.addEventListener("DOMContentLoaded", renderAdminNav);
