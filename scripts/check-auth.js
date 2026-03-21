
async function redirectIfLoggedIn() {
  try {
    const res = await fetch("/api/check-auth", {
      method: "GET",
      credentials: "include",
    });

    const data = await res.json().catch(() => ({}));
    console.log("check-auth status:", res.status, data);

    if (res.ok) {
      window.location.href = "/en/account/myaccount/onlineacces";
    }
  } catch (err) {
    console.log("check-auth error:", err);
  }
}

document.addEventListener("DOMContentLoaded", redirectIfLoggedIn);
