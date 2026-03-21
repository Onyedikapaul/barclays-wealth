(function () {
  // -------- helpers ----------
  function $(id) {
    return document.getElementById(id);
  }

  function money(n) {
    const num = Number(n || 0);
    return num.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  function escapeHtml(str) {
    return String(str ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function formatDate(iso) {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleString();
  }

  function show(el) {
    if (el) el.classList.remove("d-none");
  }
  function hide(el) {
    if (el) el.classList.add("d-none");
  }

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

  // -------- receipt modal helpers (txModal) ----------
  function statusClass(status) {
    const s = String(status || "").toLowerCase();
    if (s === "success") return "tx-status--success";
    if (s === "pending") return "tx-status--pending";
    if (s === "draft") return "tx-status--draft";
    return "tx-status--failed";
  }

  function niceType(type) {
    const t = String(type || "").toLowerCase();
    return t ? t.toUpperCase() : "-";
  }

  function openReceiptModal() {
    const m = document.getElementById("txModal");
    if (!m) return;
    m.classList.remove("d-none");
    m.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }

  function closeReceiptModal() {
    const m = document.getElementById("txModal");
    if (!m) return;
    m.classList.add("d-none");
    m.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  }

  function mountReceiptRows(rows) {
    const mount = document.getElementById("txKvMount");
    if (!mount) return;

    mount.innerHTML = rows
      .map(
        (r) => `
        <div class="tx-row">
          <div class="tx-key">${escapeHtml(r.k)}</div>
          <div class="tx-val">${escapeHtml(r.v)}</div>
        </div>
      `,
      )
      .join("");
  }

  async function downloadReceiptPdf(txId) {
    try {
      if (!txId) return;

      const res = await fetch(`/api/transactions/${txId}/receipt.pdf`, {
        credentials: "include",
      });
      if (!res.ok) return;

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `receipt-${txId}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();

      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("downloadReceiptPdf:", err);
    }
  }

  function openTxModalFromTransfer(t, fallbackCurrency) {
    const refEl = document.getElementById("txRefText");
    const amountEl = document.getElementById("txAmountText");
    const pill = document.getElementById("txStatusPill");
    const receiptBtn = document.getElementById("txReceiptBtn");

    if (!refEl || !amountEl || !pill) return;

    refEl.textContent = t?.ref || "-";

    const type = String(t?.type || "").toLowerCase();
    const sign = type === "credit" ? "+" : "-";
    const currency = t?.currency || fallbackCurrency || "USD";
    amountEl.textContent = `${currency}${sign}${money(t?.amount)}`;

    pill.className = `tx-status ${statusClass(t?.status)}`;
    pill.textContent = String(t?.status || "-");

    const b = t?.beneficiary || {};
    const rows = [
      { k: "Transaction Type", v: niceType(t?.type) },
      { k: "Account ID", v: t?.user || "-" },
      { k: "Transaction ID", v: t?._id || "-" },
      { k: "Title", v: t?.title || "-" },
      { k: "Description", v: t?.narration || t?.description || "-" },
      { k: "Date", v: formatDate(t?.createdAt || t?.date || "") || "-" },

      { k: "Beneficiary Name", v: b?.accountName || "-" },
      { k: "Beneficiary Account", v: b?.accountNumber || "-" },
      { k: "Beneficiary Bank", v: b?.bankName || "-" },
    ];

    mountReceiptRows(rows);

    if (receiptBtn) {
      receiptBtn.onclick = () => downloadReceiptPdf(t?._id);
    }

    openReceiptModal();
  }

  function waitForReceiptClose() {
    return new Promise((resolve) => {
      const onClick = (e) => {
        if (e.target.closest("[data-close='1']")) {
          document.removeEventListener("click", onClick);
          document.removeEventListener("keydown", onKey);
          closeReceiptModal();
          resolve();
        }
      };

      const onKey = (e) => {
        if (e.key === "Escape") {
          document.removeEventListener("click", onClick);
          document.removeEventListener("keydown", onKey);
          closeReceiptModal();
          resolve();
        }
      };

      document.addEventListener("click", onClick);
      document.addEventListener("keydown", onKey);
    });
  }

  // -------- OTP modal helpers (otpModal) ----------
  function openOtpModal() {
    const m = document.getElementById("otpModal");
    if (!m) return;
    m.classList.remove("d-none");
    m.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";

    const input = document.getElementById("otpCode");
    if (input) input.focus();
  }

  function closeOtpModal() {
    const m = document.getElementById("otpModal");
    if (!m) return;
    m.classList.add("d-none");
    m.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  }

  function isValidOtp(v) {
    const s = String(v || "").trim();
    return /^\d{4}$/.test(s) || /^\d{6}$/.test(s);
  }

  function waitForOtpSubmit() {
    return new Promise((resolve, reject) => {
      const submitBtn = document.getElementById("otpSubmitBtn");
      const cancelBtn = document.getElementById("otpCancelBtn2") || document.getElementById("otpCancelBtn");
      const input = document.getElementById("otpCode");

      if (!submitBtn || !input) {
        reject(new Error("OTP modal elements missing"));
        return;
      }

      const cleanup = () => {
        submitBtn.removeEventListener("click", onSubmit);
        cancelBtn && cancelBtn.removeEventListener("click", onCancel);
        document.removeEventListener("keydown", onKey);
        document.removeEventListener("click", onBackdrop);
      };

      const onCancel = () => {
        cleanup();
        closeOtpModal();
        reject(new Error("OTP cancelled"));
      };

      const onBackdrop = (e) => {
        // close if user clicks something with data-close="1" inside otpModal
        if (e.target.closest("#otpModal [data-close='1']")) onCancel();
      };

      const onKey = (e) => {
        if (e.key === "Escape") onCancel();
        if (e.key === "Enter") onSubmit();
      };

      const onSubmit = () => {
        const otp = String(input.value || "").trim();
        if (!isValidOtp(otp)) {
          showResult("danger", "OTP must be 4 or 6 digits.");
          return;
        }
        cleanup();
        closeOtpModal();
        resolve(otp);
      };

      submitBtn.addEventListener("click", onSubmit);
      cancelBtn && cancelBtn.addEventListener("click", onCancel);
      document.addEventListener("keydown", onKey);
      document.addEventListener("click", onBackdrop);
    });
  }

  // -------- state ----------
  let draftTxId = null;
  let cachedCurrency = "USD";

  // -------- hydrate user/balance ----------
  async function hydrateBalance() {
    try {
      const res = await fetch("/api/dashboard", { credentials: "include" });
      if (!res.ok) return;

      const data = await res.json().catch(() => ({}));
      if (!data.ok) return;

      const u = data.user || {};
      cachedCurrency = u.usercurrency || "USD";

      document.querySelectorAll(".user-account-balance").forEach((el) => {
        el.textContent = money(u.accountBalance || 0);
      });
    } catch (e) {
      console.error("hydrateBalance:", e);
    }
  }

  // -------- step switching ----------
  function goStep(step) {
    const s1 = $("step1Card");
    const s2 = $("step2Card");
    const s3 = $("step3Card");

    clearResult();

    if (step === 1) {
      show(s1);
      hide(s2);
      hide(s3);
    }
    if (step === 2) {
      hide(s1);
      show(s2);
      hide(s3);
    }
    if (step === 3) {
      hide(s1);
      hide(s2);
      show(s3);
    }
  }

  // -------- backend calls ----------
  async function createDraft(amount) {
    const res = await fetch("/api/transfer/draft", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ amount }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.ok) throw new Error(data.message || "Failed to create draft");
    return data;
  }

  async function updateDraft(details) {
    const res = await fetch(`/api/transfer/draft/${encodeURIComponent(draftTxId)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(details),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.ok) throw new Error(data.message || "Failed to update draft");
    return data;
  }

  async function confirmDraft(pin) {
    const res = await fetch("/api/transfer/confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ draftTxId, pin }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.ok) throw new Error(data.message || "Transfer failed");
    return data;
  }

  async function finalizeDraft(otp) {
    const res = await fetch("/api/transfer/final", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ draftTxId, otp }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.ok) throw new Error(data.message || "OTP verification failed");
    return data;
  }

  // -------- validations ----------
  function isValidAccountNumber(v) {
    const s = String(v || "").trim();
    return /^\d{10,16}$/.test(s);
  }

  function isValidPin(v) {
    return /^\d{4}$/.test(String(v || "").trim());
  }

  // -------- wire events ----------
  async function handleStep1Next() {
    clearResult();

    const amt = Number(($("amount")?.value || "").trim());
    if (!Number.isFinite(amt) || amt <= 0) return showResult("danger", "Enter a valid amount.");
    if (amt < 5) return showResult("danger", "Minimum transfer is 5.00.");

    const btn = $("toStep2Btn");
    if (!btn) return;

    btn.disabled = true;
    btn.textContent = "Loading...";

    try {
      const draft = await createDraft(amt);
      draftTxId = draft.draftTxId;

      showResult(
        "success",
        `Amount locked: ${draft.currency || cachedCurrency} ${money(draft.amount)}. Ref: <b>${draft.ref}</b>`,
      );

      goStep(2);
    } catch (e) {
      showResult("danger", e.message);
    } finally {
      btn.disabled = false;
      btn.textContent = "Continue to next step";
    }
  }

  async function handleStep2Next() {
    clearResult();

    const bankName = ($("bankName")?.value || "").trim();
    const accountNumber = ($("accountNumber")?.value || "").trim();
    const accountName = ($("accountName")?.value || "").trim();
    const narration = ($("narration")?.value || "").trim();

    if (!draftTxId) {
      showResult("danger", "Missing draft transaction. Go back and re-enter amount.");
      goStep(1);
      return;
    }

    if (bankName.length < 2) return showResult("danger", "Enter bank name.");
    if (!isValidAccountNumber(accountNumber))
      return showResult("danger", "Enter a valid account number (10–16 digits).");
    if (accountName.length < 2) return showResult("danger", "Enter account name.");

    const btn = $("toStep3Btn");
    if (!btn) return;

    btn.disabled = true;
    btn.textContent = "Saving...";

    try {
      await updateDraft({ bankName, accountNumber, accountName, narration });
      goStep(3);
    } catch (e) {
      showResult("danger", e.message);
    } finally {
      btn.disabled = false;
      btn.textContent = "Continue";
    }
  }

  async function handleConfirm(e) {
    e.preventDefault();
    clearResult();

    if (!draftTxId) {
      showResult("danger", "Missing draft transaction. Start again.");
      goStep(1);
      return;
    }

    const pin = ($("txPin")?.value || "").trim();
    if (!isValidPin(pin)) return showResult("danger", "PIN must be 4 digits.");

    const btn = $("confirmTransferBtn");
    if (!btn) return;

    btn.disabled = true;
    btn.textContent = "Processing...";

    try {
      // 1) PIN -> backend sends OTP and sets tx.status = otp_required
      const confirmRes = await confirmDraft(pin);

      // 2) Open OTP modal if needed
      if (confirmRes.needsOtp) {
        showResult("success", "We sent a code to your email. Enter it to continue.");
        openOtpModal();

        const otp = await waitForOtpSubmit();

        btn.textContent = "Verifying code...";
        const finalRes = await finalizeDraft(otp);

        // 3) Show receipt only after finalization
        if (finalRes.transaction) {
          openTxModalFromTransfer(finalRes.transaction, cachedCurrency);
          await waitForReceiptClose();
        } else {
          showResult("success", "Transfer successful.");
        }
      } else {
        // fallback if backend still returns success directly
        if (confirmRes.transaction) {
          openTxModalFromTransfer(confirmRes.transaction, cachedCurrency);
          await waitForReceiptClose();
        } else {
          showResult("success", "Transfer successful.");
        }
      }

      // ✅ reset wizard
      draftTxId = null;
      $("transferForm")?.reset();
      await hydrateBalance();
      goStep(1);

      if (typeof window.loadRecentTransactions === "function") {
        window.loadRecentTransactions();
      }
    } catch (e) {
      showResult("danger", e.message);
    } finally {
      btn.disabled = false;
      btn.textContent = "Confirm Transfer";
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    hydrateBalance();
    goStep(1);

    $("toStep2Btn")?.addEventListener("click", handleStep1Next);
    $("backToStep1Btn")?.addEventListener("click", () => goStep(1));

    $("toStep3Btn")?.addEventListener("click", handleStep2Next);
    $("backToStep2Btn")?.addEventListener("click", () => goStep(2));

    $("transferForm")?.addEventListener("submit", handleConfirm);
  });
})();