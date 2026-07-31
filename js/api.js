/**
 * api.js — the ONLY file in this project that knows the backend's URL
 * or calls fetch() directly. Every other module goes through api().
 *
 * Change API_URL once here when moving between local dev and production —
 * nothing else in the codebase should ever hardcode a backend URL.
 */

/**
 * Escapes HTML special characters. MUST be used any time a string that
 * could contain public, unauthenticated input (contact form submissions,
 * guest booking names/emails, guest checkout emails, etc.) is interpolated
 * into an innerHTML template literal. Admin-authored content (session
 * titles, product names, blog posts) is lower-risk since only an admin
 * could inject into their own panel, but this is applied broadly as
 * defense-in-depth rather than trying to track "trusted vs untrusted"
 * per field.
 */
function escapeHtml(str) {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// Auto-detects dev vs production. Never hardcode a backend URL in two places.
const _IS_LOCAL = ["localhost", "127.0.0.1"].includes(window.location.hostname);
const API_URL = _IS_LOCAL
  ? "http://127.0.0.1:5000/api/v1"
  : "https://empowered-me-wellness-backend.onrender.com/api/v1"; // ← your Render URL

// Some API responses (e.g. download links) return a path rooted at the
// backend's domain, not relative to the frontend. Use this to build a
// correct absolute URL rather than letting the browser resolve it against
// the frontend's own origin (a real bug once they're on different domains).
const API_ORIGIN = API_URL.replace(/\/api\/v1$/, "");
function absoluteApiUrl(path) {
  return `${API_ORIGIN}${path}`;
}

function getCsrfTokenFromCookie(cookieName) {
  const match = document.cookie.match(new RegExp("(^| )" + cookieName + "=([^;]+)"));
  return match ? match[2] : null;
}

/**
 * Wrapper around fetch() that:
 *  - always sends/receives httpOnly auth cookies (credentials: 'include')
 *  - attaches the CSRF header Flask-JWT-Extended expects on state-changing
 *    requests (required because our auth cookies are httpOnly + CSRF-protected)
 *  - always returns parsed JSON, and throws a normalized error object on
 *    non-2xx responses so callers can show `err.message` directly to the user
 */
async function api(path, { method = "GET", body = null } = {}) {
  const headers = { "Content-Type": "application/json" };

  if (["POST", "PUT", "PATCH", "DELETE"].includes(method)) {
    const csrf = getCsrfTokenFromCookie("csrf_access_token");
    if (csrf) headers["X-CSRF-TOKEN"] = csrf;
  }

  const response = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    credentials: "include", // send/receive httpOnly auth cookies
    body: body ? JSON.stringify(body) : null,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = data?.error?.message || "Something went wrong. Please try again.";
    const code = data?.error?.code || "unknown_error";
    throw { message, code, status: response.status };
  }

  return data;
}

const AuthAPI = {
  register: (email, password, full_name) =>
    api("/auth/register", { method: "POST", body: { email, password, full_name } }),

  login: (email, password) =>
    api("/auth/login", { method: "POST", body: { email, password } }),

  logout: () => api("/auth/logout", { method: "POST" }),

  me: () => api("/auth/me"),

  /**
   * Silently requests a new access token using the refresh cookie.
   * The refresh cookie is httpOnly and is sent automatically by the browser.
   * Returns true on success, false if the session has fully expired.
   */
  refresh: async () => {
    const headers = {};
    // The refresh endpoint needs its own CSRF token from the refresh cookie.
    const csrfRefresh = getCsrfTokenFromCookie("csrf_refresh_token");
    if (csrfRefresh) headers["X-CSRF-TOKEN"] = csrfRefresh;
    const response = await fetch(`${API_URL}/auth/refresh`, {
      method: "POST",
      headers,
      credentials: "include",
    });
    return response.ok;
  },

  updateMe: (payload) => api("/auth/me", { method: "PATCH", body: payload }),

  deleteMe: () => api("/auth/me", { method: "DELETE" }),

  forgotPassword: (email) => api("/auth/forgot-password", { method: "POST", body: { email } }),

  resetPassword: (token, password) =>
    api("/auth/reset-password", { method: "POST", body: { token, password } }),
};

/**
 * Redirects to login if there's no valid session. Call at the top of any
 * dashboard page. Returns the current user on success.
 */
async function requireAuth() {
  try {
    return await AuthAPI.me();
  } catch (err) {
    document.cookie = "csrf_access_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    window.location.href = "login.html";
    throw err;
  }
}

/**
 * Starts a background timer that silently refreshes the access token every
 * 15 minutes (access token expires after 20 minutes, so this gives a 5-minute
 * safety buffer). If the refresh fails it means the refresh token itself has
 * expired (after 7 days of inactivity) — the user is logged out cleanly.
 *
 * Call this once per page load, only when the user is logged in.
 */
function startTokenAutoRefresh() {
  const INTERVAL_MS = 15 * 60 * 1000; // 15 minutes

  const doRefresh = async () => {
    const ok = await AuthAPI.refresh();
    if (!ok) {
      // Refresh token has expired — full session over, send to login.
      document.cookie = "csrf_access_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      document.cookie = "csrf_refresh_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      window.location.href = "login.html";
    }
  };

  // Schedule repeating refresh
  const timerId = setInterval(doRefresh, INTERVAL_MS);
  return timerId; // caller can clearInterval(timerId) on logout
}

const TestimonialsAPI = {
  list: () => api("/testimonials"),
  submit: (payload) => api("/testimonials", { method: "POST", body: payload }),
};

const SessionsAPI = {
  list: () => api("/sessions"),
  get: (id) => api(`/sessions/${id}`),
};

const BookingsAPI = {
  create: (payload) => api("/bookings", { method: "POST", body: payload }),
  mine: () => api("/bookings/mine"),
  get: (id) => api(`/bookings/${id}`),
  cancel: (id) => api(`/bookings/${id}/cancel`, { method: "PATCH" }),
};

const ProductsAPI = {
  list: () => api("/products"),
  get: (id) => api(`/products/${id}`),
  listReviews: (id) => api(`/products/${id}/reviews`),
  submitReview: (id, payload) => api(`/products/${id}/reviews`, { method: "POST", body: payload }),
};

const OrdersAPI = {
  checkout: (payload) => api("/checkout", { method: "POST", body: payload }),
  mine: () => api("/orders/mine"),
  get: (id) => api(`/orders/${id}`),
  downloadLink: (orderId, productId) => api(`/orders/${orderId}/download/${productId}`),
  guestDownloadLink: (orderId, productId, email) =>
    api(`/orders/${orderId}/guest-download/${productId}?email=${encodeURIComponent(email)}`),
};

const AdminAPI = {
  stats: () => api("/admin/stats"),

  listClasses: () => api("/admin/classes"),
  createClass: (payload) => api("/admin/classes", { method: "POST", body: payload }),
  updateClass: (id, payload) => api(`/admin/classes/${id}`, { method: "PATCH", body: payload }),
  deleteClass: (id) => api(`/admin/classes/${id}`, { method: "DELETE" }),

  listSessions: () => api("/admin/sessions"),
  createSession: (payload) => api("/admin/sessions", { method: "POST", body: payload }),
  updateSession: (id, payload) => api(`/admin/sessions/${id}`, { method: "PATCH", body: payload }),
  cancelSession: (id) => api(`/admin/sessions/${id}/cancel`, { method: "PATCH" }),

  listBookings: (status) => api(`/admin/bookings${status ? `?status=${status}` : ""}`),
  markAttendance: (id, status) =>
    api(`/admin/bookings/${id}/attendance`, { method: "PATCH", body: { status } }),
  cancelBooking: (id) => api(`/admin/bookings/${id}/cancel`, { method: "PATCH" }),

  listProducts: () => api("/admin/products"),
  uploadProductFile: async (formData) => {
    const headers = {};
    const csrf = getCsrfTokenFromCookie("csrf_access_token");
    if (csrf) headers["X-CSRF-TOKEN"] = csrf;
    const response = await fetch(`${API_URL}/admin/products/upload`, {
      method: "POST",
      headers,
      credentials: "include",
      body: formData,
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw { message: data?.error?.message || "File upload failed.", code: data?.error?.code || "upload_failed" };
    }
    return data;
  },
  uploadProductCover: async (formData) => {
    const headers = {};
    const csrf = getCsrfTokenFromCookie("csrf_access_token");
    if (csrf) headers["X-CSRF-TOKEN"] = csrf;
    const response = await fetch(`${API_URL}/admin/products/upload-cover`, {
      method: "POST",
      headers,
      credentials: "include",
      body: formData,
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw { message: data?.error?.message || "Cover upload failed.", code: data?.error?.code || "upload_failed" };
    }
    return data;
  },
  createProduct: (payload) => api("/admin/products", { method: "POST", body: payload }),
  updateProduct: (id, payload) => api(`/admin/products/${id}`, { method: "PATCH", body: payload }),
  deleteProduct: (id) => api(`/admin/products/${id}`, { method: "DELETE" }),

  listOrders: (status) => api(`/admin/orders${status ? `?status=${status}` : ""}`),

  listTestimonials: () => api("/admin/testimonials"),
  createTestimonial: (payload) => api("/admin/testimonials", { method: "POST", body: payload }),
  updateTestimonial: (id, payload) => api(`/admin/testimonials/${id}`, { method: "PATCH", body: payload }),
  deleteTestimonial: (id) => api(`/admin/testimonials/${id}`, { method: "DELETE" }),

  listContactMessages: (status) => api(`/admin/contact-messages${status ? `?status=${status}` : ""}`),
  updateContactMessageStatus: (id, status) =>
    api(`/admin/contact-messages/${id}`, { method: "PATCH", body: { status } }),

  listPosts: () => api("/admin/blog"),
  createPost: (payload) => api("/admin/blog", { method: "POST", body: payload }),
  updatePost: (id, payload) => api(`/admin/blog/${id}`, { method: "PATCH", body: payload }),
  deletePost: (id) => api(`/admin/blog/${id}`, { method: "DELETE" }),

  listSubscribers: (status) => api(`/admin/subscribers${status ? `?status=${status}` : ""}`),

  listReviews: () => api("/admin/reviews"),
  updateReview: (id, payload) => api(`/admin/reviews/${id}`, { method: "PATCH", body: payload }),
  deleteReview: (id) => api(`/admin/reviews/${id}`, { method: "DELETE" }),
};

const BlogAPI = {
  list: () => api("/blog"),
  get: (slug) => api(`/blog/${slug}`),
};

const NewsletterAPI = {
  subscribe: (email) => api("/newsletter/subscribe", { method: "POST", body: { email } }),
  unsubscribe: (email) => api("/newsletter/unsubscribe", { method: "POST", body: { email } }),
};

/**
 * Redirects to login (or home, if logged in but not admin) unless the
 * current user is an admin. Call at the top of every admin page.
 */
async function requireAdmin() {
  let user;
  try {
    user = await AuthAPI.me();
  } catch (err) {
    document.cookie = "csrf_access_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    window.location.href = "login.html";
    throw err;
  }
  if (user.role !== "admin") {
    window.location.href = "index.html";
    throw new Error("not an admin");
  }
  return user;
}
