(function () {
  // ✅ If frontend & backend are different (example backend localhost:5000)
  // const BASE_URL = "http://localhost:5000";
  const BASE_URL = ""; // same origin

  const API_URL = `${BASE_URL}/api/payees`;

  function qs(sel, root = document) {
    return root.querySelector(sel);
  }

  function showResult(type, msg, root) {
    const mount = qs(".payeeCreateResult", root);
    if (!mount) return;

    const cls =
      type === "success"
        ? "alert alert-success"
        : type === "warning"
          ? "alert alert-warning"
          : "alert alert-danger";

    mount.innerHTML = `<div class="${cls}" style="display:block">${msg}</div>`;
  }

  function setLoading(btn, loading) {
    if (!btn) return;
    btn.disabled = loading;
    btn.innerHTML = loading
      ? `<span class="spinner-border spinner-border-sm mr-1"></span> Saving...`
      : "continue";
  }

  function val(form, id) {
    const el = qs(`#${id}`, form);
    return el ? String(el.value || "").trim() : "";
  }

  function checked(form, id) {
    const el = qs(`#${id}`, form);
    return !!(el && el.checked);
  }

  async function readResponse(res) {
    const text = await res.text();
    try {
      return { json: JSON.parse(text), text };
    } catch {
      return { json: null, text };
    }
  }

  async function submitPayee(form) {
    const btn = qs("#payeeCreateBtn", form);

    const payload = {
      name: val(form, "name"),
      method: val(form, "method") || "Paper Check",
      account: val(form, "account"),
      address1: val(form, "address"),
      address2: val(form, "address2"),
      city: val(form, "city"),
      state: val(form, "state"),
      zipcode: val(form, "zipcode"),
      nickname: val(form, "nickname"),
      favorite: checked(form, "customSwitch2"),
    };

    if (!payload.name)
      return showResult("warning", "Payee name is required.", form);
    if (!payload.account)
      return showResult("warning", "Account Number is required.", form);
    if (!payload.address1)
      return showResult("warning", "Address 1 is required.", form);
    if (!payload.city) return showResult("warning", "City is required.", form);
    if (!payload.state)
      return showResult("warning", "State is required.", form);
    if (!payload.zipcode)
      return showResult("warning", "Zip Code is required.", form);

    try {
      setLoading(btn, true);
      showResult("warning", "Submitting...", form);

      console.log("[payeeCreate] URL:", API_URL);
      console.log("[payeeCreate] payload:", payload);

      // If you use JWT:
      const token = localStorage.getItem("token");

      const res = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const { json, text } = await readResponse(res);

      console.log("[payeeCreate] status:", res.status);
      console.log("[payeeCreate] response:", json || text);

      if (!res.ok) {
        const msg = json?.message || text || `Request failed (${res.status})`;
        showResult("danger", msg, form);
        alert(`Payee failed: ${msg}`); // ✅ force visible
        return;
      }

      showResult(
        "success",
        json?.message || "Payee added successfully ✅",
        form,
      );
      form.reset();
    } catch (err) {
      console.error("[payeeCreate] error:", err);
      showResult("danger", err?.message || "Network error", form);
      alert(`Network error: ${err?.message || err}`);
    } finally {
      setLoading(btn, false);
    }
  }

  // capture submit
  document.addEventListener(
    "submit",
    (e) => {
      const form = e.target;
      if (!(form instanceof HTMLFormElement)) return;
      if (form.id !== "payeeCreateForm") return;

      console.log("[payeeCreate] submit captured ✅");

      e.preventDefault();
      e.stopPropagation();
      if (e.stopImmediatePropagation) e.stopImmediatePropagation();

      submitPayee(form);
    },
    true,
  );

  console.log("[payeeCreate] script loaded ✅");
})();
