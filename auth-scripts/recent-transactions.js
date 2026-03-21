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

  // ---------- recent list ----------
  function renderRecent(list) {
    const mount = document.getElementById("recentTransactions");
    if (!mount) return;

    if (!Array.isArray(list) || list.length === 0) {
      mount.innerHTML = `<div class="p-3 text-soft">No recent transactions.</div>`;
      return;
    }

    mount.innerHTML = list
      .map((t) => {
        const type = (t.type || "").toLowerCase();
        const badgeClass = type === "credit" ? "text-success" : "text-danger";
        const sign = type === "credit" ? "+" : "-";

        const payload = escapeHtml(JSON.stringify(t));

        return `
          <div class="tranx-item">
            <div class="tranx-col">
              <div class="tranx-info">
                <div class="tranx-data">
               <div class="tranx-label">
  ${escapeHtml(t.narration || "Transaction")}
</div>

                  <div class="tranx-date text-soft">
                    ${escapeHtml(t.dateText || formatDate(t.createdAt || t.date || ""))}
                  </div>
                </div>
              </div>
            </div>

          <div class="tranx-row">
            <div class="tranx-col">
              <div class="tranx-amount ${badgeClass}">
                <span class="amount">
                  ${sign}${money(t.amount)}
                  <span class="currency">${escapeHtml(t.currency || "USD")}</span>
                </span>
              </div>
            </div>

            <div class="tranx-col">
              <button class="btn btn-sm btn-light tx-view-btn" data-tx="${payload}">
                View details
              </button>
            </div>
          </div>
          </div>
        `;
      })
      .join("");
  }

  async function loadRecentTransactions() {
    try {
      const res = await fetch("/api/transactions/recent?limit=5", {
        credentials: "include",
      });

      if (!res.ok) return;
      const data = await res.json();
      if (!data.ok) return;

      renderRecent(data.transactions);
    } catch (e) {
      console.error("loadRecentTransactions:", e);
    }
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
    const refEl = document.getElementById("txRefText");
    const amountEl = document.getElementById("txAmountText");
    const pill = document.getElementById("txStatusPill");
    const receiptBtn = document.getElementById("txReceiptBtn");

    if (!refEl || !amountEl || !pill) return;

    refEl.textContent = t.ref || "-";

    const type = String(t.type || "").toLowerCase();
    const sign = type === "credit" ? "+" : "-";
    const currency = t.currency || "USD";
    amountEl.textContent = `${currency}${sign}${money(t.amount)}`;

    pill.className = `tx-status ${statusClass(t.status)}`;
    pill.textContent = String(t.status || "-");

    const b = t.beneficiary || {};
    const rows = [
      { k: "Transaction Type", v: niceType(t.type) },
      { k: "Account ID", v: t.user || "-" },
      { k: "Transaction ID", v: t._id || "-" },
      { k: "Title", v: t.title || "-" },
      { k: "Description", v: t.narration || t.description || "-" },
      { k: "Date", v: formatDate(t.createdAt || t.date || "") || "-" },

      { k: "Beneficiary Name", v: b.accountName || "-" },
      { k: "Beneficiary Account", v: b.accountNumber || "-" },
      { k: "Beneficiary Bank", v: b.bankName || "-" },
    ];

    mountRows(rows);

    if (receiptBtn) {
      receiptBtn.onclick = () => downloadReceiptPdf(t._id);
    }

    openModal();
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

  // ---------- global events ----------
  function bindModalEvents() {
    document.addEventListener("click", (e) => {
      if (e.target.closest("[data-close='1']")) {
        closeModal();
        return;
      }

      const btn = e.target.closest(".tx-view-btn");
      if (!btn) return;

      let t = {};
      try {
        t = JSON.parse(btn.getAttribute("data-tx") || "{}");
      } catch (err) {
        console.error("Invalid JSON in data-tx", err);
        return;
      }

      openTxModal(t);
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeModal();
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    bindModalEvents();
    loadRecentTransactions();
  });

  // optional manual trigger
  window.loadRecentTransactions = loadRecentTransactions;
})();
