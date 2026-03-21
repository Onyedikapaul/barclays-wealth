// (function () {
//   function ensureToastStyles() {
//     if (document.getElementById("toast-styles")) return;
//     const style = document.createElement("style");
//     style.id = "toast-styles";
//     style.textContent = `
//       .toast{position:fixed;bottom:30px;right:30px;background:#222;color:#fff;padding:12px 18px;border-radius:6px;opacity:0;transform:translateY(20px);transition:all .25s ease;z-index:10000;font-size:14px}
//       .toast.show{opacity:1;transform:translateY(0)}
//       .toast.success{background:#28a745}
//       .toast.error{background:#e74c3c}
//     `;
//     document.head.appendChild(style);
//   }

//   function toast(msg, type = "success") {
//     ensureToastStyles();
//     const el = document.createElement("div");
//     el.className = `toast ${type}`;
//     el.textContent = msg;
//     document.body.appendChild(el);
//     setTimeout(() => el.classList.add("show"), 30);
//     setTimeout(() => {
//       el.classList.remove("show");
//       setTimeout(() => el.remove(), 250);
//     }, 3000);
//   }

//   function bindRegister() {
//     const form = document.getElementById("registerForm");
//     if (!form || form.dataset.bound === "true") return;
//     form.dataset.bound = "true";

//     form.addEventListener("submit", async (e) => {
//       e.preventDefault();

//       const btn = document.getElementById("btn");
//       if (btn) btn.disabled = true;

//       try {
//         const fd = new FormData(form);

//         const res = await fetch("/api/register", {
//           method: "POST",
//           body: fd,
//         });

//         const data = await res.json().catch(() => ({}));

//         if (!res.ok || !data.ok) {
//           toast(data.message || "Registration failed", "error");
//           return;
//         }

//         toast("✅ Registration successful", "success");
//         form.reset();

//         // change this to your real login page path
//         setTimeout(() => {
//           // window.location.href = "/en/account/myaccount/uzauth/login.html";
//           window.location.href = `/en/account/myaccount/uzauth/verify-email.html?userId=${encodeURIComponent(data.userId)}`;
//         }, 1200);

//       } catch (err) {
//         toast(err.message || "Network error", "error");
//       } finally {
//         if (btn) btn.disabled = false;
//       }
//     });
//   }

//   document.addEventListener("DOMContentLoaded", bindRegister);
//   window.addEventListener("load", bindRegister);
// })();



(function () {
  function ensureToastStyles() {
    if (document.getElementById("toast-styles")) return;
    const style = document.createElement("style");
    style.id = "toast-styles";
    style.textContent = `
      .toast{position:fixed;bottom:30px;right:30px;background:#222;color:#fff;padding:12px 18px;border-radius:6px;opacity:0;transform:translateY(20px);transition:all .25s ease;z-index:10000;font-size:14px}
      .toast.show{opacity:1;transform:translateY(0)}
      .toast.success{background:#28a745}
      .toast.error{background:#e74c3c}
    `;
    document.head.appendChild(style);
  }

  function toast(msg, type = "success") {
    ensureToastStyles();
    const el = document.createElement("div");
    el.className = `toast ${type}`;
    el.textContent = msg;
    document.body.appendChild(el);
    setTimeout(() => el.classList.add("show"), 30);
    setTimeout(() => {
      el.classList.remove("show");
      setTimeout(() => el.remove(), 250);
    }, 3000);
  }

  // ── Inject Turnstile script if not already loaded ──
  function loadTurnstile(cb) {
    if (window.turnstile) return cb();
    const s = document.createElement("script");
    s.src = "https://challenges.cloudflare.com/turnstile/v0/api.js";
    s.defer = true;
    s.onload = cb;
    document.head.appendChild(s);
  }

  // ── Render Turnstile widget inside the form ──
  function renderTurnstile() {
    const container = document.getElementById("turnstile-register");
    if (!container || container.dataset.rendered === "true") return;
    container.dataset.rendered = "true";

    window.turnstile.render(container, {
      sitekey: window.TURNSTILE_SITE_KEY || "YOUR_SITE_KEY_HERE",
      theme: "light",
    });
  }

  function bindRegister() {
    const form = document.getElementById("registerForm");
    if (!form || form.dataset.bound === "true") return;
    form.dataset.bound = "true";

    // ── Insert Turnstile container before submit button if not in HTML ──
    if (!document.getElementById("turnstile-register")) {
      const btn = document.getElementById("btn");
      const wrapper = document.createElement("div");
      wrapper.id = "turnstile-register";
      wrapper.style.marginBottom = "12px";
      if (btn) btn.parentNode.insertBefore(wrapper, btn);
      else form.appendChild(wrapper);
    }

    loadTurnstile(renderTurnstile);

    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      // ── Get Turnstile token ──
      const turnstileToken = document.querySelector(
        "#turnstile-register [name='cf-turnstile-response']"
      )?.value || "";

      if (!turnstileToken) {
        toast("Please complete the captcha", "error");
        return;
      }

      const btn = document.getElementById("btn");
      if (btn) btn.disabled = true;

      try {
        const fd = new FormData(form);
        fd.set("cf-turnstile-response", turnstileToken);

        const res = await fetch("/api/register", {
          method: "POST",
          body: fd,
        });

        const data = await res.json().catch(() => ({}));

        if (!res.ok || !data.ok) {
          toast(data.message || "Registration failed", "error");
          // Reset Turnstile so user can try again
          if (window.turnstile) window.turnstile.reset("#turnstile-register");
          return;
        }

        toast("✅ Registration successful", "success");
        form.reset();

        setTimeout(() => {
          window.location.href = `/en/account/myaccount/uzauth/verify-email.html?userId=${encodeURIComponent(data.userId)}`;
        }, 1200);

      } catch (err) {
        toast(err.message || "Network error", "error");
        if (window.turnstile) window.turnstile.reset("#turnstile-register");
      } finally {
        if (btn) btn.disabled = false;
      }
    });
  }

  document.addEventListener("DOMContentLoaded", bindRegister);
  window.addEventListener("load", bindRegister);
})();