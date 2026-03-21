(function () {
  function money(n) {
    const num = Number(n || 0);
    return num.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  function sumFlow(list) {
    let credit = 0;
    let debit = 0;

    for (const t of list) {
      const amt = Number(t.amount || 0);
      const type = String(t.type || "").toLowerCase();
      // supports: "credit"/"debit" OR "cr"/"dr" OR "in"/"out"
      if (type === "credit" || type === "cr" || type === "in") credit += amt;
      if (type === "debit" || type === "dr" || type === "out") debit += amt;
    }
    return { credit, debit };
  }

  function renderBalanceFlow({ credit, debit, currency = "USD" }) {
    const mount = document.getElementById("balanceFlowMount");
    if (!mount) return;

    const total = credit + debit;
    const creditPct = total > 0 ? (credit / total) * 100 : 50;
    const debitPct = 100 - creditPct;
    const creditDeg = (creditPct / 100) * 360;

    mount.innerHTML = `
      <div class="balance-flow">
        <div class="balance-flow__donut" id="balanceDonut">
          <div class="balance-flow__center">
            <div>
              <div style="font-size:12px;color:#526484;">Total</div>
              <div style="font-size:14px;">${money(total)} ${currency}</div>
            </div>
          </div>
        </div>

        <div class="balance-flow__meta">
          <div class="flow-item">
            <span class="flow-dot credit"></span>
            <div>
              <div class="flow-label">Credit</div>
              <div class="flow-value">${money(credit)} ${currency}</div>
            </div>
          </div>

          <div class="flow-item">
            <span class="flow-dot debit"></span>
            <div>
              <div class="flow-label">Debit</div>
              <div class="flow-value">${money(debit)} ${currency}</div>
            </div>
          </div>

          <div class="flow-label">${Math.round(creditPct)}% credit • ${Math.round(debitPct)}% debit</div>
        </div>
      </div>
    `;

    const donut = document.getElementById("balanceDonut");
    if (donut) {
      donut.style.background = `conic-gradient(#1ee0ac 0deg ${creditDeg}deg, #f4aaa4 ${creditDeg}deg 360deg)`;
    }
  }

  // ✅ fetch real transactions from your API
  async function fetchTransactions() {
    // if you store token somewhere else, adjust this
    const token =
      localStorage.getItem("token") ||
      localStorage.getItem("accessToken") ||
      sessionStorage.getItem("token");

    // optional accountId from URL: ?accountId=123
    const params = new URLSearchParams(window.location.search);
    const accountId = params.get("accountId");

    const url = accountId
      ? `/api/transactions?accountId=${encodeURIComponent(accountId)}`
      : `/api/transactions`;

    const res = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      throw new Error(`Transactions fetch failed (${res.status}): ${txt}`);
    }

    const data = await res.json();

    // supports different backend shapes:
    // { transactions: [...] } OR { data: [...] } OR [...]
    const list = Array.isArray(data) ? data : data.transactions || data.data || [];

    // normalize fields to what sumFlow expects
    return list.map((t) => ({
      type: t.type || t.txnType || t.direction, // your backend may use "direction"
      amount: t.amount || t.amt || t.value,
    }));
  }

  async function init() {
    try {
      const txns = await fetchTransactions();

      const { credit, debit } = sumFlow(txns);

      // currency: use API value if you return it, else fallback USD
      renderBalanceFlow({ credit, debit, currency: "USD" });
    } catch (err) {
      console.error(err);
      // fallback: show empty but still render UI
      renderBalanceFlow({ credit: 0, debit: 0, currency: "USD" });
    }
  }

  document.addEventListener("DOMContentLoaded", init);
})();
