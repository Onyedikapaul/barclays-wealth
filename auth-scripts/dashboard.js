function setTextByClass(className, value) {
  document.querySelectorAll(`.${className}`).forEach((el) => {
    el.textContent = value ?? "";
  });
}

function setTextById(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value ?? "";
}

function setAvatar({ firstname, lastname, avatarUrl }) {
  const full = `${firstname || ""} ${lastname || ""}`.trim();

  const initials = full
    ? full
        .split(" ")
        .slice(0, 2)
        .map((w) => w[0]?.toUpperCase())
        .join("")
    : "U";

  document.querySelectorAll(".user-avatar").forEach((root) => {
    const img = root.querySelector(".user-avatar-img");
    const fallback = root.querySelector(".user-avatar-fallback");
    const initialsEl = root.querySelector(".user-avatar-initials");

    if (initialsEl) initialsEl.textContent = initials;

    if (avatarUrl) {
      if (img) {
        img.src = avatarUrl;
        img.classList.remove("hidden");
      }
      if (fallback) fallback.classList.add("hidden");
    } else {
      if (img) img.classList.add("hidden");
      if (fallback) fallback.classList.remove("hidden");
    }
  });
}

function setPassportImage(url) {
  document.querySelectorAll(".user-passport").forEach((img) => {
    if (url) {
      img.src = url;
    }
  });
}

async function hydrateUserUI() {
  try {
    const res = await fetch("/api/dashboard", { credentials: "include" });

    // if not logged in → go login
    if (res.status === 401) {
      window.location.href = "/en/account/myaccount/uzauth/login.html";
      return;
    }

    if (!res.ok) return;

    const data = await res.json();

    if (!data?.ok || !data?.user) return;

    const u = data.user;

    const fullName =
      `${u.firstname || ""} ${u.middlename || ""} ${u.lastname || ""}`
        .replace(/\s+/g, " ")
        .trim();

    // ✅ Put text into class targets (create these classes in HTML where you want values)
    setTextByClass("user-fullname", fullName || "User");
    setTextByClass("user-firstname", u.firstname || "");
    setTextByClass("user-lastname", u.lastname || "");
    setTextByClass("user-email", u.email || "");
    setTextByClass("user-phone", u.phone || "");
    setTextByClass("user-country", u.country || "");
    setTextByClass("user-state", u.state || "");
    setTextByClass("user-city", u.city || "");
    setTextByClass("user-zipcode", u.zipcode || "");
    setTextByClass("user-occupation", u.occupation || "");
    setTextByClass("user-income", u.income || "");
    setTextByClass("user-accounttype", u.accounttype || "");
    setTextByClass("user-currency", u.usercurrency || "USD");
    setTextByClass(
      "user-fullname-in-short",
      u.firstname[0].concat(u.lastname ? u.lastname[0] : "").toUpperCase(),
    );
    setTextByClass("user-cardCount", u.cardCount);

    setPassportImage(u.passportUrl);

    // ✅ New fields you added
    setTextByClass("user-account-number", u.accountNumber || "");
    setTextById("accountNumber", u.accountNumber || "");
    setTextByClass(
      "user-account-balance",
      Number(u.accountBalance || 0).toFixed(2),
    );

    setTextByClass("user-passport", u.passportUrl);
    

    // welcome line
    setTextByClass("welcome-user-message", `Good day ${fullName || "User"}`);

    // ✅ avatar (passportUrl)
    setAvatar({
      firstname: u.firstname,
      lastname: u.lastname,
      avatarUrl: u.passportUrl,
    });

    // ✅ Optional: disable transfer if not allowed
    if (u.isAllowedToTransfer === false) {
      document.querySelectorAll('[data-action="transfer"]').forEach((btn) => {
        btn.classList.add("disabled");
        btn.setAttribute("aria-disabled", "true");
        btn.addEventListener("click", (e) => {
          e.preventDefault();
          if (window.toastr)
            toastr.error("Transfers are currently disabled for this account.");
        });
      });
    }
  } catch (e) {
    console.error("hydrateUserUI:", e);
  }
}

window.hydrateUserUI = hydrateUserUI;

// call automatically on load (same vibe as your old project)
document.addEventListener("DOMContentLoaded", hydrateUserUI);

// ✅ keep your logout global
async function logout() {
  try {
    await fetch("/api/logout", { method: "POST", credentials: "include" });
  } catch (e) {
    console.error("logout:", e);
  } finally {
    window.location.href = "/en/account/myaccount/uzauth/login.html";
  }
}
window.logout = logout;

// bind logout buttons if they exist
document.addEventListener("click", (e) => {
  const btn = e.target.closest("#logoutBtn,[data-action='logout']");
  if (!btn) return;
  e.preventDefault();
  logout();
});
