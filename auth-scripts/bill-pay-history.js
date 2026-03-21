(function () {
  const BASE_URL = "";
  const HISTORY_URL = `${BASE_URL}/api/bill-pay/history`;

  function qs(sel, root = document) {
    return root.querySelector(sel);
  }

  function esc(s) {
    return String(s ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function money(n) {
    const num = Number(n || 0);
    return num.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  function fmtDate(d) {
    const dt = new Date(d);
    if (Number.isNaN(dt.getTime())) return "-";
    return dt.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "2-digit",
    });
  }

  function statusBadge(status) {
    const s = String(status || "").toLowerCase();
    const cls =
      s === "completed"
        ? "badge badge-success"
        : s === "pending" || s === "processing"
          ? "badge badge-warning"
          : "badge badge-danger";
    return `<span class="${cls}">${esc(status || "unknown")}</span>`;
  }

  async function readResponse(res) {
    const text = await res.text();
    try {
      return { json: JSON.parse(text), text };
    } catch {
      return { json: null, text };
    }
  }

  async function loadHistory() {
    const tbody = document.getElementById("billPayHistoryBody");
    if (!tbody) return;

    tbody.innerHTML = `<tr><td colspan="4">Loading...</td></tr>`;

    try {
      const token = localStorage.getItem("token"); // if JWT
      const res = await fetch(HISTORY_URL, {
        method: "GET",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        credentials: "include",
      });

      const { json, text } = await readResponse(res);

      console.log("[billPayHistory] status:", res.status);
      console.log("[billPayHistory] response:", json || text);

      if (!res.ok) {
        tbody.innerHTML = `<tr><td colspan="4">Failed to load history</td></tr>`;
        return;
      }

      const history = json?.history || [];
      if (!history.length) {
        tbody.innerHTML = `<tr><td colspan="4">No bill pay history yet.</td></tr>`;
        return;
      }

      const rows = history.map((h) => {
        const payeeName = h?.payeeSnapshot?.name || h?.payeeId?.name || "—";
        const date = fmtDate(h?.createdAt || h?.deliveryDate);
        const amount = money(h?.totalDebit ?? h?.amount ?? 0);
        const status = statusBadge(h?.status);

        return `
          <tr>
            <td>${esc(payeeName)}</td>
            <td>${esc(date)}</td>
            <td>${esc(amount)}</td>
            <td>${status}</td>
          </tr>
        `;
      });

      tbody.innerHTML = rows.join("");
    } catch (err) {
      console.error("[billPayHistory] error:", err);
      tbody.innerHTML = `<tr><td colspan="4">Network error</td></tr>`;
    }
  }

  // Load once on page load
  document.addEventListener("DOMContentLoaded", () => {
    console.log("[billPayHistory] script loaded ✅");
    loadHistory();
  });

  // Optional: reload history when user clicks "History" tab
  document.addEventListener("click", (e) => {
    const a = e.target.closest('a[data-toggle="tab"][href="#tabItem7"]');
    if (!a) return;
    setTimeout(loadHistory, 150); // allow tab to render
  });

  // Optional: expose to window so you can refresh after a successful payment
  window.reloadBillPayHistory = loadHistory;
})();
