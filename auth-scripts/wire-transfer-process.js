(function () {
  const $ = (id) => document.getElementById(id);

  // Target the result div inside THIS form (no confusion)
  function getResultMount() {
    return document.querySelector("#wireTransferForm .wireResult");
  }

  function showWireResult(type, msg) {
    const mount = getResultMount();
    if (!mount) return;

    const cls =
      type === "success"
        ? "alert alert-success"
        : type === "warning"
          ? "alert alert-warning"
          : "alert alert-danger";

    mount.innerHTML = `<div class="${cls}">${msg}</div>`;
  }

  function clearWireResult() {
    const mount = getResultMount();
    if (mount) mount.innerHTML = "";
  }

  function setBtnLoading(btn, loading) {
    if (!btn) return;
    btn.disabled = !!loading;
    btn.dataset.originalText = btn.dataset.originalText || btn.innerHTML;
    btn.innerHTML = loading ? "Processing..." : btn.dataset.originalText;
  }

  const form = $("wireTransferForm");
  const btn = form?.querySelector(".wireBtn");
  const recipientSelect = $("recipient");

  if (!form || !recipientSelect) return;

  // ✅ LOAD recipients on page load
  async function loadRecipients() {
    try {
      clearWireResult();

      // Reset dropdown
      recipientSelect.innerHTML = `<option value="" selected disabled>Loading recipients...</option>`;

      const res = await fetch("/api/wire-transfer/recipients", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        // credentials: "include", // if you use cookie auth
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        recipientSelect.innerHTML = `<option value="" selected disabled>Failed to load recipients</option>`;
        showWireResult("danger", data?.message || "Failed to load recipients.");
        return;
      }

      const recipients = Array.isArray(data?.data) ? data.data : [];

      if (recipients.length === 0) {
        recipientSelect.innerHTML = `<option value="" selected disabled>No recipient have been added</option>`;
        showWireResult(
          "warning",
          "No recipient added yet. Please add a recipient before making a transfer.",
        );
        return;
      }

      // Fill dropdown
      recipientSelect.innerHTML = `<option value="" selected disabled>Select a Recipient</option>`;

      recipients.forEach((r) => {
        const opt = document.createElement("option");
        opt.value = r._id;

        // Nice label format
        const label = [
          r.fullname || "Unknown",
          r.bankname ? `(${r.bankname})` : "",
          r.country ? `- ${r.country}` : "",
        ]
          .filter(Boolean)
          .join(" ");

        opt.textContent = label;
        recipientSelect.appendChild(opt);
      });

      // Optional: success note
      // showWireResult("success", "Recipients loaded.");
    } catch (err) {
      recipientSelect.innerHTML = `<option value="" selected disabled>Error loading recipients</option>`;
      showWireResult(
        "danger",
        err?.message || "Network error loading recipients.",
      );
    }
  }

  // Run immediately (no need for DOMContentLoaded since script is after form)
  loadRecipients();

  // ✅ SUBMIT transfer
  form.addEventListener("submit", async function (e) {
    e.preventDefault();
    clearWireResult();

    const payload = {
      recipient: recipientSelect.value || "",
      dated: $("dated")?.value || "",
      amount: Number($("amount")?.value || 0),
      description: $("description")?.value?.trim() || "",
      transactionPin: $("transactionPin")?.value?.trim() || "",
    };

    if (!payload.recipient)
      return showWireResult("warning", "Please select a recipient.");
    if (!payload.amount || payload.amount <= 0)
      return showWireResult("warning", "Enter a valid amount.");
    if (!payload.transactionPin)
      return showWireResult("warning", "Enter your transaction PIN.");
    if (!payload.description)
      return showWireResult("warning", "Enter description (reason).");

    try {
      setBtnLoading(btn, true);

      const res = await fetch("/api/wire-transfer/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        // credentials: "include",
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        return showWireResult(
          "danger",
          data?.message || "Transfer failed. Try again.",
        );
      }

      showWireResult("success", data?.message || "Transfer successful!");

      // Reset form after success
      form.reset();
      recipientSelect.selectedIndex = 0;

      // Optional: reload recipients (if you want freshest list)
      // await loadRecipients();
    } catch (err) {
      showWireResult("danger", err?.message || "Network error. Try again.");
    } finally {
      setBtnLoading(btn, false);
    }
  });
})();
