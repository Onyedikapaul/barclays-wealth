(function () {
  const $ = (id) => document.getElementById(id);

  function showWireResult(type, msg) {
    const mount = document.querySelector(".wireResult");
    if (!mount) return;
    const cls = type === "success" ? "alert alert-success"
      : type === "warning" ? "alert alert-warning"
      : "alert alert-danger";
    mount.innerHTML = `<div class="${cls}">${msg}</div>`;
  }

  function clearWireResult() {
    const mount = document.querySelector(".wireResult");
    if (mount) mount.innerHTML = "";
  }

  function showSaveResult(type, msg) {
    const mount = $("saveRecipientResult");
    if (!mount) return;
    const cls = type === "success" ? "alert alert-success"
      : type === "warning" ? "alert alert-warning"
      : "alert alert-danger";
    mount.innerHTML = `<div class="${cls}">${msg}</div>`;
    setTimeout(() => { mount.innerHTML = ""; }, 4000);
  }

  function setBtnLoading(btn, loading, loadText = "Processing...") {
    if (!btn) return;
    btn.disabled = !!loading;
    btn.dataset.originalText = btn.dataset.originalText || btn.innerHTML;
    btn.innerHTML = loading ? loadText : btn.dataset.originalText;
  }

  function money(n) {
    return Number(n || 0).toLocaleString("en-US", {
      minimumFractionDigits: 2, maximumFractionDigits: 2,
    });
  }

  // ── Map: field ID → recipient object key ──
  const FIELD_MAP = {
    countryId:     "country",
    stateId:       "state",
    cityId:        "city",
    address:       "address",
    zipcode:       "zipcode",
    email:         "email",
    phone:         "phone",
    fullname:      "fullname",
    type:          "type",
    iban:          "iban",
    swiftcode:     "swiftcode",
    accountnumber: "accountnumber",
    accountholder: "accountholder",
    accounttype:   "accounttype",
    bankname:      "bankname",
  };

  function fillFormFromRecipient(r) {
    if (!r) return;

    Object.entries(FIELD_MAP).forEach(([fieldId, recipientKey]) => {
      const el = $(fieldId);
      if (!el) return;
      const val = r[recipientKey] ?? "";

      if (el.tagName === "SELECT") {
        const opts  = Array.from(el.options);
        const match = opts.find((o) => o.value.toLowerCase() === String(val).toLowerCase());
        if (match) {
          el.value = match.value;
        } else if (val) {
          const opt = document.createElement("option");
          opt.value = val; opt.textContent = val;
          el.appendChild(opt);
          el.value = val;
        }
      } else {
        el.value = val;
      }
    });

    const pin  = $("transactionPin");
    const desc = $("description");
    if (pin)  pin.value  = "";
    if (desc) desc.value = "";

    const amt = $("amount");
    if (amt) { amt.value = ""; setTimeout(() => amt.focus(), 100); }
  }

  function clearForm() {
    Object.keys(FIELD_MAP).forEach((id) => {
      const el = $(id);
      if (el) el.value = "";
    });
    ["transactionPin", "amount", "description"].forEach((id) => {
      const el = $(id);
      if (el) el.value = "";
    });
  }

  // ── Show receipt modal ──
  function showReceiptModal(tx, payload) {
    const currency = tx.currency || "USD";
    const amount   = Number(tx.amount || payload.amount);
    const fee      = Number(tx.fee || 0);
    const total    = Number((amount + fee).toFixed(2));
    const status   = String(tx.status || "pending").toLowerCase();

    const statusColors = {
      successful: { bg: "#ecfdf3", color: "#027a48" },
      pending:    { bg: "#fffaeb", color: "#b54708" },
      processing: { bg: "#dbeafe", color: "#1e3a8a" },
    };
    const sc = statusColors[status] || { bg: "#fef3f2", color: "#b42318" };

    const kv = [
      ["Reference",     tx.reference           || ""],
      ["Amount",        `${currency} ${money(amount)}`],
      ["Fee (2%)",      `${currency} ${money(fee)}`],
      ["Total Debited", `${currency} ${money(total)}`],
      ["Recipient",     payload.fullname        || ""],
      ["Bank",          payload.bankname        || ""],
      ["Account No.",   payload.accountnumber   || ""],
      ["IBAN",          payload.iban            || ""],
      ["Swift Code",    payload.swiftcode       || ""],
      ["Country",       payload.country         || ""],
      ["Description",   payload.description     || ""],
      ["Date",          new Date().toLocaleString()],
      ["Status",        "Pending Review"],
    ].filter(([, v]) => v);

    const kvHtml = kv.map(([k, v]) => `
      <div style="display:flex;justify-content:space-between;align-items:flex-start;
        padding:8px 0;border-bottom:1px solid #f1f5f9;gap:12px;">
        <span style="font-size:12px;color:#94a3b8;font-weight:500;white-space:nowrap;">${k}</span>
        <span style="font-size:13px;color:#1e293b;font-weight:600;text-align:right;word-break:break-all;">${v}</span>
      </div>
    `).join("");

    // Create overlay once
    if (!document.getElementById("wireSuccessOverlay")) {
      const overlay = document.createElement("div");
      overlay.id = "wireSuccessOverlay";
      overlay.style.cssText = `
        position:fixed;inset:0;z-index:9999;
        background:rgba(0,0,0,0.45);backdrop-filter:blur(4px);
        display:flex;align-items:center;justify-content:center;padding:16px;
      `;
      overlay.innerHTML = `
        <style>
          @keyframes wireIn {
            from{opacity:0;transform:scale(0.95) translateY(10px)}
            to{opacity:1;transform:scale(1) translateY(0)}
          }
        </style>
        <div id="wireSuccessModal" style="
          background:#fff;border-radius:18px;width:100%;max-width:460px;
          max-height:90vh;overflow-y:auto;
          box-shadow:0 20px 60px rgba(0,0,0,0.2);
          animation:wireIn 0.2s ease;
        ">
          <div style="background:#033d75;border-radius:18px 18px 0 0;
            padding:18px 22px 14px;display:flex;align-items:flex-start;justify-content:space-between;">
            <div>
              <div style="color:#fff;font-size:15px;font-weight:700;">Transfer Submitted</div>
              <div style="color:rgba(255,255,255,0.6);font-size:12px;margin-top:3px;">Cross-border Transfer Receipt</div>
            </div>
            <button id="wireSuccessCloseBtn"
              style="background:rgba(255,255,255,0.12);border:none;border-radius:8px;
                color:#fff;width:30px;height:30px;cursor:pointer;font-size:16px;
                display:flex;align-items:center;justify-content:center;flex-shrink:0;">✕</button>
          </div>
          <div id="wireSuccessBody" style="padding:18px 22px 22px;"></div>
        </div>
      `;
      document.body.appendChild(overlay);

      const closeModal = () => {
        overlay.style.display = "none";
        document.body.style.overflow = "";
      };

      document.getElementById("wireSuccessCloseBtn").addEventListener("click", closeModal);
      overlay.addEventListener("click", (e) => { if (e.target === overlay) closeModal(); });
      document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeModal(); });
    }

    // Fill body
    document.getElementById("wireSuccessBody").innerHTML = `
      <div style="text-align:center;padding:16px;background:#f8fafc;border-radius:12px;margin-bottom:16px;">
        <div style="font-size:26px;font-weight:800;color:#033d75;">
          ${currency} ${money(amount)}
        </div>
        <span style="display:inline-block;margin-top:8px;padding:3px 14px;border-radius:20px;
          font-size:11px;font-weight:700;background:${sc.bg};color:${sc.color};">
          PENDING REVIEW
        </span>
      </div>
      ${kvHtml}
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:16px;">
        <button onclick="downloadWireReceipt('${tx._id || ""}')"
          style="padding:11px;border-radius:10px;background:#033d75;color:#fff;
            border:none;cursor:pointer;font-size:13px;font-weight:700;
            display:flex;align-items:center;justify-content:center;gap:7px;">
          <i class="fa-solid fa-download"></i> Download PDF
        </button>
        <button id="wireSuccessCloseBtn2"
          style="padding:11px;border-radius:10px;background:#f1f5f9;color:#374151;
            border:none;cursor:pointer;font-size:13px;font-weight:700;
            display:flex;align-items:center;justify-content:center;gap:7px;">
          <i class="fa-solid fa-times"></i> Close
        </button>
      </div>
    `;

    // Wire up the close btn inside body (re-rendered each time)
    document.getElementById("wireSuccessCloseBtn2")?.addEventListener("click", () => {
      document.getElementById("wireSuccessOverlay").style.display = "none";
      document.body.style.overflow = "";
    });

    // Show
    const overlay = document.getElementById("wireSuccessOverlay");
    overlay.style.display = "flex";
    document.body.style.overflow = "hidden";
  }

  // ── Load saved recipients ──
  let recipientsCache = [];

  async function loadRecipients() {
    const select = $("recipient");
    if (!select) return;
    select.innerHTML = `<option value="" disabled selected>Loading recipients...</option>`;

    try {
      const res  = await fetch("/api/wire-transfer/recipients", { credentials: "include" });
      const data = await res.json().catch(() => ({}));
      const list = Array.isArray(data?.data) ? data.data : [];
      recipientsCache = list;

      select.innerHTML = `<option value="">— Select a saved recipient (optional) —</option>`;
      list.forEach((r) => {
        const opt = document.createElement("option");
        opt.value = r._id;
        opt.textContent = [
          r.fullname || "Unknown",
          r.bankname ? `(${r.bankname})` : "",
          r.country  ? `- ${r.country}`  : "",
        ].filter(Boolean).join(" ");
        select.appendChild(opt);
      });
    } catch {
      select.innerHTML = `<option value="" disabled selected>Could not load recipients</option>`;
    }
  }

  // ── Auto-fill on recipient select ──
  $("recipient")?.addEventListener("change", function () {
    const r = recipientsCache.find((x) => x._id === this.value);
    if (r) fillFormFromRecipient(r);
  });

  // ── Save Recipient ──
  $("saveRecipientBtn")?.addEventListener("click", async function () {
    const btn = this;

    const payload = {
      country:       $("countryId")?.value?.trim(),
      state:         $("stateId")?.value?.trim(),
      city:          $("cityId")?.value?.trim(),
      address:       $("address")?.value?.trim(),
      zipcode:       $("zipcode")?.value?.trim(),
      email:         $("email")?.value?.trim(),
      phone:         $("phone")?.value?.trim(),
      fullname:      $("fullname")?.value?.trim(),
      type:          $("type")?.value?.trim() || "International transfer",
      iban:          $("iban")?.value?.trim(),
      swiftcode:     $("swiftcode")?.value?.trim(),
      accountnumber: $("accountnumber")?.value?.trim(),
      accountholder: $("accountholder")?.value?.trim(),
      accounttype:   $("accounttype")?.value?.trim(),
      bankname:      $("bankname")?.value?.trim(),
    };

    if (!payload.fullname || !payload.country)
      return showSaveResult("warning", "At minimum, Country and Full Name are required to save a recipient.");

    try {
      setBtnLoading(btn, true, '<i class="fa-solid fa-spinner fa-spin"></i> Saving...');

      const res  = await fetch("/api/wire-transfer/recipient", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) return showSaveResult("danger", data?.message || "Failed to save recipient.");

      showSaveResult("success", "Recipient saved successfully!");
      await loadRecipients();

      const select = $("recipient");
      if (select && data?.data?._id) select.value = data.data._id;

    } catch (err) {
      showSaveResult("danger", err?.message || "Network error.");
    } finally {
      setBtnLoading(btn, false);
    }
  });

  // ── Submit Transfer ──
  $("wireTransferForm")?.addEventListener("submit", async function (e) {
    e.preventDefault();
    clearWireResult();

    const btn = this.querySelector(".wireBtn");

    const payload = {
      recipient:      $("recipient")?.value      || "",
      amount:         Number($("amount")?.value  || 0),
      transactionPin: $("transactionPin")?.value?.trim() || "",
      description:    $("description")?.value?.trim()    || "",
      country:        $("countryId")?.value?.trim(),
      state:          $("stateId")?.value?.trim(),
      city:           $("cityId")?.value?.trim(),
      address:        $("address")?.value?.trim(),
      zipcode:        $("zipcode")?.value?.trim(),
      email:          $("email")?.value?.trim(),
      phone:          $("phone")?.value?.trim(),
      fullname:       $("fullname")?.value?.trim(),
      type:           $("type")?.value?.trim(),
      iban:           $("iban")?.value?.trim(),
      swiftcode:      $("swiftcode")?.value?.trim(),
      accountnumber:  $("accountnumber")?.value?.trim(),
      accountholder:  $("accountholder")?.value?.trim(),
      accounttype:    $("accounttype")?.value?.trim(),
      bankname:       $("bankname")?.value?.trim(),
    };

    if (!payload.fullname)
      return showWireResult("warning", "Please enter the recipient full name.");
    if (!payload.amount || payload.amount <= 0)
      return showWireResult("warning", "Enter a valid amount.");
    if (!payload.transactionPin)
      return showWireResult("warning", "Enter your transaction PIN.");
    if (!payload.description)
      return showWireResult("warning", "Enter a description/reason.");

    try {
      setBtnLoading(btn, true, '<i class="fa-solid fa-spinner fa-spin"></i> Processing...');

      const res  = await fetch("/api/wire-transfer/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok)
        return showWireResult("danger", data?.message || "Transfer failed. Try again.");

      // ── Success ──
      clearForm();
      const select = $("recipient");
      if (select) select.value = "";

      showReceiptModal(data?.data || {}, payload);

      if (typeof window.loadRecentTransactions === "function") {
        window.loadRecentTransactions();
      }

    } catch (err) {
      showWireResult("danger", err?.message || "Network error. Try again.");
    } finally {
      setBtnLoading(btn, false);
    }
  });

  // ── Init ──
  loadRecipients();

})();