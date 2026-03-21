(function () {
  function ensureToastStyles() {
    if (document.getElementById("toast-styles")) return;

    const style = document.createElement("style");
    style.id = "toast-styles";
    style.textContent = `
      .toast {
        position: fixed;
        top: 30px;
        right: 30px;
        background: #222;
        color: #fff;
        padding: 12px 18px;
        border-radius: 6px;
        opacity: 0;
        transform: translateY(20px);
        transition: all 0.3s ease;
        z-index: 10000;
        font-size: 14px;
      }
      .toast.show { opacity: 1; transform: translateY(0); }
      .toast.success { background: #28a745; }
      .toast.error { background: #e74c3c; }
    `;
    document.head.appendChild(style);
  }

  function showToast(message, type = "success") {
    ensureToastStyles();

    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    toast.textContent = message;

    document.body.appendChild(toast);

    setTimeout(() => toast.classList.add("show"), 50);

    setTimeout(() => {
      toast.classList.remove("show");
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  // Attach behavior to any newsletter form on the page (inline OR component)
  function bindNewsletterForm() {
    // Support multiple possibilities:
    // 1) <form id="newsletterForm">...
    // 2) any form that contains #nlemail
    // 3) any form with an input[name="nl-email"]
    const form =
      document.getElementById("newsletterForm") ||
      document.getElementById("nlemail")?.closest("form") ||
      document.querySelector('form input[name="nl-email"]')?.closest("form");

    if (!form) return;

    // prevent double-binding
    if (form.dataset.bound === "true") return;
    form.dataset.bound = "true";

    form.addEventListener("submit", (e) => {
      e.preventDefault();

      const emailInput =
        document.getElementById("nlemail") ||
        form.querySelector('input[type="email"]') ||
        form.querySelector('input[name="nl-email"]');

      const email = (emailInput?.value || "").trim();

      if (!email) {
        showToast("Please enter your email", "error");
        return;
      }

      // UI ONLY (no backend yet)
      showToast("✅ Email subscribed successfully", "success");
      emailInput.value = "";
    });
  }

  // Run on page load
  document.addEventListener("DOMContentLoaded", bindNewsletterForm);

  // Also run again after other scripts/plugins load (safe for pages with animations)
  window.addEventListener("load", bindNewsletterForm);

  // Expose for manual re-init if you inject HTML later
  window.initNewsletter = bindNewsletterForm;
})();
