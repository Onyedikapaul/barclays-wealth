(function () {
  // Helpers
  const $ = (id) => document.getElementById(id);

  function showResult(type, msg) {
    const mount = document.querySelector(".result");
    if (!mount) return;

    const cls =
      type === "success"
        ? "alert alert-success"
        : type === "warning"
          ? "alert alert-warning"
          : "alert alert-danger";

    mount.innerHTML = `<div class="${cls}">${msg}</div>`;
  }

  function clearResult() {
    const mount = document.querySelector(".result");
    if (mount) mount.innerHTML = "";
  }

  function setBtnLoading(btn, loading) {
    if (!btn) return;
    btn.disabled = !!loading;
    btn.dataset.originalText = btn.dataset.originalText || btn.innerHTML;
    btn.innerHTML = loading ? "Processing..." : btn.dataset.originalText;
  }

  // Main
  const form = $("wireRecipientForm");
  if (!form) return;

  form.addEventListener("submit", async function (e) {
    e.preventDefault();
    clearResult();

    const submitBtn = form.querySelector(".addRecipient");

    // Collect payload (matches your backend controller)
    const payload = {
      country: $("countryId")?.value?.trim(),
      state: $("stateId")?.value?.trim(),
      city: $("cityId")?.value?.trim(),
      address: $("address")?.value?.trim(),
      zipcode: $("zipcode")?.value?.trim(),
      email: $("email")?.value?.trim(),
      phone: $("phone")?.value?.trim(),
      fullname: $("fullname")?.value?.trim(),
      type: $("type")?.value?.trim() || "International transfer",
      iban: $("iban")?.value?.trim(),
      swiftcode: $("swiftcode")?.value?.trim(),
      accountnumber: $("accountnumber")?.value?.trim(), // needs id="accountnumber"
      accountholder: $("accountholder")?.value?.trim(),
      accounttype: $("accounttype")?.value?.trim(),
      bankname: $("bankname")?.value?.trim(),
    };

    // Quick frontend validation
    if (
      !payload.country ||
      !payload.state ||
      !payload.city ||
      !payload.fullname
    ) {
      showResult(
        "warning",
        "Please fill: Country, State/Province, City, and Recipient fullname.",
      );
      return;
    }

    try {
      setBtnLoading(submitBtn, true);

      const res = await fetch("/api/wire-transfer/recipient", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // If you use JWT auth with cookies, keep this:
          // "Authorization": `Bearer ${token}`,
        },
        // If your backend uses cookies/sessions, enable:
        // credentials: "include",
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const msg = data?.message || "Something went wrong. Try again.";
        showResult("danger", msg);
        return;
      }

      // Success
      showResult("success", data?.message || "Recipient created successfully!");

      // Optional: clear form after success
      form.reset();

      // Optional: redirect to next step
      // window.location.href = "/wire-transfer/next-step";
      console.log("Saved recipient:", data);
    } catch (err) {
      showResult("danger", err?.message || "Network error. Please try again.");
    } finally {
      setBtnLoading(submitBtn, false);
    }
  });
})();
