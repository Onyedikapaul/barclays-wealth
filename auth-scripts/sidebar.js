(async function () {
  async function loadSidebar() {
    const mount = document.getElementById("sidebarMount");
    if (!mount) return;

    // avoid double-loading
    if (mount.dataset.loaded === "true") return;
    mount.dataset.loaded = "true";

    const res = await fetch("/auth-components/sidebar.html", { cache: "no-store" });
    if (!res.ok) throw new Error("Failed to load sidebar.html");

    mount.innerHTML = await res.text();

    /**
     * IMPORTANT:
     * If dashlite's JS already ran before sidebar injected,
     * the toggle handlers might not be attached.
     *
     * This fallback makes the mobile toggle work even if dashlite
     * doesn’t re-init automatically.
     */
    bindMobileSidebarFallback();
  }

  function bindMobileSidebarFallback() {
    // toggle buttons use: .nk-nav-toggle[data-target="sidebarMenu"]
    document
      .querySelectorAll('.nk-nav-toggle[data-target="sidebarMenu"]')
      .forEach((btn) => {
        if (btn.dataset.bound === "true") return;
        btn.dataset.bound = "true";

        btn.addEventListener("click", (e) => {
          e.preventDefault();

          // common dashlite behavior is to toggle a class on body
          // try the most typical ones (one of them will match)
          document.body.classList.toggle("nk-sidebar-active");
          document.body.classList.toggle("nav-shown");
          document.body.classList.toggle("sidebar-shown");
        });
      });
  }

  document.addEventListener("DOMContentLoaded", () => {
    loadSidebar().catch(console.error);
  });
})();


