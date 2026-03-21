(function () {
  function $(id) {
    return document.getElementById(id);
  }

  function disableBtn(state) {
    const btn = $("btn");
    if (btn) btn.disabled = state;
  }

  // ✅ PASSWORD TOGGLE
  function initPasswordToggle() {
    const toggleBtn = document.querySelector(".passcode-switch");
    const passwordInput = document.getElementById("password");

    if (toggleBtn && passwordInput) {
      toggleBtn.addEventListener("click", function (e) {
        e.preventDefault();
        if (passwordInput.type === "password") {
          passwordInput.type = "text";
          toggleBtn.classList.add("is-shown");
        } else {
          passwordInput.type = "password";
          toggleBtn.classList.remove("is-shown");
        }
      });
    }
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
    const container = document.getElementById("turnstile-login");
    if (!container || container.dataset.rendered === "true") return;
    container.dataset.rendered = "true";

    window.turnstile.render(container, {
      sitekey: window.TURNSTILE_SITE_KEY || "YOUR_SITE_KEY_HERE",
      theme: "light",
    });
  }

  async function handleLogin(e) {
    e.preventDefault();

    // ── Get Turnstile token ──
    const turnstileToken = document.querySelector(
      "#turnstile-login [name='cf-turnstile-response']"
    )?.value || "";

    if (!turnstileToken) {
      toastr.error("Please complete the captcha");
      return;
    }

    disableBtn(true);

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          email: $("email").value.trim().toLowerCase(),
          password: $("password").value,
          "cf-turnstile-response": turnstileToken,
        }),
      });

      const data = await res.json();

      disableBtn(false);

      if (!res.ok || !data.ok) {
        // Reset captcha on failure so user can retry
        if (window.turnstile) window.turnstile.reset("#turnstile-login");

        if (data.needsVerification && data.redirectTo) {
          toastr.error(data.message || "Email not verified");
          setTimeout(() => {
            window.location.href = data.redirectTo;
          }, 1500);
          return;
        }

        toastr.error(data.message || "Login failed");
        return;
      }

      if (data.token) {
        localStorage.setItem("token", data.token);
      }

      toastr.success("Login successful, redirecting...");

      setTimeout(() => {
        window.location.href =
          data.redirectTo || "/en/account/myaccount/onlineacces";
      }, 1000);

    } catch (err) {
      disableBtn(false);
      console.error(err);
      if (window.turnstile) window.turnstile.reset("#turnstile-login");
      toastr.error("Network / server error");
    }
  }

  function init() {
    const form = document.getElementById("loginForm");
    if (!form || form.dataset.bound === "true") return;
    form.dataset.bound = "true";

    // ── Insert Turnstile container before submit button if not in HTML ──
    if (!document.getElementById("turnstile-login")) {
      const btn = $("btn");
      const wrapper = document.createElement("div");
      wrapper.id = "turnstile-login";
      wrapper.style.marginBottom = "12px";
      if (btn) btn.parentNode.insertBefore(wrapper, btn);
      else form.appendChild(wrapper);
    }

    loadTurnstile(renderTurnstile);

    form.addEventListener("submit", handleLogin);
    initPasswordToggle();
  }

  document.addEventListener("DOMContentLoaded", init);
  window.addEventListener("load", init);
})();