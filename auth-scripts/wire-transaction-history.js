(function () {
  const table = document.getElementById("wireHistoryTable");
  if (!table) return;

  const tbody = table.querySelector("tbody");

  function escapeHtml(str) {
    return String(str ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function formatDate(iso) {
    if (!iso) return "-";
    const d = new Date(iso);
    if (isNaN(d.getTime())) return "-";
    return d.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "2-digit",
    });
  }

  function money(n) {
    const num = Number(n || 0);
    return num.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  function renderEmpty(msg) {
    tbody.innerHTML = `
        <tr>
          <td colspan="5" class="text-center text-muted">${escapeHtml(msg)}</td>
        </tr>
      `;
  }

  async function loadHistory() {
    try {
      renderEmpty("Loading history...");

      const res = await fetch("/api/wire-transfer/history", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        // credentials: "include", // uncomment if your auth uses cookies
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        return renderEmpty(json?.message || "Failed to load history");
      }

      const rows = Array.isArray(json?.data) ? json.data : [];

      if (rows.length === 0) {
        return renderEmpty("No transfer history yet.");
      }

      tbody.innerHTML = rows
        .map((h) => {
          const recipientName = h?.recipient?.fullname || "Unknown";
          const bank = h?.recipient?.bankname
            ? ` (${h.recipient.bankname})`
            : "";
          const country = h?.recipient?.country
            ? ` - ${h.recipient.country}`
            : "";
          const recipientText = `${recipientName}${bank}${country}`;

          const ref = h?.reference || "-";
          const date = formatDate(h?.createdAt);
          const currency = h?.currency || "USD";
          const amount = `${currency} ${money(h?.amount)}`;
          const desc = h?.description || "-";

          return `
              <tr>
                <td>${escapeHtml(recipientText)}</td>
                <td>${escapeHtml(ref)}</td>
                <td>${escapeHtml(date)}</td>
                <td>${escapeHtml(amount)}</td>
                <td>${escapeHtml(desc)}</td>
              </tr>
            `;
        })
        .join("");
    } catch (err) {
      renderEmpty(err?.message || "Network error loading history");
    }
  }

  // run
  loadHistory();
})();
