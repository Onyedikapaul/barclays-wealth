(async function () {
  async function loadHeader() {
    const mount = document.getElementById("headerMount");
    if (!mount) return;

    if (mount.dataset.loaded === "true") return;
    mount.dataset.loaded = "true";

    const res = await fetch("/auth-components/header.html", {
      cache: "no-store",
    });

    if (!res.ok) throw new Error("Failed to load header");

    mount.innerHTML = await res.text();
    bindHeaderFixes();
  }

  function bindHeaderFixes() {
    // Prevent dropdown clicks from closing sidebar
    document.querySelectorAll(".dropdown-menu").forEach((menu) => {
      menu.addEventListener("click", (e) => {
        e.stopPropagation();
      });
    });

    // Logout
    const logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) {
      logoutBtn.addEventListener("click", async (e) => {
        e.preventDefault();
        await fetch("/api/logout", {
          method: "POST",
          credentials: "include",
        });
        window.location.href = "/login.html";
      });
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    loadHeader().catch(console.error);
  });
})();
