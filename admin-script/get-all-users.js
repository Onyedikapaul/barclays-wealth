(function () {
  const API_URL = "/api/admin/users";
  const tbody = document.getElementById("usersTbody");
  let allUsers = [];
  let currentToggleData = null;

  // ---------- More Actions Modal state ----------
  let activeUserId = null;

  function esc(str) {
    return String(str ?? "").replace(
      /[&<>"']/g,
      (m) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#039;",
        })[m],
    );
  }

  function fullName(u) {
    return [u.firstname, u.middlename, u.lastname].filter(Boolean).join(" ");
  }

  function render(users) {
    tbody.innerHTML = users
      .map((u) => {
        const name = fullName(u);
        return `
          <tr>
            <td>${esc(name)}</td>
            <td>${esc(u.email)}</td>

            <td>
              <label class="toggle">
                <input
                  type="checkbox"
                  ${u.isAllowedToTransfer ? "checked" : ""}
                  data-user-id="${esc(u._id)}"
                />
                <span class="toggle-slider"></span>
              </label>
            </td>

            <td>
              <button
                class="btn btn-sm"
                data-login-id="${esc(u._id)}"
                style="cursor:pointer;border-radius:10px;padding:10px;background-color:#0b2f55;color:white;border:none;"
              >
                Login
              </button>
            </td>

            <td>
              <button
                class="btn btn-sm btn-more"
                data-more-id="${esc(u._id)}"
                data-more-name="${esc(name)}"
                data-more-email="${esc(u.email)}"
                style="cursor:pointer;border-radius:10px;padding:10px;background:#111827;color:white;border:none;"
              >
                More
              </button>
            </td>
          </tr>
        `;
      })
      .join("");

    bindToggleEvents();
    bindLoginEvents();
    // ✅ no bindEditEvents anymore (replaced by modal)
  }

  // ---------- Toggle Events ----------
  function bindToggleEvents() {
    const toggles = tbody.querySelectorAll("input[type='checkbox']");
    toggles.forEach((toggle) => {
      toggle.addEventListener("change", async (e) => {
        const userId = e.target.dataset.userId;
        const newValue = e.target.checked;

        // IF DISABLING (turning OFF), show modal to get reason
        if (!newValue) {
          e.target.checked = true;

          currentToggleData = { userId, toggle: e.target };
          showReasonModal();
          return;
        }

        // IF ENABLING (turning ON), update directly
        e.target.disabled = true;

        try {
          await updateTransferPermission(userId, true, null);
          alert("Transfer enabled successfully!");
        } catch (err) {
          alert("Failed to update. Reverting.");
          e.target.checked = false;
        } finally {
          e.target.disabled = false;
        }
      });
    });
  }

  // ---------- Reason Modal ----------
  function showReasonModal() {
    const modal = document.getElementById("reasonModal");
    const reasonInput = document.getElementById("transferReasonInput");
    if (reasonInput) reasonInput.value = "";
    if (modal) modal.style.display = "flex";
  }

  function hideReasonModal() {
    const modal = document.getElementById("reasonModal");
    if (modal) modal.style.display = "none";
    currentToggleData = null;
  }

  document.getElementById("cancelReasonBtn")?.addEventListener("click", () => {
    hideReasonModal();
  });

  document
    .getElementById("submitReasonBtn")
    ?.addEventListener("click", async () => {
      const reasonInput = document.getElementById("transferReasonInput");
      const reason = (reasonInput?.value || "").trim();

      if (!reason) {
        alert("Please provide a reason for disabling transfers.");
        return;
      }

      if (!currentToggleData) return;

      const { userId, toggle } = currentToggleData;
      const submitBtn = document.getElementById("submitReasonBtn");

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = "Updating...";
      }

      try {
        await updateTransferPermission(userId, false, reason);
        toggle.checked = false;
        hideReasonModal();
      } catch (err) {
        alert("Failed to update: " + (err.message || "Unknown error"));
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = "Submit";
        }
      }
    });

  // async function updateTransferPermission(userId, allowed, reason) {
  //   const body = { isAllowedToTransfer: allowed };
  //   if (!allowed && reason) body.transferDisabledReason = reason;

  //   const res = await fetch(`/api/admin/users/${userId}/transfer`, {
  //     method: "PATCH",
  //     headers: { "Content-Type": "application/json" },
  //     body: JSON.stringify(body),
  //     credentials: "include",
  //   });

  //   const data = await res.json().catch(() => ({}));
  //   if (!res.ok) throw new Error(data.message || "Update failed");
  //   return data;
  // }

  // ---------- Login Events ----------
  

  async function updateTransferPermission(userId, allowed, reason) {
  const body = {
    isAllowedToTransfer: allowed,
    transferDisabledReason: allowed ? "" : (reason || ""),
  };

  const res = await fetch(`/api/admin/users/${userId}/transfer`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    credentials: "include",
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || "Update failed");
  return data;
}

  
  
  function bindLoginEvents() {
    const btns = tbody.querySelectorAll("[data-login-id]");
    btns.forEach((btn) => {
      btn.addEventListener("click", async () => {
        const userId = btn.dataset.loginId;

        const oldText = btn.textContent;
        btn.disabled = true;
        btn.textContent = "Logging in...";

        try {
          const res = await fetch(`/api/admin/users/${userId}/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
          });

          const data = await res.json().catch(() => ({}));
          if (!res.ok) throw new Error(data.message || "Login failed");

          if (data.redirectUrl) {
            window.location.href = data.redirectUrl;
            return;
          }

          window.location.href = "/en/account/myaccount/onlineacces";
        } catch (err) {
          alert(err.message || "Login failed");
          btn.disabled = false;
          btn.textContent = oldText;
        }
      });
    });
  }

  // ---------- More Actions Modal ----------
  function openMoreModal({ userId, name, email }) {
    activeUserId = userId;

    const modal = document.getElementById("moreActionsModal");
    const nameEl = document.getElementById("amUserName");
    const emailEl = document.getElementById("amUserEmail");

    if (nameEl) nameEl.textContent = name || "—";
    if (emailEl) emailEl.textContent = email || "—";

    if (modal) {
      modal.classList.remove("d-none");
      modal.setAttribute("aria-hidden", "false");
      document.body.style.overflow = "hidden";
    }
  }

  function closeMoreModal() {
    const modal = document.getElementById("moreActionsModal");
    if (modal) {
      modal.classList.add("d-none");
      modal.setAttribute("aria-hidden", "true");
      document.body.style.overflow = "";
    }
    activeUserId = null;
  }

  async function deleteUser(userId) {
    const res = await fetch(
      `/api/admin/user/delete?userId=${encodeURIComponent(userId)}`,
      {
        method: "DELETE",
        credentials: "include",
      },
    );

    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message || "Delete failed");
    return data;
  }

  function bindMoreModalEvents() {
    // open modal from table (event delegation)
    tbody.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-more-id]");
      if (!btn) return;

      openMoreModal({
        userId: btn.dataset.moreId,
        name: btn.dataset.moreName,
        email: btn.dataset.moreEmail,
      });
    });

    // close modal
    document.addEventListener("click", (e) => {
      if (e.target.closest("[data-am-close='1']")) closeMoreModal();
    });

    // escape close
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeMoreModal();
    });

    // route buttons
    document.getElementById("amEditBtn")?.addEventListener("click", () => {
      if (!activeUserId) return;
      window.location.href = `/admin/owner/dashboard/edit-user.html?userId=${encodeURIComponent(activeUserId)}`;
    });

    document.getElementById("amEmailBtn")?.addEventListener("click", () => {
      if (!activeUserId) return;
      window.location.href = `/admin/owner/dashboard/send-email-message.html?userId=${encodeURIComponent(activeUserId)}`;
    });

    document.getElementById("amTxBtn")?.addEventListener("click", () => {
      if (!activeUserId) return;
      window.location.href = `/admin/owner/dashboard/user-transactions.html?userId=${encodeURIComponent(activeUserId)}`;
    });

    // Add Transaction button
    document.getElementById("addTransactionBtn")?.addEventListener("click", () => {
      if (!activeUserId) return;
      window.location.href = `/admin/owner/dashboard/add-transaction.html?userId=${encodeURIComponent(activeUserId)}`;
    });

    // User Cross Border Transaction button
    document.getElementById("amCrossBorderTxBtn")?.addEventListener("click", () => {
      if (!activeUserId) return;
      window.location.href = `/admin/owner/dashboard/user-cross-border-transaction.html?userId=${encodeURIComponent(activeUserId)}`;
    });

     // Add Cross Border Transaction button
    document.getElementById("addCrossBorderTransactionBtn")?.addEventListener("click", () => {
      if (!activeUserId) return;
      window.location.href = `/admin/owner/dashboard/add-cross-border-transaction.html?userId=${encodeURIComponent(activeUserId)}`;
    });
  
  }

  // ---------- Fetch Users ----------
  async function fetchUsers() {
    try {
      const res = await fetch(API_URL, { credentials: "include" });
      const data = await res.json();
      allUsers = Array.isArray(data) ? data : data.users || [];
      render(allUsers);
    } catch (err) {
      tbody.innerHTML = `<tr><td colspan="5" style="color:red;">Error loading users: ${esc(err.message)}</td></tr>`;
    }
  }

  // init
  document.addEventListener("DOMContentLoaded", () => {
    bindMoreModalEvents();
    fetchUsers();
  });
})();
