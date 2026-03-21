(function () {
  // ---------- helpers ----------
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

  function badge(status) {
    const s = String(status || "").toLowerCase();
    if (s === "success")
      return `<span class="badge badge-sm badge-dot has-bg badge-success">Success</span>`;
    if (s === "pending")
      return `<span class="badge badge-sm badge-dot has-bg badge-warning">Pending</span>`;
    if (s === "draft")
      return `<span class="badge badge-sm badge-dot has-bg badge-info">Draft</span>`;
    if (s === "reversed")
      return `<span class="badge badge-sm badge-dot has-bg badge-warning">Reversed</span>`;
    return `<span class="badge badge-sm badge-dot has-bg badge-danger">Failed</span>`;
  }

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

  function mountRows(rows) {
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

  // ---------- modal open/close ----------
  function openModal() {
    const m = document.getElementById("txModal");
    if (!m) return;
    m.classList.remove("d-none");
    m.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }

  function closeModal() {
    const m = document.getElementById("txModal");
    if (!m) return;
    m.classList.add("d-none");
    m.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  }

  function openTxModal(t) {
    // top receipt fields
    const refEl = document.getElementById("txRefText");
    const amountEl = document.getElementById("txAmountText");
    const pill = document.getElementById("txStatusPill");

    if (refEl) refEl.textContent = t.ref || "-";

    const type = String(t.type || "").toLowerCase();
    const sign = type === "credit" ? "+" : "-";
    const currency = t.currency || "USD";
    if (amountEl) amountEl.textContent = `${currency}${sign}${money(t.amount)}`;

    if (pill) {
      pill.className = `tx-status ${statusClass(t.status)}`;
      pill.textContent = String(t.status || "-");
    }

    const b = t.beneficiary || {};

    // full details (including beneficiary)
    const rows = [
      { k: "Transaction Type", v: niceType(t.type) },
      { k: "Account ID", v: t.user },
      { k: "Transaction ID", v: t._id || "-" },
      { k: "Title", v: t.title || "-" },
      { k: "Description", v: t.narration || t.description || "-" },
      { k: "Date", v: formatDate(t.createdAt || t.date || "") || "-" },
      // { k: "Updated", v: formatDate(t.updatedAt || "") || "-" },

      // Beneficiary
      { k: "Beneficiary Name", v: b.accountName || "-" },
      { k: "Beneficiary Account", v: b.accountNumber || "-" },
      { k: "Beneficiary Bank", v: b.bankName || "-" },
    ];

    mountRows(rows);

    // PDF download
    const btn = document.getElementById("txReceiptBtn");
    if (btn) btn.onclick = () => downloadReceiptPdf(t._id);

    openModal();
  }

  // ✅ real PDF download from backend
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

  // ---------- table rendering ----------
  // function renderRows(list) {
  //   const tbody = document.getElementById("txTbody");
  //   if (!tbody) return;

  //   if (!Array.isArray(list) || list.length === 0) {
  //     tbody.innerHTML = `
  //       <tr>
  //         <td colspan="8" class="text-center text-soft p-3">No transactions yet.</td>
  //       </tr>
  //     `;
  //     return;
  //   }

  //   tbody.innerHTML = list
  //     .map((t) => {
  //       const type = String(t.type || "").toLowerCase();
  //       const typeClass = type === "credit" ? "text-success" : "text-danger";
  //       const sign = type === "credit" ? "+" : "-";
  //       const payload = escapeHtml(JSON.stringify(t));

  //       return `
  //         <tr>
  //           <td>${escapeHtml(t.ref)}</td>
  //           <td class="${typeClass}" style="font-weight:600;">${escapeHtml(type)}</td>
  //           <td>${escapeHtml(t.scope || "other")}</td>
  //           <td class="${typeClass}" style="font-weight:700;">
  //             ${sign}${money(t.amount)} <span class="text-soft">${escapeHtml(t.currency || "USD")}</span>
  //           </td>
  //           <td>${escapeHtml(formatDate(t.createdAt || t.date))}</td>
  //           <td>${escapeHtml(t.description || t.narration || "")}</td>
  //           <td>${badge(t.status)}</td>
  //           <td>
  //             <button class="btn btn-sm btn-light tx-view-btn" data-tx="${payload}">
  //               View
  //             </button>
  //           </td>
  //         </tr>
  //       `;
  //     })
  //     .join("");
  // }

  function renderRows(list) {
    const tbody = document.getElementById("txTbody");
    const mobileList = document.getElementById("txMobileList");

    if (!tbody || !mobileList) return;

    if (!Array.isArray(list) || list.length === 0) {
      tbody.innerHTML = `
      <tr>
        <td colspan="8" class="text-center text-soft p-3">No transactions yet.</td>
      </tr>
    `;
      mobileList.innerHTML = `
      <div class="text-center text-soft p-3">No transactions yet.</div>
    `;
      return;
    }

    // ===== DESKTOP TABLE =====
    tbody.innerHTML = list
      .map((t) => {
        const type = String(t.type || "").toLowerCase();
        const typeClass = type === "credit" ? "text-success" : "text-danger";
        const sign = type === "credit" ? "+" : "-";
        const payload = escapeHtml(JSON.stringify(t));

        return `
      <tr>
        <td>${escapeHtml(t.ref)}</td>
        <td class="${typeClass}" style="font-weight:600;">${escapeHtml(type)}</td>
        <td>${escapeHtml(t.scope || "other")}</td>
        <td class="${typeClass}" style="font-weight:700;">
          ${sign}${money(t.amount)} 
          <span class="text-soft">${escapeHtml(t.currency || "USD")}</span>
        </td>
        <td>${escapeHtml(formatDate(t.createdAt || t.date))}</td>
        <td>${escapeHtml(t.description || t.narration || "")}</td>
        <td>${badge(t.status)}</td>
        <td>
          <button class="btn btn-sm btn-light tx-view-btn" data-tx="${payload}">
            View
          </button>
        </td>
      </tr>
    `;
      })
      .join("");

    // ===== MOBILE CARDS =====
    mobileList.innerHTML = list
      .map((t) => {
        const type = String(t.type || "").toLowerCase();
        const typeClass = type === "credit" ? "text-success" : "text-danger";
        const sign = type === "credit" ? "+" : "-";
        const payload = escapeHtml(JSON.stringify(t));

        return `
      <div class="tx-card">
        
        <div class="tx-card-top">
          <div class="tx-card-ref">
            ${escapeHtml(t.ref)}
          </div>
          <div class="tx-card-amount ${typeClass}">
            ${sign}${money(t.amount)}
          </div>
        </div>

        <div class="tx-card-body">

          <div class="tx-card-row">
            <div class="tx-card-label">Type</div>
            <div>${escapeHtml(type)}</div>
          </div>

          <div class="tx-card-row">
            <div class="tx-card-label">Scope</div>
            <div>${escapeHtml(t.scope || "other")}</div>
          </div>

          <div class="tx-card-row">
            <div class="tx-card-label">Date</div>
            <div>${escapeHtml(formatDate(t.createdAt || t.date))}</div>
          </div>

          <div class="tx-card-row">
            <div class="tx-card-label">Status</div>
            <div>${badge(t.status)}</div>
          </div>

        </div>

        <div class="tx-card-action">
          <button class="btn btn-sm btn-light tx-view-btn" data-tx="${payload}" style="display: flex; justify-content: center; align-items: center;">
            View details
          </button>
        </div>

      </div>
    `;
      })
      .join("");
  }

  // ---------- events ----------
  function bindEvents() {
    document.addEventListener("click", (e) => {
      // close modal
      if (e.target.closest("[data-close='1']")) {
        closeModal();
        return;
      }

      // open modal
      const btn = e.target.closest(".tx-view-btn");
      if (!btn) return;

      let t = {};
      try {
        t = JSON.parse(btn.getAttribute("data-tx") || "{}");
      } catch {}

      openTxModal(t);
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeModal();
    });
  }

  async function loadTransactions() {
    try {
      const res = await fetch("/api/transactions?limit=50&page=1", {
        credentials: "include",
      });

      if (!res.ok) return;
      const data = await res.json();
      if (!data.ok) return;

      renderRows(data.transactions);
    } catch (e) {
      console.error("loadTransactions:", e);
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    bindEvents();
    loadTransactions();
  });
})();
