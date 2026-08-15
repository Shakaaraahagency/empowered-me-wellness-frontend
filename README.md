# Empowered Me Wellness - Frontend

This is the frontend application for Empowered Me Wellness. It is built using pure HTML, CSS, and Vanilla JavaScript, ensuring a lightweight, fast, and responsive user experience.

## Tech Stack
- **HTML5:** Semantic and accessible markup.
- **CSS3:** Custom design system using CSS variables (`tokens.css`). No heavy frameworks like Tailwind or Bootstrap are used, allowing for precise styling control.
- **Vanilla JavaScript:** Handles dynamic content, API interactions, and state management.

## Features
- **E-Commerce Storefront:** Browse products, view details, and checkout securely.
- **Booking System:** View class schedules and book sessions dynamically.
- **User Dashboard:** Users can view their bookings, manage their profile, and track past orders.
- **Admin Portal:** A comprehensive dashboard for administrators to manage sessions, products, orders, testimonials, and blog posts.
- **Blog & Content:** Dedicated pages for reading articles, viewing testimonials, and more.

## Setup & Development

Since this is a vanilla frontend application, no build tools (like Webpack or Vite) or package managers (like npm) are required.

1. **Serve the files:**
   Simply serve the directory using any static file server. For example, you can use the Live Server extension in VS Code, or Python's built-in HTTP server:
   ```bash
   # From the frontend directory
   python -m http.server 8000
   ```

2. **API Configuration:**
   The frontend communicates with the Flask backend API. The API URL is configured in `js/api.js`. It auto-detects if you are running locally or in production:
   - **Local:** Requests are routed to `http://127.0.0.1:5000/api/v1`
   - **Production:** Requests are routed to your deployed backend URL.
   
   If you change your backend deployment URL, update the `API_URL` in `js/api.js` accordingly.

3. **Open the App:**
   Navigate to `http://localhost:8000/index.html` in your web browser.

## Project Structure
- `/*.html`: Page templates (e.g., `index.html`, `shop.html`, `admin-overview.html`).
- `/css/`: Stylesheets, including the core `tokens.css` design system.
- `/js/`: JavaScript modules. The `api.js` file handles all backend communication.
- `/assets/`: Brand imagery, logos, and media files.
