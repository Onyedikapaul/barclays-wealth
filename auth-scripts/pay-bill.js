(function () {
  const BASE_URL = "";
  const PAYEES_URL = `${BASE_URL}/api/bill-pay/payees`;
  const BILLPAY_URL = `${BASE_URL}/api/bill-pay`;
  const FEE_RATE = 0.015;

  function qs(sel, root = document) {
    return root.querySelector(sel);
  }

  function money(n) {
    return Number(n || 0).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  function round2(n) {
    return Math.round((Number(n) + Number.EPSILON) * 100) / 100;
  }

  function showResult(type, msg, form) {
    const mount = qs(".billPayProcessResult", form);
    if (!mount) return;

    const cls =
      type === "success"
        ? "alert alert-success"
        : type === "warning"
        ? "alert alert-warning"
        : "alert alert-danger";

    mount.innerHTML = `<div class="${cls}">${msg}</div>`;
  }

  function setLoading(btn, loading) {
    btn.disabled = loading;
    btn.innerHTML = loading
      ? `<span class="spinner-border spinner-border-sm mr-1"></span> Processing...`
      : "Continue";
  }

  async function readJson(res) {
    const text = await res.text();
    try {
      return JSON.parse(text);
    } catch {
      return null;
    }
  }

  async function loadPayees(form) {
    const select = qs("#billPayPayeeSelect", form);
    const btn = qs("#billPaySubmitBtn", form);

    select.innerHTML = `<option value="" disabled selected>Loading payees...</option>`;
    btn.disabled = true;

    try {
      const token = localStorage.getItem("token");

      const res = await fetch(PAYEES_URL, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        credentials: "include",
      });

      const data = await readJson(res);

      if (!res.ok || !data) {
        showResult("danger", "Failed to load payees", form);
        return;
      }

      select.innerHTML = `<option value="" disabled selected>Select a payee</option>`;

      if (!data.payees.length) {
        select.innerHTML += `<option disabled>No payee yet – add a payee</option>`;
        showResult("warning", "Please add a payee first.", form);
        return;
      }

      data.payees.forEach((p) => {
        const opt = document.createElement("option");
        opt.value = p._id;
        opt.textContent = `${p.name}${p.account ? " • " + p.account : ""}`;
        select.appendChild(opt);
      });

      btn.disabled = false;
    } catch (err) {
      console.error(err);
      showResult("danger", "Network error loading payees", form);
    }
  }

  async function submitBillPay(form) {
    const btn = qs("#billPaySubmitBtn", form);

    const payload = {
      payeeid: qs("#billPayPayeeSelect", form).value,
      dated: qs("#billPayDate", form).value,
      amount: Number(qs("#billPayAmount", form).value),
      memo: qs("#billPayMemo", form).value.trim(),
      transactionPin: qs("#billPayPin", form).value.trim(),
    };

    if (!payload.payeeid)
      return showResult("warning", "Select a payee", form);
    if (!payload.dated)
      return showResult("warning", "Select delivery date", form);
    if (!payload.amount || payload.amount <= 0)
      return showResult("warning", "Enter valid amount", form);
    if (!payload.transactionPin)
      return showResult("warning", "Transaction PIN required", form);

    const fee = round2(payload.amount * FEE_RATE);
    const total = round2(payload.amount + fee);

    try {
      setLoading(btn, true);
      showResult(
        "warning",
        `Processing… Fee: ${money(fee)} | Total: ${money(total)}`,
        form,
      );

      const token = localStorage.getItem("token");

      const res = await fetch(BILLPAY_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const data = await readJson(res);

      if (!res.ok) {
        return showResult("danger", data?.message || "Payment failed", form);
      }

      showResult(
        "success",
        `Payment successful ✅<br>
         <b>Ref:</b> ${data.reference}<br>
         <b>Total Debited:</b> ${money(data.totalDebit)}`,
        form,
      );

      form.reset();
      await loadPayees(form);
    } catch (err) {
      console.error(err);
      showResult("danger", "Network error", form);
    } finally {
      setLoading(btn, false);
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("billPayProcessForm");
    if (!form) return;

    console.log("[billPay] script loaded ✅");
    loadPayees(form);
  });

  document.addEventListener(
    "submit",
    (e) => {
      const form = e.target;
      if (!(form instanceof HTMLFormElement)) return;
      if (form.id !== "billPayProcessForm") return;

      console.log("[billPay] submit captured ✅");
      e.preventDefault();
      e.stopImmediatePropagation();

      submitBillPay(form);
    },
    true,
  );
})();
