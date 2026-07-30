/**
 * analytics.js — loads Google Analytics ONLY if GA_MEASUREMENT_ID below is
 * set to a real ID. Left blank, this file does nothing at all — the site
 * never silently tracks visitors. Update the Cookie Notice page if you
 * turn this on, since it adds a non-essential cookie category.
 */
const GA_MEASUREMENT_ID = ""; // e.g. "G-XXXXXXXXXX" — set this to go live

if (GA_MEASUREMENT_ID) {
  const script1 = document.createElement("script");
  script1.async = true;
  script1.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
  document.head.appendChild(script1);

  window.dataLayer = window.dataLayer || [];
  function gtag() {
    dataLayer.push(arguments);
  }
  gtag("js", new Date());
  gtag("config", GA_MEASUREMENT_ID, { anonymize_ip: true });
}
