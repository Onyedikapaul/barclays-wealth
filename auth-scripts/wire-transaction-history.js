// (function () {
//   const table = document.getElementById("wireHistoryTable");
//   if (!table) return;

//   const tbody = table.querySelector("tbody");

//   function escapeHtml(str) {
//     return String(str ?? "")
//       .replaceAll("&", "&amp;")
//       .replaceAll("<", "&lt;")
//       .replaceAll(">", "&gt;")
//       .replaceAll('"', "&quot;")
//       .replaceAll("'", "&#039;");
//   }

//   function formatDate(iso) {
//     if (!iso) return "-";
//     const d = new Date(iso);
//     if (isNaN(d.getTime())) return "-";
//     return d.toLocaleDateString(undefined, {
//       year: "numeric",
//       month: "short",
//       day: "2-digit",
//     });
//   }

//   function money(n) {
//     const num = Number(n || 0);
//     return num.toLocaleString(undefined, {
//       minimumFractionDigits: 2,
//       maximumFractionDigits: 2,
//     });
//   }

//   function renderEmpty(msg) {
//     tbody.innerHTML = `
//         <tr>
//           <td colspan="5" class="text-center text-muted">${escapeHtml(msg)}</td>
//         </tr>
//       `;
//   }

//   async function loadHistory() {
//     try {
//       renderEmpty("Loading history...");

//       const res = await fetch("/api/wire-transfer/history", {
//         method: "GET",
//         headers: { "Content-Type": "application/json" },
//         // credentials: "include", // uncomment if your auth uses cookies
//       });

//       const json = await res.json().catch(() => ({}));

//       if (!res.ok) {
//         return renderEmpty(json?.message || "Failed to load history");
//       }

//       const rows = Array.isArray(json?.data) ? json.data : [];

//       if (rows.length === 0) {
//         return renderEmpty("No transfer history yet.");
//       }

//       tbody.innerHTML = rows
//         .map((h) => {
//           const recipientName = h?.recipient?.fullname || "Unknown";
//           const bank = h?.recipient?.bankname
//             ? ` (${h.recipient.bankname})`
//             : "";
//           const country = h?.recipient?.country
//             ? ` - ${h.recipient.country}`
//             : "";
//           const recipientText = `${recipientName}${bank}${country}`;

//           const ref = h?.reference || "-";
//           const date = formatDate(h?.createdAt);
//           const currency = h?.currency || "USD";
//           const amount = `${currency} ${money(h?.amount)}`;
//           const desc = h?.description || "-";

//           return `
//               <tr>
//                 <td>${escapeHtml(recipientText)}</td>
//                 <td>${escapeHtml(ref)}</td>
//                 <td>${escapeHtml(date)}</td>
//                 <td>${escapeHtml(amount)}</td>
//                 <td>${escapeHtml(desc)}</td>
//               </tr>
//             `;
//         })
//         .join("");
//     } catch (err) {
//       renderEmpty(err?.message || "Network error loading history");
//     }
//   }

//   // run
//   loadHistory();
// })();


(function () {
  const table = document.getElementById("wireHistoryTable");
  if (!table) return;
  const tbody = table.querySelector("tbody");

  // ── Inject styles ──
  const style = document.createElement("style");
  style.textContent = `
    /* Mobile responsive table */
    @media (max-width: 768px) {
      #wireHistoryTable thead { display: none; }
      #wireHistoryTable tr {
        display: block;
        border: 1px solid #e5e7eb;
        border-radius: 10px;
        margin-bottom: 12px;
        padding: 12px;
        background: #fff;
        box-shadow: 0 1px 4px rgba(0,0,0,0.06);
      }
      #wireHistoryTable td {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        padding: 6px 0;
        border: none;
        border-bottom: 1px solid #f3f4f6;
        font-size: 13px;
        gap: 8px;
      }
      #wireHistoryTable td:last-child { border-bottom: none; }
      #wireHistoryTable td::before {
        content: attr(data-label);
        font-weight: 600;
        color: #6b7280;
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        white-space: nowrap;
        flex-shrink: 0;
      }
    }

    /* Receipt Modal */
    #wireReceiptOverlay {
      position: fixed; inset: 0; z-index: 9999;
      background: rgba(0,0,0,0.45); backdrop-filter: blur(4px);
      display: flex; align-items: center; justify-content: center;
      padding: 16px;
    }
    #wireReceiptOverlay.d-none { display: none !important; }
    #wireReceiptModal {
      background: #fff; border-radius: 18px;
      width: 100%; max-width: 480px;
      max-height: 90vh; overflow-y: auto;
      box-shadow: 0 20px 60px rgba(0,0,0,0.2);
      animation: wireModalIn 0.2s ease;
    }
    @keyframes wireModalIn {
      from { opacity: 0; transform: scale(0.95) translateY(10px); }
      to   { opacity: 1; transform: scale(1) translateY(0); }
    }
    .wire-receipt-header {
      background: #033d75;
      border-radius: 18px 18px 0 0;
      padding: 20px 24px 16px;
      display: flex; align-items: flex-start; justify-content: space-between;
    }
    .wire-receipt-header h3 { color: #fff; font-size: 15px; font-weight: 700; margin: 0; }
    .wire-receipt-header p  { color: rgba(255,255,255,0.6); font-size: 12px; margin: 3px 0 0; }
    .wire-receipt-close {
      background: rgba(255,255,255,0.12); border: none; border-radius: 8px;
      color: #fff; width: 30px; height: 30px; cursor: pointer;
      font-size: 16px; display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
    }
    .wire-receipt-close:hover { background: rgba(255,255,255,0.2); }
    .wire-receipt-body { padding: 20px 24px 24px; }
    .wire-amount-hero {
      text-align: center; padding: 18px;
      background: #f8fafc; border-radius: 12px; margin-bottom: 18px;
    }
    .wire-amount-hero .amount {
      font-size: 28px; font-weight: 800; color: #033d75;
    }
    .wire-status-badge {
      display: inline-block; margin-top: 8px;
      padding: 3px 14px; border-radius: 20px;
      font-size: 11px; font-weight: 700; text-transform: uppercase;
    }
    .wire-status-badge.successful { background: #ecfdf3; color: #027a48; }
    .wire-status-badge.pending    { background: #fffaeb; color: #b54708; }
    .wire-status-badge.failed     { background: #fef3f2; color: #b42318; }
    .wire-status-badge.processing { background: #dbeafe; color: #1e3a8a; }
    .wire-kv-row {
      display: flex; justify-content: space-between; align-items: flex-start;
      padding: 9px 0; border-bottom: 1px solid #f1f5f9; gap: 12px;
    }
    .wire-kv-row:last-child { border-bottom: none; }
    .wire-kv-row .k { font-size: 12px; color: #94a3b8; font-weight: 500; white-space: nowrap; }
    .wire-kv-row .v { font-size: 13px; color: #1e293b; font-weight: 600; text-align: right; word-break: break-all; }
    .wire-receipt-actions {
      display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 18px;
    }
    .wire-receipt-actions button {
      padding: 11px; border-radius: 10px; font-size: 13px; font-weight: 700;
      border: none; cursor: pointer; display: flex; align-items: center;
      justify-content: center; gap: 7px; transition: opacity 0.2s;
    }
    .wire-receipt-actions button:hover { opacity: 0.85; }
    .wire-btn-download { background: #033d75; color: #fff; }
    .wire-btn-close    { background: #f1f5f9; color: #374151; }
    @media (max-width: 420px) {
      .wire-receipt-actions { grid-template-columns: 1fr; }
    }
  `;
  document.head.appendChild(style);

  // ── Modal HTML ──
  const overlay = document.createElement("div");
  overlay.id = "wireReceiptOverlay";
  overlay.className = "d-none";
  overlay.innerHTML = `
    <div id="wireReceiptModal">
      <div class="wire-receipt-header">
        <div>
          <h3>Transaction Receipt</h3>
          <p>Cross-border Transfer Details</p>
        </div>
        <button class="wire-receipt-close" id="wireReceiptCloseBtn">✕</button>
      </div>
      <div class="wire-receipt-body" id="wireReceiptBody"></div>
    </div>
  `;
  document.body.appendChild(overlay);

  // ── Close modal ──
  document.getElementById("wireReceiptCloseBtn").addEventListener("click", closeModal);
  overlay.addEventListener("click", (e) => { if (e.target === overlay) closeModal(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeModal(); });

  function closeModal() {
    overlay.classList.add("d-none");
    document.body.style.overflow = "";
  }

  function openModal() {
    overlay.classList.remove("d-none");
    document.body.style.overflow = "hidden";
  }

  // ── Helpers ──
  function esc(str) {
    return String(str ?? "")
      .replaceAll("&", "&amp;").replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
  }

  function money(n) {
    return Number(n || 0).toLocaleString(undefined, {
      minimumFractionDigits: 2, maximumFractionDigits: 2,
    });
  }

  function formatDate(iso) {
    if (!iso) return "-";
    const d = new Date(iso);
    return isNaN(d.getTime()) ? "-" : d.toLocaleString();
  }

  function formatDateShort(iso) {
    if (!iso) return "-";
    const d = new Date(iso);
    return isNaN(d.getTime()) ? "-" : d.toLocaleDateString(undefined, {
      year: "numeric", month: "short", day: "2-digit",
    });
  }

  function renderEmpty(msg) {
    tbody.innerHTML = `<tr><td colspan="6" class="text-center text-muted" style="padding:32px;">${esc(msg)}</td></tr>`;
  }

  // ── Open receipt modal ──
  function openReceipt(h) {
    const currency = h?.currency || "USD";
    const amount   = `${currency} ${money(h?.amount)}`;
    const status   = String(h?.status || "pending").toLowerCase();
    const r        = h?.recipient || {};

    const kv = [
      ["Reference",         h?.reference || "-"],
      ["Recipient Name",    r.fullname   || "-"],
      ["Bank",              r.bankname   || "-"],
      ["Country",           r.country    || "-"],
      ["Amount",            amount],
      ["Fee (2%)",          `${currency} ${money(h?.fee || 0)}`],
      ["Total Debited",     `${currency} ${money((h?.amount || 0) + (h?.fee || 0))}`],
      ["Description",       h?.description || "-"],
      ["Date",              formatDate(h?.createdAt)],
      ["Status",            status.charAt(0).toUpperCase() + status.slice(1)],
    ];

    const kvHtml = kv.map(([k, v]) => `
      <div class="wire-kv-row">
        <span class="k">${esc(k)}</span>
        <span class="v">${esc(v)}</span>
      </div>
    `).join("");

    document.getElementById("wireReceiptBody").innerHTML = `
      <div class="wire-amount-hero">
        <div class="amount">${esc(amount)}</div>
        <span class="wire-status-badge ${status}">${esc(status)}</span>
      </div>
      ${kvHtml}
      <div class="wire-receipt-actions">
        <button class="wire-btn-download" onclick="downloadWireReceipt('${esc(h?._id || "")}')">
          <i class="fa-solid fa-download"></i> Download PDF
        </button>
        <button class="wire-btn-close" onclick="document.getElementById('wireReceiptCloseBtn').click()">
          <i class="fa-solid fa-times"></i> Close
        </button>
      </div>
    `;

    openModal();
  }

  // ── Download PDF ──
  window.downloadWireReceipt = async function (id) {
    if (!id) return;
    try {
      const res = await fetch(`/api/wire-transfer/${id}/receipt.pdf`, {
        credentials: "include",
      });
      if (!res.ok) { alert("Failed to download receipt."); return; }
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href     = url;
      a.download = `wire-receipt-${id}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      alert("Network error downloading receipt.");
    }
  };

  // ── Load history ──
  async function loadHistory() {
    try {
      renderEmpty("Loading history...");

      const res  = await fetch("/api/wire-transfer/history", { credentials: "include" });
      const json = await res.json().catch(() => ({}));

      if (!res.ok) return renderEmpty(json?.message || "Failed to load history");

      const rows = Array.isArray(json?.data) ? json.data : [];
      if (!rows.length) return renderEmpty("No transfer history yet.");

      // Store for modal access
      window._wireHistoryCache = rows;

      tbody.innerHTML = rows.map((h, i) => {
        const r          = h?.recipient || {};
        const recipient  = [r.fullname, r.bankname ? `(${r.bankname})` : "", r.country ? `- ${r.country}` : ""].filter(Boolean).join(" ");
        const currency   = h?.currency || "USD";
        const amount     = `${currency} ${money(h?.amount)}`;
        const status     = String(h?.status || "pending").toLowerCase();

        const statusBadge = `
          <span style="display:inline-flex;align-items:center;gap:4px;padding:3px 10px;
            border-radius:20px;font-size:11px;font-weight:700;
            background:${status === "successful" ? "#ecfdf3" : status === "pending" ? "#fffaeb" : status === "processing" ? "#dbeafe" : "#fef3f2"};
            color:${status === "successful" ? "#027a48" : status === "pending" ? "#b54708" : status === "processing" ? "#1e3a8a" : "#b42318"};">
            ${status.charAt(0).toUpperCase() + status.slice(1)}
          </span>`;

        return `
          <tr>
            <td data-label="Recipient">${esc(recipient)}</td>
            <td data-label="Ref">${esc(h?.reference || "-")}</td>
            <td data-label="Date">${esc(formatDateShort(h?.createdAt))}</td>
            <td data-label="Amount" style="font-weight:700;color:#033d75;">${esc(amount)}</td>
            <td data-label="Status">${statusBadge}</td>
            <td data-label="Action">
              <button onclick="openWireReceipt(${i})"
                style="background:#033d75;color:#fff;border:none;border-radius:8px;
                  padding:6px 14px;font-size:12px;font-weight:600;cursor:pointer;">
                <i class="fa-solid fa-eye"></i> View
              </button>
            </td>
          </tr>`;
      }).join("");

    } catch (err) {
      renderEmpty(err?.message || "Network error loading history");
    }
  }

  // ── Global open receipt by index ──
  window.openWireReceipt = function (index) {
    const h = window._wireHistoryCache?.[index];
    if (h) openReceipt(h);
  };

  // Update table header to include Status + Action columns
  const thead = table.querySelector("thead tr");
  if (thead) {
    thead.innerHTML = `
      <th>Recipient</th>
      <th>Ref Number</th>
      <th>Date</th>
      <th>Amount</th>
      <th>Status</th>
      <th>Action</th>
    `;
  }

  loadHistory();
})();