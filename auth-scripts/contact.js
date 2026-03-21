(() => {
  // ======================
  // CONFIG (edit later)
  // ======================
  const ENDPOINTS = {
    CREATE_TICKET: "/api/tickets/create", // POST
    LIST_TICKETS: "/api/tickets/mine", // GET
  };

  // ======================
  // Helpers
  // ======================
  const $ = (sel) => document.querySelector(sel);

  function escapeHtml(s) {
    return String(s ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function showResult(type, msg) {
    const mount = $(".createResult");
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
    const mount = $(".createResult");
    if (mount) mount.innerHTML = "";
  }

  function setBtnLoading(loading) {
    const btn = $("#btn");
    if (!btn) return;
    btn.disabled = loading;
    btn.innerHTML = loading
      ? `<span class="spinner-border spinner-border-sm mr-1"></span> Submitting...`
      : "Submit";
  }

  function formatDate(dt) {
    const d = new Date(dt);
    if (Number.isNaN(d.getTime())) return escapeHtml(dt);
    return d.toLocaleString();
  }

  function statusBadge(status) {
    const s = String(status || "open").toLowerCase();
    if (s === "open") return `<span class="badge badge-warning">Open</span>`;
    if (s === "pending") return `<span class="badge badge-info">Pending</span>`;
    if (s === "closed" || s === "resolved")
      return `<span class="badge badge-success">Closed</span>`;
    return `<span class="badge badge-secondary">${escapeHtml(status)}</span>`;
  }

  // ======================
  // Render tickets table
  // ======================
  function renderTickets(tickets) {
    const tbody = $("#ticketsTbody");
    if (!tbody) return;

    if (!Array.isArray(tickets) || tickets.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" class="text-center text-muted py-4">No support tickets yet.</td>
        </tr>`;
      return;
    }

    tbody.innerHTML = tickets
      .map((t) => {
        // backend can return any shape; we support common keys
        const department = t.department || "-";
        const ticketId = t.ticketId || t._id || t.id || "-";
        const date = t.createdAt || t.date || "-";
        const comments = t.commentsCount ?? t.comments ?? t.repliesCount ?? 0;
        const status = t.status || "open";

        return `
        <tr>
          <td>${escapeHtml(department)}</td>
          <td><code>${escapeHtml(ticketId)}</code></td>
          <td>${date !== "-" ? formatDate(date) : "-"}</td>
          <td>${escapeHtml(comments)}</td>
          <td>${statusBadge(status)}</td>
          
        </tr>
      `;
      })
      .join("");
  }

  // <td>
  //           <button type="button" class="btn btn-sm btn-primary" data-ticket="${escapeHtml(ticketId)}">
  //             View
  //           </button>
  //         </td>

  // ======================
  // Load previous tickets
  // ======================
  async function loadTickets() {
    const tbody = $("#ticketsTbody");
    if (tbody) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" class="text-center text-muted py-4">Loading tickets...</td>
        </tr>`;
    }

    try {
      const res = await fetch(ENDPOINTS.LIST_TICKETS, {
        method: "GET",
        headers: { Accept: "application/json" },
        credentials: "include",
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || "Failed to load tickets.");

      // accept multiple response shapes:
      // {tickets:[...]} OR {data:[...]} OR [...]
      const tickets = data.tickets || data.data || data.results || data || [];
      renderTickets(tickets);
    } catch (err) {
      console.error(err);
      renderTickets([]);
    }
  }

  // ======================
  // Create ticket
  // ======================
  async function createTicket(payload) {
    const res = await fetch(ENDPOINTS.CREATE_TICKET, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
      credentials: "include",
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message || "Ticket creation failed.");
    return data;
  }

  // ======================
  // Bind form
  // ======================
  function bindForm() {
    const form = $("#supportTicketForm");
    const department = $("#department");
    const message = $("#message");

    if (!form) return;

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      clearResult();

      const depVal = department?.value?.trim();
      const msgVal = message?.value?.trim();

      if (!depVal) return showResult("warning", "Please select a department.");
      if (!msgVal || msgVal.length < 5)
        return showResult(
          "warning",
          "Please type your complaint (min 5 chars).",
        );

      setBtnLoading(true);

      try {
        const data = await createTicket({
          department: depVal,
          message: msgVal,
        });

        const ticketId =
          data.ticketId ||
          data.ticket?.ticketId ||
          data.ticket?._id ||
          data.data?.ticketId;

        showResult(
          "success",
          ticketId
            ? `Ticket created successfully. Ticket ID: <b>${escapeHtml(ticketId)}</b>`
            : "Ticket created successfully.",
        );

        form.reset();
        await loadTickets();
      } catch (err) {
        console.error(err);
        showResult(
          "danger",
          escapeHtml(err.message || "Something went wrong."),
        );
      } finally {
        setBtnLoading(false);
      }
    });
  }

  // ======================
  // Init
  // ======================
  document.addEventListener("DOMContentLoaded", () => {
    bindForm();
    loadTickets();
  });
})();
