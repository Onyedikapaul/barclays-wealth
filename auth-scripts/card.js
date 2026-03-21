(() => {
  const ENDPOINTS = {
    PROFILE: "/api/me",
    ACCOUNTS: "/api/accounts/mine",

    // we pass accountId so it loads card for selected account
    CARD: (accountId) =>
      `/api/cards/my-card?accountId=${encodeURIComponent(accountId)}`,

    SAVE_ADDRESS: "/api/me/address",
    ACTIVATE_CARD: "/api/cards/activate",
  };

  const $ = (s) => document.querySelector(s);

  const el = {
    form: $("#cardForm"),
    accountChosen: $("#accountChosen"),
    accountList: $("#accountList"),

    fullname: $("#fullname"),
    address: $("#address"),
    city: $("#city"),
    state: $("#state"),
    country: $("#Country"),

    cardNumber: $("#cardNumber"),
    cardHolder: $("#cardHolder"),
    cardExp: $("#cardExp"),

    result: $("#cardResult"),
    activateBtn: $("#activateCardBtn"),
  };

  const app = {
    accounts: [],
    selectedAccountId: null,
    user: null,
    card: null,
  };

  function escapeHtml(s) {
    return String(s ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function showMsg(type, msg) {
    if (!el.result) return;
    const cls =
      type === "success"
        ? "alert alert-success"
        : type === "warning"
          ? "alert alert-warning"
          : "alert alert-danger";
    el.result.innerHTML = `<div class="${cls}">${msg}</div>`;
  }

  function clearMsg() {
    if (el.result) el.result.innerHTML = "";
  }

  function setActivateLoading(loading) {
    if (!el.activateBtn) return;
    el.activateBtn.disabled = loading;
    el.activateBtn.innerHTML = loading
      ? `<span class="spinner-border spinner-border-sm mr-1"></span> Activating...`
      : "Activate Card";
  }

  function money(n, currency = "") {
    const num = Number(n || 0);
    return `${currency} ${num.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }

  async function api(url, options = {}) {
    const res = await fetch(url, {
      credentials: "include",
      headers: { Accept: "application/json", ...(options.headers || {}) },
      ...options,
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok)
      throw new Error(data.message || `Request failed (${res.status})`);
    return data;
  }

  // ---------- Accounts dropdown ----------
  function renderChosenAccount(acc) {
    if (!el.accountChosen) return;

    if (!acc) {
      el.accountChosen.innerHTML = `
        <div class="coin-item coin-btc">
          <div class="coin-icon"><em class="icon ni ni-sign-usd"></em></div>
          <div class="coin-info">
            <span class="coin-name">No Accounts</span>
            <span class="coin-text">Available Balance: --</span>
          </div>
        </div>`;
      return;
    }

    el.accountChosen.innerHTML = `
      <div class="coin-item coin-btc">
        <div class="coin-icon"><em class="icon ni ni-sign-usd"></em></div>
        <div class="coin-info">
          <span class="coin-name">${escapeHtml(acc.name)} (${escapeHtml(acc.currency)})</span>
          <span class="coin-text">Available Balance: ${escapeHtml(money(acc.availableBalance, acc.currency))}</span>
        </div>
      </div>
    `;
  }

  function renderAccountList(accounts) {
    if (!el.accountList) return;

    if (!accounts.length) {
      el.accountList.innerHTML = `
        <li class="buysell-cc-item">
          <div class="p-2 text-muted">No accounts found</div>
        </li>`;
      return;
    }

    el.accountList.innerHTML = accounts
      .map((acc) => {
        const active = acc._id === app.selectedAccountId ? "selected" : "";
        return `
          <li class="buysell-cc-item ${active}">
            <a href="#" class="buysell-cc-opt" data-account-id="${escapeHtml(acc._id)}">
              <div class="coin-item coin-btc">
                <div class="coin-icon"><em class="icon ni ni-sign-usd"></em></div>
                <div class="coin-info">
                  <span class="coin-name">${escapeHtml(acc.name)} (${escapeHtml(acc.currency)})</span>
                  <span class="coin-text">Available Balance: ${escapeHtml(money(acc.availableBalance, acc.currency))}</span>
                </div>
              </div>
            </a>
          </li>
        `;
      })
      .join("");

    el.accountList.querySelectorAll(".buysell-cc-opt").forEach((a) => {
      a.addEventListener("click", async (e) => {
        e.preventDefault();
        const id = a.getAttribute("data-account-id");
        const acc = app.accounts.find((x) => x._id === id);
        if (!acc) return;

        app.selectedAccountId = id;
        renderChosenAccount(acc);
        renderAccountList(app.accounts);

        // ✅ reload card for that account
        await loadCardForSelectedAccount();
      });
    });
  }

  // ---------- Card render ----------
  function renderCard(card, user) {
    const holder = user?.fullname || user?.name || "Customer";

    if (el.fullname) el.fullname.value = holder;
    if (el.cardHolder) el.cardHolder.textContent = holder;

    // backend returns last4 + exp (recommended)
    const last4 = card?.last4 ? String(card.last4) : "";
    const masked = last4 ? `**** **** **** ${last4}` : "**** **** **** ****";

    if (el.cardNumber) {
      el.cardNumber.innerHTML = masked
        .split(" ")
        .map((x) => `<div>${escapeHtml(x)}</div>`)
        .join("");
    }

    if (el.cardExp) el.cardExp.textContent = card?.exp || "MM/YY";

    // button state
    if (el.activateBtn) {
      if (card?.status === "active") {
        el.activateBtn.disabled = true;
        el.activateBtn.textContent = "Card Active";
      } else {
        el.activateBtn.disabled = false;
        el.activateBtn.textContent = "Activate Card";
      }
    }
  }

  // ---------- Address fill ----------
  function fillAddress(user) {
    const a = user?.address || {};
    if (el.address) el.address.value = a.addressLine || "";
    if (el.city) el.city.value = a.city || "";
    if (el.state) el.state.value = a.state || "";
    if (el.country) el.country.value = a.country || "";
  }

  // ---------- Save address (on submit) ----------
  async function saveAddress() {
    const payload = {
      addressLine: el.address?.value?.trim() || "",
      city: el.city?.value?.trim() || "",
      state: el.state?.value?.trim() || "",
      country: el.country?.value?.trim() || "",
    };

    if (!payload.addressLine) {
      showMsg("warning", "Address is required.");
      return;
    }

    await api(ENDPOINTS.SAVE_ADDRESS, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    showMsg("success", "Address updated successfully.");
  }

  // ---------- Card load per account ----------
  async function loadCardForSelectedAccount() {
    if (!app.selectedAccountId) return;

    try {
      const cardRes = await api(ENDPOINTS.CARD(app.selectedAccountId));
      app.card = cardRes.card || cardRes;
      renderCard(app.card, app.user);
    } catch (err) {
      console.error(err);
      showMsg("danger", escapeHtml(err.message));
    }
  }

  // ---------- Activate card ----------
  async function activateCard() {
    if (!app.selectedAccountId) {
      showMsg("warning", "Please select an account.");
      return;
    }

    setActivateLoading(true);
    try {
      const res = await api(ENDPOINTS.ACTIVATE_CARD, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountId: app.selectedAccountId }),
      });

      showMsg("success", res.message || "Card activated successfully.");

      // reload card to reflect status
      await loadCardForSelectedAccount();
    } catch (err) {
      console.error(err);
      showMsg("danger", escapeHtml(err.message));
    } finally {
      setActivateLoading(false);
    }
  }

  // ---------- init ----------
  async function init() {
    try {
      clearMsg();

      const [profileRes, accountsRes] = await Promise.all([
        api(ENDPOINTS.PROFILE),
        api(ENDPOINTS.ACCOUNTS),
      ]);

      app.user = profileRes.user || profileRes;
      app.accounts = accountsRes.accounts || accountsRes.data || [];

      // default selection
      if (app.accounts.length) {
        app.selectedAccountId = app.accounts[0]._id;
        renderChosenAccount(app.accounts[0]);
      } else {
        renderChosenAccount(null);
      }

      renderAccountList(app.accounts);
      fillAddress(app.user);

      // load card for selected account
      await loadCardForSelectedAccount();
    } catch (err) {
      console.error(err);
      showMsg("danger", escapeHtml(err.message));
    }
  }

  function bind() {
    if (el.form) {
      el.form.addEventListener("submit", async (e) => {
        e.preventDefault();
        clearMsg();
        try {
          await saveAddress();
        } catch (err) {
          console.error(err);
          showMsg("danger", escapeHtml(err.message));
        }
      });
    }

    if (el.activateBtn) {
      el.activateBtn.addEventListener("click", () => {
        clearMsg();
        activateCard();
      });
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    bind();
    init();
  });
})();
