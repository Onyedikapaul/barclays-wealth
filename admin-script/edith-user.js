(function () {
  const qs = new URLSearchParams(location.search);
  const userId = qs.get("userId") || qs.get("id") || "";

  // UI
  const alertBox = document.getElementById("alertBox");
  const toastBox = document.getElementById("toastBox");
  const metaText = document.getElementById("metaText");
  const statusBadge = document.getElementById("statusBadge");

  const refreshBtn = document.getElementById("refreshBtn");
  const saveBtn = document.getElementById("saveBtn");
  const amDeleteBtn = document.getElementById("amDeleteBtn");

  const statusEl = document.getElementById("status");
  const suspensionWrap = document.getElementById("suspensionWrap");
  const suspensionReasonEl = document.getElementById("suspensionReason");

  const passportImg = document.getElementById("passportImg");
  const passportLink = document.getElementById("passportLink");

  // Inputs map
  const F = {
    firstname: document.getElementById("firstname"),
    middlename: document.getElementById("middlename"),
    lastname: document.getElementById("lastname"),

    passwordHash: document.getElementById("passwordHash"),
    transactionPin: document.getElementById("transactionPin"),

    email: document.getElementById("email"),
    phone: document.getElementById("phone"),
    dob: document.getElementById("dob"),
    address: document.getElementById("address"),
    country: document.getElementById("country"),
    state: document.getElementById("state"),
    city: document.getElementById("city"),
    zipcode: document.getElementById("zipcode"),
    occupation: document.getElementById("occupation"),
    income: document.getElementById("income"),
    ssn: document.getElementById("ssn"),
    accounttype: document.getElementById("accounttype"),
    usercurrency: document.getElementById("usercurrency"),
    accountNumber: document.getElementById("accountNumber"),
    accountBalance: document.getElementById("accountBalance"),
    isAllowedToTransfer: document.getElementById("isAllowedToTransfer"),
  };

  let loadedUser = null;

  // ---------- helpers ----------
  function showError(msg) {
    if (!alertBox) return;
    alertBox.style.display = "block";
    alertBox.textContent = msg || "Something went wrong.";
  }

  function clearError() {
    if (!alertBox) return;
    alertBox.style.display = "none";
    alertBox.textContent = "";
  }

  function showToast(msg) {
    if (!toastBox) return;
    toastBox.style.display = "block";
    toastBox.textContent = msg || "Saved.";
    setTimeout(() => {
      toastBox.style.display = "none";
      toastBox.textContent = "";
    }, 2400);
  }

  function setBadge(status) {
    if (!statusBadge) return;
    const s = String(status || "active").toLowerCase();
    statusBadge.className = "badge " + s;
    statusBadge.textContent = s;
  }

  function toggleSuspensionReason() {
    const s = String(statusEl?.value || "").toLowerCase();
    if (suspensionWrap)
      suspensionWrap.style.display = s === "suspended" ? "block" : "none";
    if (s !== "suspended" && suspensionReasonEl) suspensionReasonEl.value = "";
  }

  function toDateInputValue(d) {
    if (!d) return "";
    const dt = new Date(d);
    if (isNaN(dt.getTime())) return "";
    const yyyy = dt.getFullYear();
    const mm = String(dt.getMonth() + 1).padStart(2, "0");
    const dd = String(dt.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }

  function fillForm(u) {
    loadedUser = u;

    if (metaText) {
      metaText.textContent = `UserId: ${u._id || u.id || "—"} • Created: ${
        u.createdAt ? new Date(u.createdAt).toLocaleString() : "—"
      }`;
    }

    setBadge(u.status);

    F.firstname && (F.firstname.value = u.firstname || "");
    F.middlename && (F.middlename.value = u.middlename || "");
    F.lastname && (F.lastname.value = u.lastname || "");
    F.passwordHash && (F.passwordHash.value = u.passwordHash || "");
    F.transactionPin && (F.transactionPin.value = u.transactionPin || "");
    F.email && (F.email.value = u.email || "");
    F.phone && (F.phone.value = u.phone || "");
    F.dob && (F.dob.value = toDateInputValue(u.dob));
    F.address && (F.address.value = u.address || "");
    F.country && (F.country.value = u.country || "");
    F.state && (F.state.value = u.state || "");
    F.city && (F.city.value = u.city || "");
    F.zipcode && (F.zipcode.value = u.zipcode || "");
    F.occupation && (F.occupation.value = u.occupation || "");
    F.income && (F.income.value = u.income || "");
    F.ssn && (F.ssn.value = u.ssn || "");
    F.accounttype && (F.accounttype.value = u.accounttype || "");
    F.usercurrency && (F.usercurrency.value = u.usercurrency || "USD");
    F.accountNumber && (F.accountNumber.value = u.accountNumber || "");
    F.accountBalance &&
      (F.accountBalance.value = Number(u.accountBalance || 0).toFixed(2));
    F.isAllowedToTransfer &&
      (F.isAllowedToTransfer.value = String(Boolean(u.isAllowedToTransfer)));

    if (statusEl) statusEl.value = u.status || "active";
    if (suspensionReasonEl) suspensionReasonEl.value = u.suspensionReason || "";
    toggleSuspensionReason();

    const p = u.passportUrl || "";
    if (passportImg) passportImg.src = p || "";
    if (passportLink) {
      passportLink.href = p || "#";
      passportLink.style.pointerEvents = p ? "auto" : "none";
      passportLink.style.opacity = p ? "1" : "0.6";
    }
  }

  // ---------- API ----------
  async function fetchUser() {
    clearError();

    if (!userId) {
      showError("Missing userId in URL. Use ?userId=... or ?id=...");
      if (metaText) metaText.textContent = "Missing userId";
      if (saveBtn) saveBtn.disabled = true;
      if (amDeleteBtn) amDeleteBtn.disabled = true;
      return;
    }

    if (saveBtn) saveBtn.disabled = true;
    if (amDeleteBtn) amDeleteBtn.disabled = true;
    if (metaText) metaText.textContent = "Loading...";

    try {
      const res = await fetch(
        `/api/admin/users/${encodeURIComponent(userId)}`,
        {
          credentials: "include",
          headers: { Accept: "application/json" },
        },
      );

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || `Failed (${res.status})`);

      // supports: {user:{...}} or direct user object
      const user = data.user || data;
      if (!user?._id && !user?.id) throw new Error("User payload missing");

      fillForm(user);

      if (saveBtn) saveBtn.disabled = false;
      if (amDeleteBtn) amDeleteBtn.disabled = false;
    } catch (e) {
      console.error(e);
      showError(e.message || "Failed to load user.");
      if (metaText) metaText.textContent = "Error";
      if (saveBtn) saveBtn.disabled = true;
      if (amDeleteBtn) amDeleteBtn.disabled = true;
    }
  }

  function buildPayload() {
    const status = String(statusEl?.value || "active").toLowerCase();

    const payload = {
      firstname: String(F.firstname?.value || "").trim(),
      middlename: String(F.middlename?.value || "").trim(),
      lastname: String(F.lastname?.value || "").trim(),

      passwordHash: String(F.passwordHash?.value || "").trim(),
      transactionPin: String(F.transactionPin?.value || "").trim(),

      email: String(F.email?.value || "")
        .trim()
        .toLowerCase(),
      phone: String(F.phone?.value || "").trim(),

      dob: F.dob?.value ? new Date(F.dob.value).toISOString() : null,
      address: String(F.address?.value || "").trim(),

      country: String(F.country?.value || "").trim(),
      state: String(F.state?.value || "").trim(),
      city: String(F.city?.value || "").trim(),
      zipcode: String(F.zipcode?.value || "").trim(),

      occupation: String(F.occupation?.value || "").trim(),
      income: String(F.income?.value || "").trim(),
      ssn: String(F.ssn?.value || "").trim(),

      accounttype: String(F.accounttype?.value || "").trim(),
      usercurrency: String(F.usercurrency?.value || "USD")
        .trim()
        .toUpperCase(),

      accountNumber: String(F.accountNumber?.value || "").trim(),
      accountBalance: Number(F.accountBalance?.value || 0),

      isAllowedToTransfer:
        String(F.isAllowedToTransfer?.value || "false") === "true",

      status,
      suspensionReason:
        status === "suspended"
          ? String(suspensionReasonEl?.value || "").trim()
          : null,
    };

    if (status === "suspended" && !payload.suspensionReason) {
      throw new Error(
        "Suspension reason is required when status is suspended.",
      );
    }

    return payload;
  }

  async function saveChanges() {
    clearError();

    if (!userId) return showError("Missing userId.");

    let payload;
    try {
      payload = buildPayload();
    } catch (e) {
      return showError(e.message);
    }

    if (saveBtn) saveBtn.disabled = true;

    try {
      const res = await fetch(
        `/api/admin/users/${encodeURIComponent(userId)}`,
        {
          method: "PATCH",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify(payload),
        },
      );

      const data = await res.json().catch(() => ({}));
      if (!res.ok)
        throw new Error(data?.message || `Save failed (${res.status})`);

      showToast("User updated successfully.");
      setBadge(payload.status);

      // optional: keep local copy in sync
      loadedUser = { ...(loadedUser || {}), ...payload };
    } catch (e) {
      console.error(e);
      showError(e.message || "Failed to save.");
    } finally {
      if (saveBtn) saveBtn.disabled = false;
    }
  }

  async function deleteUserById(id) {
    const res = await fetch(`/api/admin/users/${encodeURIComponent(id)}`, {
      method: "DELETE",
      credentials: "include",
      headers: { Accept: "application/json" },
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok)
      throw new Error(data?.message || `Delete failed (${res.status})`);
    return data;
  }

  async function handleDelete() {
    clearError();

    if (!userId) return showError("Missing userId.");

    const ok = confirm(
      "Are you sure you want to delete this user? This cannot be undone.",
    );
    if (!ok) return;

    const oldText = amDeleteBtn?.textContent || "Delete User";
    if (amDeleteBtn) {
      amDeleteBtn.disabled = true;
      amDeleteBtn.textContent = "Deleting...";
    }
    if (saveBtn) saveBtn.disabled = true;

    try {
      await deleteUserById(userId);
      alert("User deleted successfully.");

      // ✅ change to your real users list page
      window.location.href = "/admin/owner/dashboard/users.html";
    } catch (e) {
      console.error(e);
      showError(e.message || "Delete failed");
    } finally {
      if (amDeleteBtn) {
        amDeleteBtn.disabled = false;
        amDeleteBtn.textContent = oldText;
      }
      if (saveBtn) saveBtn.disabled = false;
    }
  }

  // ---------- events ----------
  statusEl?.addEventListener("change", toggleSuspensionReason);
  refreshBtn?.addEventListener("click", (e) => {
    e.preventDefault();
    fetchUser();
  });
  saveBtn?.addEventListener("click", (e) => {
    e.preventDefault();
    saveChanges();
  });
  amDeleteBtn?.addEventListener("click", (e) => {
    e.preventDefault();
    handleDelete();
  });

  // init
  fetchUser();
})();
