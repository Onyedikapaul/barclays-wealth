async function loadNewsletter() {
  const res = await fetch("/component/newsletter.html");
  const html = await res.text();
  document.getElementById("newsletter-component").innerHTML = html;

  initNewsletterForm();
}

function initNewsletterForm() {
  const form = document.getElementById("newsletterForm");
  const emailInput = document.getElementById("newsletterEmail");

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    if (!emailInput.value) {
      showToast("Please enter your email", "error");
      return;
    }

    // UI only (no backend yet)
    showToast("✅ Email subscribed successfully", "success");
    emailInput.value = "";
  });
}

function showToast(message, type = "success") {
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

document.addEventListener("DOMContentLoaded", loadNewsletter);
