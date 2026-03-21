(function () {
  const tbody = document.getElementById("txTbody");
  const userMeta = document.getElementById("userMeta");

  const txModal = document.getElementById("txModal");
  const editModal = document.getElementById("editTxModal");

  let cachedUserId = null;
  let cachedUser = null;
  let cachedTx = [];
  let editingTxId = null;

  // ===== utils =====
  function qs(name) {
    return new URLSearchParams(window.location.search).get(name);
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
    if (Number.isNaN(d.getTime())) return "-";
    return d.toLocaleString();
  }

  function badge(status) {
    const s = String(status || "").toLowerCase();
    if (s === "success") return `<span class="badge b-success">success</span>`;
    if (s === "pending") return `<span class="badge b-pending">pending</span>`;
    if (s === "failed") return `<span class="badge b-failed">failed</span>`;
    if (s === "reversed")
      return `<span class="badge b-reversed">reversed</span>`;
    return `<span class="badge b-draft">draft</span>`;
  }

  // ===== render table =====
  function render(rows) {
    if (!tbody) return;

    if (!Array.isArray(rows) || rows.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7">No transactions found.</td></tr>`;
      return;
    }

    tbody.innerHTML = rows
      .map((t) => {
        const type = String(t.type || "").toLowerCase();
        const sign = type === "credit" ? "+" : "-";
        const typeColor =
          type === "credit"
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
              <button class="btn-mini btn-view" data-view='${payload}'>View</button>
              <button class="btn-mini btn-edit" data-edit='${payload}'>Edit</button>
            </td>
          </tr>
        `;
      })
      .join("");
  }

  // ===== Receipt modal =====
  function statusClass(status) {
    const s = String(status || "").toLowerCase();
    if (s === "success") return "b-success";
    if (s === "pending") return "b-pending";
    if (s === "failed") return "b-failed";
    if (s === "reversed") return "b-reversed";
    return "b-draft";
  }

  function openReceipt(t) {
    if (!txModal) return;

    const refEl = document.getElementById("txRefText");
    const amtEl = document.getElementById("txAmountText");
    const pill = document.getElementById("txStatusPill");
    const mount = document.getElementById("txKvMount");
    const receiptBtn = document.getElementById("txReceiptBtn");

    if (!refEl || !amtEl || !pill || !mount) return;

    refEl.textContent = t.ref || "-";

    const type = String(t.type || "").toLowerCase();
    const sign = type === "credit" ? "+" : "-";
    const currency = t.currency || cachedUser?.usercurrency || "USD";
    amtEl.textContent = `${currency}${sign}${money(t.amount)}`;

    pill.className = `tx-status ${statusClass(t.status)}`;
    pill.textContent = String(t.status || "-");

    const b = t.beneficiary || {};
    const rows = [
      { k: "User ID", v: String(t.user || cachedUserId || "-") },
      { k: "Transaction ID", v: String(t._id || "-") },
      { k: "Type", v: String(t.type || "-") },
      { k: "Scope", v: String(t.scope || "-") },
      { k: "Title", v: String(t.title || "-") },
      { k: "Narration", v: String(t.narration || "-") },
      { k: "Status", v: String(t.status || "-") },
      { k: "Done", v: String(!!t.done) },
      { k: "Created", v: formatDate(t.createdAt) },
      { k: "Updated", v: formatDate(t.updatedAt) },

      { k: "Beneficiary Name", v: String(b.accountName || "-") },
      { k: "Beneficiary Account", v: String(b.accountNumber || "-") },
      { k: "Beneficiary Bank", v: String(b.bankName || "-") },

      { k: "Refunded", v: String(!!t.adjustment?.refunded) },
    ];

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
    } catch (e) {
      console.error("downloadReceiptPdf:", e);
    }
  }

  // ===== Edit modal =====
  function openEdit(t) {
    if (!editModal) return;

    editingTxId = t._id;

    const ref = document.getElementById("editTxRef");
    const status = document.getElementById("editStatus");
    const note = document.getElementById("editNote");
    const refund = document.getElementById("editRefund");
    const hint = document.getElementById("refundHint");

    if (ref) ref.textContent = `Ref: ${t.ref || "-"}`;
    if (status) status.value = String(t.status || "draft");
    if (note) note.value = String(t.adjustment?.note || "");
    if (refund) refund.checked = false;

    const canRefund =
      String(t.type) === "debit" &&
      t.done === true &&
      t.adjustment?.refunded !== true;

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
    const note = document.getElementById("editNote")?.value.trim() || "";
    const refund = !!document.getElementById("editRefund")?.checked;

    const btn = document.getElementById("saveEditBtn");
    const old = btn?.textContent || "Save";
    if (btn) {
      btn.disabled = true;
      btn.textContent = "Saving...";
    }

    try {
      const res = await fetch(
        `/api/admin/transactions/${encodeURIComponent(editingTxId)}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ status, note, refund }),
        },
      );

      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) throw new Error(data.message || "Update failed");

      await load(); // refresh
      closeEdit();
      alert(data.message || "Updated");
    } catch (e) {
      alert(e.message || "Update failed");
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.textContent = old;
      }
    }
  }

  // ===== meta UI updater (SAFE) =====
  function renderUserMetaBits() {
    if (!cachedUser) return;

    const name =
      `${cachedUser.firstname || ""} ${cachedUser.lastname || ""}`.trim() ||
      "—";

    const elName = document.getElementById("userNameText");
    const elEmail = document.getElementById("userEmailText");
    const elBal = document.getElementById("userBalText");
    const elId = document.getElementById("userIdText");

    if (elName) elName.textContent = name;
    if (elEmail) elEmail.textContent = cachedUser.email || "—";
    if (elBal)
      elBal.textContent = `${cachedUser.usercurrency || "USD"} ${money(cachedUser.accountBalance || 0)}`;
    if (elId) elId.textContent = cachedUser._id || "—";
  }

  // ===== events =====
  document.addEventListener("click", (e) => {
    if (e.target.closest("[data-close='1']")) closeReceipt();
    if (e.target.closest("[data-edit-close='1']")) closeEdit();

    const viewBtn = e.target.closest("[data-view]");
    if (viewBtn) {
      let t = {};
      try {
        t = JSON.parse(viewBtn.getAttribute("data-view") || "{}");
      } catch {}
      openReceipt(t);
      return;
    }

    const editBtn = e.target.closest("[data-edit]");
    if (editBtn) {
      let t = {};
      try {
        t = JSON.parse(editBtn.getAttribute("data-edit") || "{}");
      } catch {}
      openEdit(t);
      return;
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeReceipt();
      closeEdit();
    }
  });

  document.getElementById("saveEditBtn")?.addEventListener("click", saveEdit);

  // ===== load =====
  async function load() {
    cachedUserId = qs("userId");

    if (!cachedUserId) {
      if (tbody) {
        tbody.innerHTML = `<tr><td colspan="7" style="color:red;">Missing userId in query.</td></tr>`;
      }
      return;
    }

    try {
      const res = await fetch(
        `/api/admin/user/transactions?userId=${encodeURIComponent(cachedUserId)}&limit=100&page=1`,
        { credentials: "include" },
      );

      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok)
        throw new Error(data.message || "Failed to load");

      cachedUser = data.user;
      cachedTx = data.transactions || [];

      // ✅ update BOTH meta styles (new IDs + old userMeta block)
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
      if (tbody) {
        tbody.innerHTML = `<tr><td colspan="7" style="color:red;">${escapeHtml(e.message)}</td></tr>`;
      }
      console.error("load:", e);
    }
  }

  document.addEventListener("DOMContentLoaded", load);
})();
