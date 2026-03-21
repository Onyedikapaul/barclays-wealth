(function () {
  const form = document.getElementById("checkDepositForm");
  if (!form) return;

  const resultBox = form.querySelector(".result"); // keep only ONE .result inside form
  const btn = form.querySelector(".dep");

  function show(type, msg) {
    if (!resultBox) return;
    const cls =
      type === "success"
        ? "alert alert-success"
        : type === "warning"
        ? "alert alert-warning"
        : "alert alert-danger";
    resultBox.innerHTML = `<div class="${cls}">${msg}</div>`;
  }

  function setLoading(loading) {
    if (!btn) return;
    btn.disabled = !!loading;
    btn.dataset.originalText = btn.dataset.originalText || btn.innerHTML;
    btn.innerHTML = loading ? "Submitting..." : btn.dataset.originalText;
  }

  function resetPreviews() {
    const frontImg = document.getElementById("output_imageB");
    const backImg = document.getElementById("output_image");
    if (frontImg) frontImg.src = "img/size.jpg";
    if (backImg) backImg.src = "img/size.jpg";

    const frontInput = document.getElementById("fileTag");
    const backInput = document.getElementById("backFile");
    if (frontInput) frontInput.value = "";
    if (backInput) backInput.value = "";

    const labels = form.querySelectorAll(".custom-file-label");
    labels.forEach((lbl) => (lbl.textContent = "Choose file"));
  }

  form.addEventListener("submit", async function (e) {
    e.preventDefault();
    if (resultBox) resultBox.innerHTML = "";

    const amount = Number(form.querySelector("#amount")?.value || 0);
    if (!amount || amount <= 0) return show("warning", "Enter a valid amount.");

    const front = form.querySelector('input[name="fileToUpload"]')?.files?.[0];
    const back = form.querySelector('input[name="back"]')?.files?.[0];

    if (!front) return show("warning", "Please upload the front of the check.");
    if (!back) return show("warning", "Please upload the back of the check.");

    try {
      setLoading(true);

      const fd = new FormData(form);

      const res = await fetch("/api/check-deposit/submit", {
        method: "POST",
        body: fd,
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) return show("danger", data?.message || "Submit failed. Try again.");

      show("success", data?.message || "Check deposit submitted!");
      form.reset();
      resetPreviews(); // ✅ clears preview images too
    } catch (err) {
      show("danger", err?.message || "Network error. Try again.");
    } finally {
      setLoading(false);
    }
  });
})();
