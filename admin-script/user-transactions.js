(function () {
  const tbody    = document.getElementById("txTbody");
  const userMeta = document.getElementById("userMeta");
  const txModal  = document.getElementById("txModal");
  const editModal = document.getElementById("editTxModal");

  let cachedUserId  = null;
  let cachedUser    = null;
  let cachedTx      = [];
  let editingTxId   = null;
  let deletingTxId  = null;

  // ===== utils =====
  function qs(name) {
    return new URLSearchParams(window.location.search).get(name);
  }
  function money(n) {
    return Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  function escapeHtml(str) {
    return String(str ?? "")
      .replaceAll("&", "&amp;").replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
  }
  function formatDate(iso) {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "-";
    return d.toLocaleString();
  }
  function badge(status) {
    const s = String(status || "").toLowerCase();
    if (s === "success")  return `<span class="badge b-success">success</span>`;
    if (s === "pending")  return `<span class="badge b-pending">pending</span>`;
    if (s === "failed")   return `<span class="badge b-failed">failed</span>`;
    if (s === "reversed") return `<span class="badge b-reversed">reversed</span>`;
    return `<span class="badge b-draft">draft</span>`;
  }

  // ===== Inject global fix styles once =====
  (function injectGlobalStyles() {
    if (document.getElementById("txGlobalStyles")) return;
    const s = document.createElement("style");
    s.id = "txGlobalStyles";
    s.textContent = `
      /* Make the existing view modal sheet scrollable */
      .tx-sheet {
        max-height: 90vh !important;
        overflow-y: auto !important;
        display: flex;
        flex-direction: column;
      }
      .tx-content {
        overflow-y: auto !important;
        flex: 1;
      }

      /* Delete modal — completely independent, nothing can cover it */
      #deleteTxModal {
        position: fixed !important;
        inset: 0 !important;
        z-index: 999999 !important;
        display: none;
        align-items: center;
        justify-content: center;
        padding: 16px;
        background: rgba(0,0,0,0.55);
        backdrop-filter: blur(3px);
      }
      #deleteTxModal.dtm-open {
        display: flex !important;
      }
      .delete-dialog {
        background: #fff;
        border-radius: 16px;
        width: 100%;
        max-width: 440px;
        max-height: 90vh;
        overflow-y: auto;
        box-shadow: 0 24px 64px rgba(0,0,0,0.25);
        animation: dlgIn 0.2s ease;
        position: relative;
        z-index: 1;
      }
      @keyframes dlgIn {
        from { opacity:0; transform:scale(0.95) translateY(8px); }
        to   { opacity:1; transform:scale(1)   translateY(0);    }
      }
      .delete-head {
        background: #fff1f2;
        border-bottom: 1px solid #fecdd3;
        padding: 20px 24px 16px;
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
      }
      .delete-head-icon {
        width: 38px; height: 38px; border-radius: 50%;
        background: #fee2e2;
        display: flex; align-items: center; justify-content: center;
        font-size: 17px; flex-shrink: 0; margin-right: 12px;
      }
      .delete-head-text .delete-title { font-size: 15px; font-weight: 700; color: #991b1b; margin: 0; }
      .delete-head-text .delete-sub   { font-size: 12px; color: #ef4444; margin: 3px 0 0; }
      .delete-x {
        background: rgba(239,68,68,0.1); border: none; border-radius: 8px;
        color: #ef4444; width: 30px; height: 30px; cursor: pointer;
        font-size: 18px; line-height: 1;
        display: flex; align-items: center; justify-content: center; flex-shrink: 0;
      }
      .delete-x:hover { background: rgba(239,68,68,0.2); }
      .delete-body { padding: 22px 24px; }
      .delete-warning {
        background: #fff7ed; border: 1px solid #fed7aa; border-radius: 10px;
        padding: 13px 15px; font-size: 13px; color: #92400e;
        line-height: 1.55; margin-bottom: 16px;
      }
      .delete-warning strong { color: #c2410c; }
      .delete-tx-info {
        background: #f8fafc; border: 1px solid #e2e8f0;
        border-radius: 10px; padding: 12px 16px; margin-bottom: 18px;
      }
      .di-row { display:flex; justify-content:space-between; font-size:12.5px; padding:3px 0; }
      .di-row .dk { color:#94a3b8; font-weight:500; }
      .di-row .dv { color:#1e293b; font-weight:600; }
      .delete-confirm-input { margin-bottom: 18px; }
      .delete-confirm-input label {
        display:block; font-size:12px; font-weight:700; color:#6b7280;
        text-transform:uppercase; letter-spacing:0.05em; margin-bottom:6px;
      }
      .delete-confirm-input input {
        width:100%; padding:10px 14px; border:1.5px solid #e5e7eb;
        border-radius:9px; font-size:14px; font-family:inherit;
        color:#111827; outline:none; transition:border-color 0.2s,box-shadow 0.2s;
      }
      .delete-confirm-input input:focus {
        border-color:#ef4444; box-shadow:0 0 0 3px rgba(239,68,68,0.1);
      }
      .delete-confirm-input small { font-size:11px; color:#94a3b8; margin-top:4px; display:block; }
      .delete-actions { display:grid; grid-template-columns:1fr 1fr; gap:10px; }
      .btn-cancel-delete {
        padding:11px; border-radius:10px; border:1.5px solid #e5e7eb;
        background:#fff; color:#374151; font-family:inherit;
        font-size:13px; font-weight:600; cursor:pointer; transition:background 0.15s;
      }
      .btn-cancel-delete:hover { background:#f3f4f6; }
      .btn-confirm-delete {
        padding:11px; border-radius:10px; border:none;
        background:#ef4444; color:#fff; font-family:inherit;
        font-size:13px; font-weight:700; cursor:pointer; transition:opacity 0.2s;
        display:flex; align-items:center; justify-content:center; gap:6px;
      }
      .btn-confirm-delete:hover { opacity:0.88; }
      .btn-confirm-delete:disabled { opacity:0.5; cursor:not-allowed; }
      .delete-result { margin-top:12px; }
      .delete-result .alert { padding:10px 14px; border-radius:9px; font-size:13px; font-weight:500; }
      .del-alert-danger  { background:#fee2e2;color:#991b1b;border-left:4px solid #ef4444; }
      .del-alert-success { background:#d1fae5;color:#065f46;border-left:4px solid #10b981; }
    `;
    document.head.appendChild(s);
  })();

  // ===== Delete modal =====
  function injectDeleteModal() {
    if (document.getElementById("deleteTxModal")) return;

    const modal = document.createElement("div");
    modal.id = "deleteTxModal";
    modal.setAttribute("aria-hidden", "true");
    modal.innerHTML = `
      <div class="delete-dialog">
        <div class="delete-head">
          <div style="display:flex;align-items:flex-start;">
            <div class="delete-head-icon">🗑️</div>
            <div class="delete-head-text">
              <div class="delete-title">Delete Transaction</div>
              <div class="delete-sub">This action cannot be undone</div>
            </div>
          </div>
          <button class="delete-x" id="deleteCloseBtn">×</button>
        </div>
        <div class="delete-body">
          <div class="delete-warning">
            ⚠️ You are about to <strong>permanently delete</strong> this transaction record.
            This will <strong>not</strong> automatically reverse or refund the user's balance.
            Make sure you've handled any balance adjustments separately.
          </div>
          <div class="delete-tx-info" id="deleteTxInfo"></div>
          <div class="delete-confirm-input">
            <label>Type <strong>DELETE</strong> to confirm</label>
            <input type="text" id="deleteConfirmInput" placeholder='Type "DELETE" here' autocomplete="off" />
            <small>This field is case-sensitive.</small>
          </div>
          <div class="delete-actions">
            <button class="btn-cancel-delete" id="deleteCancelBtn">Cancel</button>
            <button class="btn-confirm-delete" id="deleteConfirmBtn" disabled>
              🗑️ Delete Permanently
            </button>
          </div>
          <div class="delete-result" id="deleteResult"></div>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    document.getElementById("deleteConfirmInput").addEventListener("input", (e) => {
      document.getElementById("deleteConfirmBtn").disabled = e.target.value !== "DELETE";
    });
    document.getElementById("deleteCloseBtn").addEventListener("click",  closeDeleteModal);
    document.getElementById("deleteCancelBtn").addEventListener("click", closeDeleteModal);
    modal.addEventListener("click", (e) => { if (e.target === modal) closeDeleteModal(); });
    document.getElementById("deleteConfirmBtn").addEventListener("click", executeDelete);
  }

  function openDeleteModal(t) {
    injectDeleteModal();
    deletingTxId = t._id;

    document.getElementById("deleteTxInfo").innerHTML = `
      <div class="di-row"><span class="dk">Ref</span><span class="dv">${escapeHtml(t.ref || "-")}</span></div>
      <div class="di-row"><span class="dk">Type</span><span class="dv">${escapeHtml(t.type || "-")}</span></div>
      <div class="di-row"><span class="dk">Amount</span><span class="dv">${money(t.amount)} ${escapeHtml(t.currency || "USD")}</span></div>
      <div class="di-row"><span class="dk">Status</span><span class="dv">${escapeHtml(t.status || "-")}</span></div>
      <div class="di-row"><span class="dk">Date</span><span class="dv">${escapeHtml(formatDate(t.createdAt))}</span></div>
    `;

    document.getElementById("deleteConfirmInput").value = "";
    document.getElementById("deleteConfirmBtn").disabled = true;
    document.getElementById("deleteResult").innerHTML = "";

    const modal = document.getElementById("deleteTxModal");
    modal.classList.add("dtm-open");
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    setTimeout(() => document.getElementById("deleteConfirmInput")?.focus(), 80);
  }

  function closeDeleteModal() {
    const modal = document.getElementById("deleteTxModal");
    if (!modal) return;
    modal.classList.remove("dtm-open");
    modal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    deletingTxId = null;
  }

  async function executeDelete() {
    if (!deletingTxId) return;
    if (document.getElementById("deleteConfirmInput")?.value !== "DELETE") return;

    const btn      = document.getElementById("deleteConfirmBtn");
    const resultEl = document.getElementById("deleteResult");

    btn.disabled  = true;
    btn.innerHTML = "⏳ Deleting...";

    try {
      const res  = await fetch(`/api/admin/transactions/${encodeURIComponent(deletingTxId)}`, {
        method: "DELETE", credentials: "include",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) throw new Error(data.message || "Delete failed");

      resultEl.innerHTML = `<div class="del-alert-success">✅ Transaction deleted successfully.</div>`;
      setTimeout(async () => { closeDeleteModal(); await load(); }, 1200);

    } catch (err) {
      resultEl.innerHTML = `<div class="del-alert-danger">❌ ${escapeHtml(err.message || "Delete failed.")}</div>`;
      btn.disabled  = false;
      btn.innerHTML = "🗑️ Delete Permanently";
    }
  }

  // ===== render table =====
  function render(rows) {
    if (!tbody) return;
    if (!Array.isArray(rows) || rows.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7">No transactions found.</td></tr>`;
      return;
    }
    tbody.innerHTML = rows.map((t) => {
      const type      = String(t.type || "").toLowerCase();
      const sign      = type === "credit" ? "+" : "-";
      const typeColor = type === "credit"
        ? "style='color:#16a34a;font-weight:800'"
        : "style='color:#dc2626;font-weight:800'";
      const payload = escapeHtml(JSON.stringify(t));
      return `
        <tr>
          <td>${escapeHtml(t.ref || "-")}</td>
          <td ${typeColor}>${escapeHtml(type)}</td>
          <td>${badge(t.status)}</td>
          <td ${typeColor}>
            ${sign}${money(t.amount)}
            <span style="color:#6b7280;font-weight:700">${escapeHtml(t.currency || "")}</span>
          </td>
          <td>${escapeHtml(formatDate(t.createdAt))}</td>
          <td title="${escapeHtml(t.narration || "")}"
              style="max-width:260px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
            ${escapeHtml(t.narration || "-")}
          </td>
          <td class="td-actions">
            <button class="btn-mini btn-view"   data-view='${payload}'>View</button>
            <button class="btn-mini btn-edit"   data-edit='${payload}'>Edit</button>
            <button class="btn-mini btn-delete" data-delete='${payload}'
              style="background:#fee2e2;color:#991b1b;border:1px solid #fca5a5;">Delete</button>
          </td>
        </tr>
      `;
    }).join("");
  }

  // ===== Receipt modal =====
  function statusClass(status) {
    const s = String(status || "").toLowerCase();
    if (s === "success")  return "b-success";
    if (s === "pending")  return "b-pending";
    if (s === "failed")   return "b-failed";
    if (s === "reversed") return "b-reversed";
    return "b-draft";
  }

  function openReceipt(t) {
    if (!txModal) return;
    const refEl      = document.getElementById("txRefText");
    const amtEl      = document.getElementById("txAmountText");
    const pill       = document.getElementById("txStatusPill");
    const mount      = document.getElementById("txKvMount");
    const receiptBtn = document.getElementById("txReceiptBtn");
    if (!refEl || !amtEl || !pill || !mount) return;

    refEl.textContent = t.ref || "-";
    const type     = String(t.type || "").toLowerCase();
    const sign     = type === "credit" ? "+" : "-";
    const currency = t.currency || cachedUser?.usercurrency || "USD";
    amtEl.textContent = `${currency}${sign}${money(t.amount)}`;
    pill.className    = `tx-status ${statusClass(t.status)}`;
    pill.textContent  = String(t.status || "-");

    const b = t.beneficiary || {};
    const rows = [
      { k: "User ID",             v: String(t.user || cachedUserId || "-") },
      { k: "Transaction ID",      v: String(t._id || "-") },
      { k: "Type",                v: String(t.type || "-") },
      { k: "Scope",               v: String(t.scope || "-") },
      { k: "Title",               v: String(t.title || "-") },
      { k: "Narration",           v: String(t.narration || "-") },
      { k: "Status",              v: String(t.status || "-") },
      { k: "Done",                v: String(!!t.done) },
      { k: "Created",             v: formatDate(t.createdAt) },
      { k: "Updated",             v: formatDate(t.updatedAt) },
      { k: "Beneficiary Name",    v: String(b.accountName || "-") },
      { k: "Beneficiary Account", v: String(b.accountNumber || "-") },
      { k: "Beneficiary Bank",    v: String(b.bankName || "-") },
      { k: "Refunded",            v: String(!!t.adjustment?.refunded) },
    ];

    mount.innerHTML = rows.map((r) => `
      <div class="tx-row">
        <div class="tx-key">${escapeHtml(r.k)}</div>
        <div class="tx-val">${escapeHtml(r.v)}</div>
      </div>
    `).join("");

    if (receiptBtn) receiptBtn.onclick = () => downloadReceiptPdf(t._id);

    txModal.classList.remove("d-none");
    txModal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }

  function closeReceipt() {
    if (!txModal) return;
    txModal.classList.add("d-none");
    txModal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  }

  async function downloadReceiptPdf(txId) {
    try {
      if (!txId) return;
      const res = await fetch(`/api/transactions/${txId}/receipt.pdf`, { credentials: "include" });
      if (!res.ok) return;
      const blob = await res.blob();
      const url  = window.URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href = url; a.download = `receipt-${txId}.pdf`;
      document.body.appendChild(a); a.click(); a.remove();
      window.URL.revokeObjectURL(url);
    } catch (e) { console.error("downloadReceiptPdf:", e); }
  }

  // ===== Edit modal =====
  function openEdit(t) {
    if (!editModal) return;
    editingTxId = t._id;

    const ref    = document.getElementById("editTxRef");
    const status = document.getElementById("editStatus");
    const note   = document.getElementById("editNote");
    const refund = document.getElementById("editRefund");
    const hint   = document.getElementById("refundHint");

    if (ref)    ref.textContent = `Ref: ${t.ref || "-"}`;
    if (status) status.value    = String(t.status || "draft");
    if (note)   note.value      = String(t.adjustment?.note || "");
    if (refund) refund.checked  = false;

    const canRefund = String(t.type) === "debit" && t.done === true && t.adjustment?.refunded !== true;
    if (hint) {
      hint.style.display = "block";
      hint.innerHTML = canRefund
        ? `Refund works only for <b>debit + done=true</b> and only once.`
        : `Refund unavailable: requires <b>debit + done=true</b> and not refunded already.`;
    }

    editModal.classList.remove("d-none");
    editModal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }

  function closeEdit() {
    if (!editModal) return;
    editModal.classList.add("d-none");
    editModal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    editingTxId = null;
  }

  async function saveEdit() {
    if (!editingTxId) return;
    const status = document.getElementById("editStatus")?.value;
    const note   = document.getElementById("editNote")?.value.trim() || "";
    const refund = !!document.getElementById("editRefund")?.checked;
    const btn    = document.getElementById("saveEditBtn");
    const old    = btn?.textContent || "Save";
    if (btn) { btn.disabled = true; btn.textContent = "Saving..."; }
    try {
      const res  = await fetch(`/api/admin/transactions/${encodeURIComponent(editingTxId)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status, note, refund }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) throw new Error(data.message || "Update failed");
      await load();
      closeEdit();
      alert(data.message || "Updated");
    } catch (e) {
      alert(e.message || "Update failed");
    } finally {
      if (btn) { btn.disabled = false; btn.textContent = old; }
    }
  }

  // ===== meta UI =====
  function renderUserMetaBits() {
    if (!cachedUser) return;
    const name    = `${cachedUser.firstname || ""} ${cachedUser.lastname || ""}`.trim() || "—";
    const elName  = document.getElementById("userNameText");
    const elEmail = document.getElementById("userEmailText");
    const elBal   = document.getElementById("userBalText");
    const elId    = document.getElementById("userIdText");
    if (elName)  elName.textContent  = name;
    if (elEmail) elEmail.textContent = cachedUser.email || "—";
    if (elBal)   elBal.textContent   = `${cachedUser.usercurrency || "USD"} ${money(cachedUser.accountBalance || 0)}`;
    if (elId)    elId.textContent    = cachedUser._id || "—";
  }

  // ===== events =====
  document.addEventListener("click", (e) => {
    if (e.target.closest("[data-close='1']"))      closeReceipt();
    if (e.target.closest("[data-edit-close='1']")) closeEdit();

    const viewBtn = e.target.closest("[data-view]");
    if (viewBtn) {
      let t = {};
      try { t = JSON.parse(viewBtn.getAttribute("data-view") || "{}"); } catch {}
      openReceipt(t);
      return;
    }
    const editBtn = e.target.closest("[data-edit]");
    if (editBtn) {
      let t = {};
      try { t = JSON.parse(editBtn.getAttribute("data-edit") || "{}"); } catch {}
      openEdit(t);
      return;
    }
    const deleteBtn = e.target.closest("[data-delete]");
    if (deleteBtn) {
      let t = {};
      try { t = JSON.parse(deleteBtn.getAttribute("data-delete") || "{}"); } catch {}
      openDeleteModal(t);
      return;
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") { closeReceipt(); closeEdit(); closeDeleteModal(); }
  });

  document.getElementById("saveEditBtn")?.addEventListener("click", saveEdit);

  // ===== load =====
  async function load() {
    cachedUserId = qs("userId");
    if (!cachedUserId) {
      if (tbody) tbody.innerHTML = `<tr><td colspan="7" style="color:red;">Missing userId in query.</td></tr>`;
      return;
    }
    try {
      const res  = await fetch(
        `/api/admin/user/transactions?userId=${encodeURIComponent(cachedUserId)}&limit=100&page=1`,
        { credentials: "include" },
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) throw new Error(data.message || "Failed to load");

      cachedUser = data.user;
      cachedTx   = data.transactions || [];
      renderUserMetaBits();

      if (userMeta && cachedUser) {
        userMeta.innerHTML = `
          <b>${escapeHtml((cachedUser.firstname || "") + " " + (cachedUser.lastname || ""))}</b>
          • ${escapeHtml(cachedUser.email || "")}
          • Balance: <b>${escapeHtml(cachedUser.usercurrency || "USD")} ${money(cachedUser.accountBalance || 0)}</b>
          • UserID: <span style="color:#6b7280">${escapeHtml(cachedUser._id)}</span>
        `;
      }
      render(cachedTx);
    } catch (e) {
      if (tbody) tbody.innerHTML = `<tr><td colspan="7" style="color:red;">${escapeHtml(e.message)}</td></tr>`;
      console.error("load:", e);
    }
  }

  document.addEventListener("DOMContentLoaded", load);
})();