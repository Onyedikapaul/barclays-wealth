(() => {
  // ======================
  // CONFIG (edit later)
  // ======================
  const ENDPOINTS = {
    GET_SETTINGS: "/api/account/security-settings", // GET
    UPDATE_SETTINGS: "/api/account/security-settings", // PATCH
  };

  const $ = (sel) => document.querySelector(sel);

  function escapeHtml(s) {
    return String(s ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function showMsg(type, msg) {
    const mount = $("#securitySettingsResult");
    if (!mount) return;

    const cls =
      type === "success"
        ? "alert alert-success"
        : type === "warning"
          ? "alert alert-warning"
          : "alert alert-danger";

    mount.innerHTML = `<div class="${cls}">${msg}</div>`;
  }

  function clearMsg() {
    const mount = $("#securitySettingsResult");
    if (mount) mount.innerHTML = "";
  }

  function setDisabled(disabled) {
    const a = $("#activity-log");
    const p = $("#security-pin");
    if (a) a.disabled = disabled;
    if (p) p.disabled = disabled;
  }

  async function getSettings() {
    const res = await fetch(ENDPOINTS.GET_SETTINGS, {
      method: "GET",
      headers: { Accept: "application/json" },
      credentials: "include",
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message || "Failed to load settings");
    return data;
  }

  async function updateSettings(patch) {
    const res = await fetch(ENDPOINTS.UPDATE_SETTINGS, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(patch),
      credentials: "include",
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message || "Failed to update settings");
    return data;
  }

  function applySettings(resp) {
    const s = resp.settings || resp;

    const activity = $("#activity-log");
    const pin = $("#security-pin");

    if (activity && typeof s.saveActivityLogs === "boolean") {
      activity.checked = s.saveActivityLogs;
    }

    if (pin && typeof s.securityPinEnabled === "boolean") {
      pin.checked = s.securityPinEnabled;
    }
  }

  function bindSwitches() {
    const activity = $("#activity-log");
    const pin = $("#security-pin");

    if (activity) {
      activity.addEventListener("change", async () => {
        const next = activity.checked;
        const prev = !next;

        clearMsg();
        setDisabled(true);

        try {
          await updateSettings({ saveActivityLogs: next });
          showMsg("success", "Activity log setting updated.");
        } catch (err) {
          console.error(err);
          activity.checked = prev; // rollback
          showMsg("danger", escapeHtml(err.message));
        } finally {
          setDisabled(false);
        }
      });
    }

    if (pin) {
      pin.addEventListener("change", async () => {
        const next = pin.checked;
        const prev = !next;

        clearMsg();
        setDisabled(true);

        try {
          // Later we can add: if next===true open modal to set pin
          await updateSettings({ securityPinEnabled: next });
          showMsg("success", "Security PIN setting updated.");
        } catch (err) {
          console.error(err);
          pin.checked = prev; // rollback
          showMsg("danger", escapeHtml(err.message));
        } finally {
          setDisabled(false);
        }
      });
    }
  }

  async function init() {
    try {
      clearMsg();
      setDisabled(true);

      const data = await getSettings();
      applySettings(data);

      setDisabled(false);
    } catch (err) {
      console.error(err);
      showMsg("danger", escapeHtml(err.message));
      setDisabled(false);
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    bindSwitches();
    init();
  });
})();
