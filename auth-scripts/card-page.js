(() => {
  // ====== EDIT THESE TO MATCH YOUR API ROUTES ======
  const API_ME = "/api/dashboard";
  const API_CARDS = "/api/cards/my"; // should return { cards: [...] } or { card: {...} }
  const API_ACTIVATE = (cardId) => `/api/cards/${cardId}/activate`;
  // =================================================

  // ---------- helpers ----------
  const $ = (id) => document.getElementById(id);

  function money(n) {
    const num = Number(n || 0);
    return num.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  function showResult(type, msg) {
    const mount = $("cardResult");
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
    const mount = $("cardResult");
    if (mount) mount.innerHTML = "";
  }

  async function api(url, opts = {}) {
    const res = await fetch(url, {
      credentials: "include", // important if you use httpOnly cookie auth
      headers: { "Content-Type": "application/json", ...(opts.headers || {}) },
      ...opts,
    });

    let data = null;
    try {
      data = await res.json();
    } catch (_) {}

    if (!res.ok) {
      const msg =
        data?.message || data?.error || `Request failed (${res.status})`;
      throw new Error(msg);
    }
    return data;
  }

  // ---------- state ----------
  let user = null;
  let cards = [];
  let selectedAccount = null; // {accountNumber, accounttype, accountBalance}
  let selectedCard = null; // { _id, last4, expMonth, expYear, status, brand, ... }

  // ---------- renderers ----------
  function renderUser() {
    if (!user) return;

    const full =
      `${user.firstname || ""} ${user.middlename || ""} ${user.lastname || ""}`
        .replace(/\s+/g, " ")
        .trim();
    if ($("fullname")) $("fullname").value = full;
    if ($("address")) $("address").value = user.address || "";
    if ($("city")) $("city").value = user.city || "";
    if ($("state")) $("state").value = user.state || "";
    if ($("Country")) $("Country").value = user.country || "";

    if ($("cardHolder")) $("cardHolder").textContent = full || "Customer";
  }

  function renderAccountChosen() {
    // your top dropdown "chosen" display
    const typeEl = document.querySelector(".user-account-type");
    const balEl = document.querySelector(".user-account-balance");

    if (!selectedAccount) {
      if (typeEl) typeEl.textContent = "Select account";
      if (balEl) balEl.textContent = money(0);
      return;
    }

    if (typeEl) typeEl.textContent = selectedAccount.accounttype || "Account";
    if (balEl) balEl.textContent = money(selectedAccount.accountBalance || 0);
  }

  function renderAccountList(accounts = []) {
    const ul = $("accountList");
    if (!ul) return;

    ul.innerHTML = accounts
      .map((a) => {
        const label = `${a.accounttype || "Account"} • ${a.accountNumber || ""}`;
        const bal = money(a.accountBalance || 0);
        return `
          <li class="buysell-cc-item">
            <a href="#" class="buysell-cc-opt" data-acct="${a.accountNumber}">
              <div class="coin-item">
                <div class="coin-info">
                  <span class="coin-name">${label}</span>
                  <span class="coin-text">Available Balance: ${bal}</span>
                </div>
              </div>
            </a>
          </li>
        `;
      })
      .join("");

    ul.addEventListener(
      "click",
      (e) => {
        const a = e.target.closest("a[data-acct]");
        if (!a) return;
        e.preventDefault();

        const acct = a.getAttribute("data-acct");
        selectedAccount =
          accounts.find((x) => x.accountNumber === acct) || null;

        // choose a card for that account if you have multiple cards
        pickCardForSelectedAccount();

        renderAccountChosen();
        renderCardUI();
        clearResult();
      },
      { once: true },
    );
  }

  function maskCard(last4) {
    // show **** **** **** 1234
    const l4 = String(last4 || "0000")
      .padStart(4, "0")
      .slice(-4);
    return [`****`, `****`, `****`, l4];
  }

  function formatExp(m, y) {
    const mm = String(m || "").padStart(2, "0") || "MM";
    const yy = y ? String(y).slice(-2) : "YY";
    return `${mm}/${yy}`;
  }

  function renderCardUI() {
    // pick from selectedCard; if none, show masked blanks
    const numEl = $("cardNumber");
    const expEl = $("cardExp");

    if (!selectedCard) {
      if (numEl)
        numEl.innerHTML = `<div>****</div><div>****</div><div>****</div><div>****</div>`;
      if (expEl) expEl.textContent = "MM/YY";
      setActivateButtonState(null);
      return;
    }

    const parts = maskCard(selectedCard.last4);
    if (numEl) numEl.innerHTML = parts.map((p) => `<div>${p}</div>`).join("");
    if (expEl)
      expEl.textContent = formatExp(
        selectedCard.expMonth,
        selectedCard.expYear,
      );

    setActivateButtonState(selectedCard.status);
  }

  function setActivateButtonState(status) {
    const btn = $("activateCardBtn");
    if (!btn) return;

    if (!selectedCard) {
      btn.disabled = true;
      btn.textContent = "Activate Card";
      return;
    }

    if (status === "active") {
      btn.disabled = true;
      btn.textContent = "Card Active";
      return;
    }

    if (status === "blocked") {
      btn.disabled = true;
      btn.textContent = "Card Blocked";
      return;
    }

    // inactive
    btn.disabled = false;
    btn.textContent = "Activate Card";
  }

  function pickCardForSelectedAccount() {
    if (!selectedAccount) {
      selectedCard = cards[0] || null;
      return;
    }

    // choose first card for that accountNumber
    selectedCard =
      cards.find((c) => c.accountNumber === selectedAccount.accountNumber) ||
      null;

    // fallback
    if (!selectedCard) selectedCard = cards[0] || null;
  }

  // ---------- activation ----------
  async function activateSelectedCard() {
    if (!selectedCard?._id) return;

    const btn = $("activateCardBtn");
    if (btn) btn.disabled = true;

    clearResult();
    showResult("warning", "Activating card...");

    try {
      const data = await api(API_ACTIVATE(selectedCard._id), {
        method: "PATCH",
        body: JSON.stringify({ status: "active" }), // optional; backend can ignore
      });

      // backend might return updated card
      const updated = data.card || data.updatedCard || null;
      if (updated) {
        // update local list
        cards = cards.map((c) =>
          String(c._id) === String(updated._id) ? updated : c,
        );
        selectedCard = updated;
      } else {
        // if backend doesn't return card, update locally
        selectedCard.status = "active";
        cards = cards.map((c) =>
          String(c._id) === String(selectedCard._id) ? selectedCard : c,
        );
      }

      renderCardUI();
      showResult("success", "Card activated successfully.");
    } catch (err) {
      showResult("danger", err.message || "Activation failed.");
      // re-enable if still inactive
      setActivateButtonState(selectedCard.status);
    }
  }

  // ---------- init ----------
  async function init() {
    try {
      // 1) fetch user
      const me = await api(API_ME);
      user = me.user || me;

      renderUser();

      // accounts (depends on your API structure)
      const accounts =
        me.accounts ||
        user.accounts ||
        [
          // fallback: use user's own account info if you store only one
          {
            accountNumber: user.accountNumber,
            accounttype: user.accounttype,
            accountBalance: user.accountBalance,
          },
        ].filter(Boolean);

      // default account
      selectedAccount = accounts[0] || null;
      renderAccountList(accounts);
      renderAccountChosen();

      // 2) fetch cards
      const cardRes = await api(API_CARDS);
      cards = cardRes.cards || (cardRes.card ? [cardRes.card] : []) || [];

      // choose card for selected account
      pickCardForSelectedAccount();
      renderCardUI();

      // button handler
      const btn = $("activateCardBtn");
      if (btn) btn.addEventListener("click", activateSelectedCard);

      if (!selectedCard) {
        showResult("warning", "No card found for this account yet.");
      }
    } catch (err) {
      showResult("danger", err.message || "Failed to load card details.");
      // also disable button
      setActivateButtonState(null);
    }
  }

  document.addEventListener("DOMContentLoaded", init);
})();
