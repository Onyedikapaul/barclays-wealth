(function () {
  async function handleLogout(e) {
    e.preventDefault();

    try {
      const res = await fetch("/api/logout", {
        method: "POST",
        credentials: "include", // VERY important (cookie-based auth)
      });

      if (!res.ok) {
        throw new Error("Logout failed");
      }

      // Optional cleanup
      localStorage.removeItem("token");
      sessionStorage.clear();

      // Optional toast
      if (window.toastr) {
        toastr.success("Logged out successfully");
      }

      // Redirect to login
      setTimeout(() => {
        window.location.href = "/en/account/myaccount/uzauth/login.html";
      }, 500);
    } catch (err) {
      console.error(err);
      if (window.toastr) {
        toastr.error("Unable to log out");
      }
    }
  }

  function init() {
    const btn = document.getElementById("logoutBtn");
    if (!btn || btn.dataset.bound === "true") return;

    btn.dataset.bound = "true";
    btn.addEventListener("click", handleLogout);
  }

  document.addEventListener("DOMContentLoaded", init);
})();
