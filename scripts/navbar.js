async function loadNavbar() {
  try {
    const res = await fetch("/component/navbar.html");
    if (!res.ok) throw new Error("Failed to load navbar");
    const html = await res.text();
    document.getElementById("navbar").innerHTML = html;
  } catch (err) {
    console.error(err);
  }
}

document.addEventListener("DOMContentLoaded", loadNavbar);
