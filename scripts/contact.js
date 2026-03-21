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

  function bindContactForm() {
    const form = document.getElementById("contactForm");
    if (!form || form.dataset.bound === "true") return;

    form.dataset.bound = "true";

    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      const name = document.getElementById("name")?.value.trim();
      const email = document.getElementById("email")?.value.trim();
      const subject = document.getElementById("subject")?.value.trim();
      const message = document.getElementById("message")?.value.trim();

      if (!name || !email || !subject || !message) {
        showToast("Please fill all fields", "error");
        return;
      }

      // ✅ disable submit while sending
      const btn =
        form.querySelector("button[type='submit']") ||
        form.querySelector("input[type='submit']");
      const oldText = btn?.textContent;
      if (btn) {
        btn.disabled = true;
        if (oldText) btn.textContent = "Sending...";
      }

      try {
        const res = await fetch("/api/contact", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, subject, message }),
        });

        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.message || "Failed to send message");

        showToast("✅ Message sent successfully", "success");
        form.reset();
      } catch (err) {
        showToast(err.message || "Something went wrong", "error");
      } finally {
        if (btn) {
          btn.disabled = false;
          if (oldText) btn.textContent = oldText;
        }
      }
    });
  }

  document.addEventListener("DOMContentLoaded", bindContactForm);
  window.addEventListener("load", bindContactForm);

  // expose for dynamic pages if needed
  window.initContactForm = bindContactForm;
})();
