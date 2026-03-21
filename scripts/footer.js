async function loadComponent(id, url) {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error("Failed to load component");
    const html = await res.text();
    document.getElementById(id).innerHTML = html;
  } catch (err) {
    console.error(err);
  }
}

// Load footer
loadComponent("footer", "/component/footer.html");
