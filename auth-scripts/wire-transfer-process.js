// // (function () {
// //   const $ = (id) => document.getElementById(id);

// //   function showWireResult(type, msg) {
// //     const mount = document.querySelector(".wireResult");
// //     if (!mount) return;
// //     const cls = type === "success" ? "alert alert-success"
// //       : type === "warning" ? "alert alert-warning"
// //       : "alert alert-danger";
// //     mount.innerHTML = `<div class="${cls}">${msg}</div>`;
// //   }

// //   function clearWireResult() {
// //     const mount = document.querySelector(".wireResult");
// //     if (mount) mount.innerHTML = "";
// //   }

// //   function setBtnLoading(btn, loading, loadText = "Processing...") {
// //     if (!btn) return;
// //     btn.disabled = !!loading;
// //     btn.dataset.originalText = btn.dataset.originalText || btn.innerHTML;
// //     btn.innerHTML = loading ? loadText : btn.dataset.originalText;
// //   }

// //   function money(n) {
// //     return Number(n || 0).toLocaleString("en-US", {
// //       minimumFractionDigits: 2, maximumFractionDigits: 2,
// //     });
// //   }

// //   function clearForm() {
// //     [
// //       "fullname", "countryId", "type",
// //       "iban", "swiftcode", "accountnumber", "bankname",
// //       "amount", "transactionPin", "description",
// //     ].forEach((id) => {
// //       const el = $(id);
// //       if (el) el.value = "";
// //     });
// //   }

// //   // ── OTP Modal ──────────────────────────────────────────────────────────────
// //   function injectOtpModal() {
// //     if (document.getElementById("wireOtpOverlay")) return;

// //     const overlay = document.createElement("div");
// //     overlay.id = "wireOtpOverlay";
// //     overlay.style.cssText = `
// //       position:fixed;inset:0;z-index:10000;
// //       background:rgba(0,0,0,0.5);backdrop-filter:blur(4px);
// //       display:none;align-items:center;justify-content:center;padding:16px;
// //     `;
// //     overlay.innerHTML = `
// //       <style>
// //         @keyframes otpIn {
// //           from{opacity:0;transform:scale(0.95) translateY(10px)}
// //           to{opacity:1;transform:scale(1) translateY(0)}
// //         }
// //         .otp-modal {
// //           background:#fff;border-radius:20px;width:100%;max-width:420px;
// //           box-shadow:0 24px 64px rgba(0,0,0,0.22);
// //           animation:otpIn 0.22s ease;overflow:hidden;
// //         }
// //         .otp-header {
// //           background:#033d75;padding:22px 24px 18px;
// //           display:flex;align-items:flex-start;justify-content:space-between;
// //         }
// //         .otp-header h3 { color:#fff;font-size:15px;font-weight:700;margin:0; }
// //         .otp-header p  { color:rgba(255,255,255,0.6);font-size:12px;margin:4px 0 0; }
// //         .otp-close {
// //           background:rgba(255,255,255,0.12);border:none;border-radius:8px;
// //           color:#fff;width:30px;height:30px;cursor:pointer;font-size:16px;
// //           display:flex;align-items:center;justify-content:center;flex-shrink:0;
// //         }
// //         .otp-close:hover { background:rgba(255,255,255,0.22); }
// //         .otp-body { padding:24px; }
// //         .otp-icon {
// //           width:54px;height:54px;border-radius:50%;
// //           background:#eff6ff;display:flex;align-items:center;justify-content:center;
// //           margin:0 auto 14px;font-size:22px;
// //         }
// //         .otp-desc {
// //           text-align:center;font-size:13px;color:#64748b;
// //           margin-bottom:20px;line-height:1.55;
// //         }
// //         .otp-desc strong { color:#0f1a2e; }
// //         .otp-inputs {
// //           display:flex;gap:10px;justify-content:center;margin-bottom:18px;
// //         }
// //         .otp-inputs input {
// //           width:46px;height:54px;border:2px solid #dde4f0;border-radius:12px;
// //           text-align:center;font-size:22px;font-weight:700;color:#033d75;
// //           font-family:inherit;outline:none;
// //           transition:border-color 0.2s,box-shadow 0.2s;
// //           background:#fafbfe;
// //         }
// //         .otp-inputs input:focus {
// //           border-color:#033d75;
// //           box-shadow:0 0 0 3px rgba(3,61,117,0.1);
// //           background:#fff;
// //         }
// //         .otp-inputs input.filled { border-color:#033d75;background:#fff; }
// //         .otp-result { margin-bottom:14px;min-height:36px; }
// //         .otp-result .alert { padding:10px 14px;border-radius:10px;font-size:13px;font-weight:500; }
// //         .otp-submit {
// //           width:100%;height:48px;background:#033d75;color:#fff;border:none;
// //           border-radius:12px;font-family:inherit;font-size:14px;font-weight:700;
// //           cursor:pointer;transition:opacity 0.2s;
// //           display:flex;align-items:center;justify-content:center;gap:8px;
// //         }
// //         .otp-submit:hover { opacity:0.88; }
// //         .otp-submit:disabled { opacity:0.55;cursor:not-allowed; }
// //         .otp-resend {
// //           text-align:center;margin-top:14px;font-size:12.5px;color:#94a3b8;
// //         }
// //         .otp-resend button {
// //           background:none;border:none;color:#033d75;font-weight:600;
// //           cursor:pointer;font-family:inherit;font-size:12.5px;padding:0;
// //         }
// //         .otp-resend button:disabled { color:#94a3b8;cursor:default; }
// //       </style>
// //       <div class="otp-modal">
// //         <div class="otp-header">
// //           <div>
// //             <h3>Verify Your Identity</h3>
// //             <p>We sent a 6-digit code to your email</p>
// //           </div>
// //           <button class="otp-close" id="otpCloseBtn">✕</button>
// //         </div>
// //         <div class="otp-body">
// //           <div class="otp-icon">📧</div>
// //           <p class="otp-desc">
// //             Enter the <strong>6-digit code</strong> sent to your registered email address to authorize this transfer.
// //           </p>
// //           <div class="otp-inputs" id="otpInputs">
// //             <input type="text" inputmode="numeric" maxlength="1" data-idx="0">
// //             <input type="text" inputmode="numeric" maxlength="1" data-idx="1">
// //             <input type="text" inputmode="numeric" maxlength="1" data-idx="2">
// //             <input type="text" inputmode="numeric" maxlength="1" data-idx="3">
// //             <input type="text" inputmode="numeric" maxlength="1" data-idx="4">
// //             <input type="text" inputmode="numeric" maxlength="1" data-idx="5">
// //           </div>
// //           <div class="otp-result" id="otpResult"></div>
// //           <button class="otp-submit" id="otpSubmitBtn">
// //             <i class="fa-solid fa-shield-check"></i> Verify & Send Transfer
// //           </button>
// //           <div class="otp-resend">
// //             Didn't receive it?
// //             <button id="otpResendBtn">Resend code</button>
// //             <span id="otpResendTimer"></span>
// //           </div>
// //         </div>
// //       </div>
// //     `;
// //     document.body.appendChild(overlay);

// //     // ── OTP digit inputs ──
// //     const inputs = overlay.querySelectorAll(".otp-inputs input");
// //     inputs.forEach((inp, i) => {
// //       inp.addEventListener("input", (e) => {
// //         const val = e.target.value.replace(/\D/g, "");
// //         e.target.value = val ? val[0] : "";
// //         if (val && i < inputs.length - 1) inputs[i + 1].focus();
// //         inp.classList.toggle("filled", !!inp.value);
// //       });
// //       inp.addEventListener("keydown", (e) => {
// //         if (e.key === "Backspace" && !inp.value && i > 0) inputs[i - 1].focus();
// //       });
// //       inp.addEventListener("paste", (e) => {
// //         e.preventDefault();
// //         const pasted = (e.clipboardData || window.clipboardData)
// //           .getData("text").replace(/\D/g, "").slice(0, 6);
// //         pasted.split("").forEach((ch, j) => {
// //           if (inputs[j]) { inputs[j].value = ch; inputs[j].classList.add("filled"); }
// //         });
// //         if (inputs[Math.min(pasted.length, inputs.length) - 1])
// //           inputs[Math.min(pasted.length, inputs.length) - 1].focus();
// //       });
// //     });

// //     document.getElementById("otpCloseBtn").addEventListener("click", closeOtpModal);
// //     overlay.addEventListener("click", (e) => { if (e.target === overlay) closeOtpModal(); });

// //     // ── OTP submit ──
// //     document.getElementById("otpSubmitBtn").addEventListener("click", handleOtpSubmit);

// //     // ── Resend ──
// //     document.getElementById("otpResendBtn").addEventListener("click", async () => {
// //       clearOtpResult();
// //       clearOtpInputs();
// //       try {
// //         const res  = await fetch("/api/wire-transfer/send-otp", {
// //           method: "POST",
// //           headers: { "Content-Type": "application/json" },
// //           credentials: "include",
// //         });
// //         const data = await res.json().catch(() => ({}));
// //         if (!res.ok) return showOtpResult("danger", data?.message || "Failed to resend code.");
// //         showOtpResult("success", "A new code has been sent to your email.");
// //         startResendTimer();
// //       } catch {
// //         showOtpResult("danger", "Network error. Try again.");
// //       }
// //     });
// //   }

// //   function getOtpValue() {
// //     return Array.from(document.querySelectorAll(".otp-inputs input"))
// //       .map(i => i.value).join("");
// //   }

// //   function clearOtpInputs() {
// //     document.querySelectorAll(".otp-inputs input").forEach(i => {
// //       i.value = ""; i.classList.remove("filled");
// //     });
// //     document.querySelectorAll(".otp-inputs input")[0]?.focus();
// //   }

// //   function showOtpResult(type, msg) {
// //     const el = document.getElementById("otpResult");
// //     if (!el) return;
// //     const cls = type === "success" ? "alert alert-success"
// //       : type === "warning" ? "alert alert-warning"
// //       : "alert alert-danger";
// //     el.innerHTML = `<div class="${cls}">${msg}</div>`;
// //   }

// //   function clearOtpResult() {
// //     const el = document.getElementById("otpResult");
// //     if (el) el.innerHTML = "";
// //   }

// //   function openOtpModal() {
// //     injectOtpModal();
// //     const overlay = document.getElementById("wireOtpOverlay");
// //     overlay.style.display = "flex";
// //     document.body.style.overflow = "hidden";
// //     clearOtpInputs();
// //     clearOtpResult();
// //     document.querySelectorAll(".otp-inputs input")[0]?.focus();
// //     startResendTimer();
// //   }

// //   function closeOtpModal() {
// //     const overlay = document.getElementById("wireOtpOverlay");
// //     if (overlay) overlay.style.display = "none";
// //     document.body.style.overflow = "";
// //   }

// //   // ── Resend countdown ──
// //   let resendTimer = null;
// //   function startResendTimer(seconds = 60) {
// //     const btn   = document.getElementById("otpResendBtn");
// //     const timer = document.getElementById("otpResendTimer");
// //     if (!btn || !timer) return;
// //     btn.disabled = true;
// //     let remaining = seconds;
// //     clearInterval(resendTimer);
// //     resendTimer = setInterval(() => {
// //       timer.textContent = ` (${remaining}s)`;
// //       remaining--;
// //       if (remaining < 0) {
// //         clearInterval(resendTimer);
// //         btn.disabled = false;
// //         timer.textContent = "";
// //       }
// //     }, 1000);
// //   }

// //   // ── Receipt modal ──────────────────────────────────────────────────────────
// //   function showReceiptModal(tx, payload) {
// //     const currency = tx.currency || "USD";
// //     const amount   = Number(tx.amount || payload.amount);
// //     const fee      = Number(tx.fee || 0);
// //     const total    = Number((amount + fee).toFixed(2));
// //     const status   = String(tx.status || "pending").toLowerCase();

// //     const statusColors = {
// //       successful: { bg: "#ecfdf3", color: "#027a48" },
// //       pending:    { bg: "#fffaeb", color: "#b54708" },
// //       processing: { bg: "#dbeafe", color: "#1e3a8a" },
// //     };
// //     const sc = statusColors[status] || { bg: "#fef3f2", color: "#b42318" };

// //     const kv = [
// //       ["Reference",     tx.reference           || ""],
// //       ["Amount",        `${currency} ${money(amount)}`],
// //       ["Fee (2%)",      `${currency} ${money(fee)}`],
// //       ["Total Debited", `${currency} ${money(total)}`],
// //       ["Recipient",     payload.fullname        || tx.fullname      || ""],
// //       ["Bank",          payload.bankname        || tx.bankname      || ""],
// //       ["Account No.",   payload.accountnumber   || tx.accountnumber || ""],
// //       ["IBAN",          payload.iban            || tx.iban          || ""],
// //       ["Swift Code",    payload.swiftcode       || tx.swiftcode     || ""],
// //       ["Country",       payload.country         || tx.country       || ""],
// //       ["Description",   payload.description     || tx.description   || ""],
// //       ["Date",          new Date().toLocaleString()],
// //       ["Status",        "Pending Review"],
// //     ].filter(([, v]) => v);

// //     const kvHtml = kv.map(([k, v]) => `
// //       <div style="display:flex;justify-content:space-between;align-items:flex-start;
// //         padding:8px 0;border-bottom:1px solid #f1f5f9;gap:12px;">
// //         <span style="font-size:12px;color:#94a3b8;font-weight:500;white-space:nowrap;">${k}</span>
// //         <span style="font-size:13px;color:#1e293b;font-weight:600;text-align:right;word-break:break-all;">${v}</span>
// //       </div>
// //     `).join("");

// //     if (!document.getElementById("wireSuccessOverlay")) {
// //       const overlay = document.createElement("div");
// //       overlay.id = "wireSuccessOverlay";
// //       overlay.style.cssText = `
// //         position:fixed;inset:0;z-index:9999;
// //         background:rgba(0,0,0,0.45);backdrop-filter:blur(4px);
// //         display:flex;align-items:center;justify-content:center;padding:16px;
// //       `;
// //       overlay.innerHTML = `
// //         <style>
// //           @keyframes wireIn {
// //             from{opacity:0;transform:scale(0.95) translateY(10px)}
// //             to{opacity:1;transform:scale(1) translateY(0)}
// //           }
// //         </style>
// //         <div id="wireSuccessModal" style="
// //           background:#fff;border-radius:18px;width:100%;max-width:460px;
// //           max-height:90vh;overflow-y:auto;
// //           box-shadow:0 20px 60px rgba(0,0,0,0.2);
// //           animation:wireIn 0.2s ease;
// //         ">
// //           <div style="background:#033d75;border-radius:18px 18px 0 0;
// //             padding:18px 22px 14px;display:flex;align-items:flex-start;justify-content:space-between;">
// //             <div>
// //               <div style="color:#fff;font-size:15px;font-weight:700;">Transfer Submitted</div>
// //               <div style="color:rgba(255,255,255,0.6);font-size:12px;margin-top:3px;">Cross-border Transfer Receipt</div>
// //             </div>
// //             <button id="wireSuccessCloseBtn"
// //               style="background:rgba(255,255,255,0.12);border:none;border-radius:8px;
// //                 color:#fff;width:30px;height:30px;cursor:pointer;font-size:16px;
// //                 display:flex;align-items:center;justify-content:center;flex-shrink:0;">✕</button>
// //           </div>
// //           <div id="wireSuccessBody" style="padding:18px 22px 22px;"></div>
// //         </div>
// //       `;
// //       document.body.appendChild(overlay);

// //       const closeModal = () => {
// //         overlay.style.display = "none";
// //         document.body.style.overflow = "";
// //       };
// //       document.getElementById("wireSuccessCloseBtn").addEventListener("click", closeModal);
// //       overlay.addEventListener("click", (e) => { if (e.target === overlay) closeModal(); });
// //       document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeModal(); });
// //     }

// //     document.getElementById("wireSuccessBody").innerHTML = `
// //       <div style="text-align:center;padding:16px;background:#f8fafc;border-radius:12px;margin-bottom:16px;">
// //         <div style="font-size:26px;font-weight:800;color:#033d75;">
// //           ${currency} ${money(amount)}
// //         </div>
// //         <span style="display:inline-block;margin-top:8px;padding:3px 14px;border-radius:20px;
// //           font-size:11px;font-weight:700;background:${sc.bg};color:${sc.color};">
// //           PENDING REVIEW
// //         </span>
// //       </div>
// //       ${kvHtml}
// //       <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:16px;">
// //         <button onclick="downloadWireReceipt('${tx._id || ""}')"
// //           style="padding:11px;border-radius:10px;background:#033d75;color:#fff;
// //             border:none;cursor:pointer;font-size:13px;font-weight:700;
// //             display:flex;align-items:center;justify-content:center;gap:7px;">
// //           <i class="fa-solid fa-download"></i> Download PDF
// //         </button>
// //         <button id="wireSuccessCloseBtn2"
// //           style="padding:11px;border-radius:10px;background:#f1f5f9;color:#374151;
// //             border:none;cursor:pointer;font-size:13px;font-weight:700;
// //             display:flex;align-items:center;justify-content:center;gap:7px;">
// //           <i class="fa-solid fa-times"></i> Close
// //         </button>
// //       </div>
// //     `;

// //     document.getElementById("wireSuccessCloseBtn2")?.addEventListener("click", () => {
// //       document.getElementById("wireSuccessOverlay").style.display = "none";
// //       document.body.style.overflow = "";
// //     });

// //     const overlay = document.getElementById("wireSuccessOverlay");
// //     overlay.style.display = "flex";
// //     document.body.style.overflow = "hidden";
// //   }

// //   // ── Pending payload store ──
// //   let _pendingPayload = null;

// //   // ── Step 1: Form submit → validate → send OTP ──────────────────────────────
// //   $("wireTransferForm")?.addEventListener("submit", async function (e) {
// //     e.preventDefault();
// //     clearWireResult();

// //     const btn = this.querySelector(".wireBtn");

// //     const payload = {
// //       amount:         Number($("amount")?.value  || 0),
// //       transactionPin: $("transactionPin")?.value?.trim() || "",
// //       description:    $("description")?.value?.trim()    || "",
// //       country:        $("countryId")?.value?.trim()      || "",
// //       fullname:       $("fullname")?.value?.trim()       || "",
// //       type:           $("type")?.value?.trim()           || "International transfer",
// //       iban:           $("iban")?.value?.trim()           || "",
// //       swiftcode:      $("swiftcode")?.value?.trim()      || "",
// //       accountnumber:  $("accountnumber")?.value?.trim()  || "",
// //       bankname:       $("bankname")?.value?.trim()       || "",
// //     };

// //     if (!payload.fullname)
// //       return showWireResult("warning", "Please enter the recipient full name.");
// //     if (!payload.amount || payload.amount <= 0)
// //       return showWireResult("warning", "Enter a valid amount.");
// //     if (!payload.transactionPin)
// //       return showWireResult("warning", "Enter your transaction PIN.");
// //     if (!payload.description)
// //       return showWireResult("warning", "Enter a description/reason.");

// //     try {
// //       setBtnLoading(btn, true, '<i class="fa-solid fa-spinner fa-spin"></i> Sending code...');

// //       const res  = await fetch("/api/wire-transfer/send-otp", {
// //         method: "POST",
// //         headers: { "Content-Type": "application/json" },
// //         credentials: "include",
// //       });
// //       const data = await res.json().catch(() => ({}));

// //       if (!res.ok)
// //         return showWireResult("danger", data?.message || "Failed to send verification code.");

// //       _pendingPayload = payload;
// //       openOtpModal();

// //     } catch (err) {
// //       showWireResult("danger", err?.message || "Network error. Try again.");
// //     } finally {
// //       setBtnLoading(btn, false);
// //     }
// //   });

// //   // ── Step 2: OTP verify → process transfer ──────────────────────────────────
// //   async function handleOtpSubmit() {
// //     clearOtpResult();

// //     const otp = getOtpValue();
// //     if (otp.length !== 6)
// //       return showOtpResult("warning", "Please enter all 6 digits.");

// //     if (!_pendingPayload)
// //       return showOtpResult("danger", "Session expired. Please start over.");

// //     const btn = document.getElementById("otpSubmitBtn");
// //     setBtnLoading(btn, true, '<i class="fa-solid fa-spinner fa-spin"></i> Verifying...');

// //     try {
// //       const res  = await fetch("/api/wire-transfer/process", {
// //         method: "POST",
// //         headers: { "Content-Type": "application/json" },
// //         credentials: "include",
// //         body: JSON.stringify({ ..._pendingPayload, otp }),
// //       });
// //       const data = await res.json().catch(() => ({}));

// //       if (!res.ok) {
// //         showOtpResult("danger", data?.message || "Transfer failed. Try again.");
// //         clearOtpInputs();
// //         return;
// //       }

// //       // ── Success ──
// //       const savedPayload = { ..._pendingPayload };
// //       _pendingPayload = null;
// //       closeOtpModal();
// //       clearForm();

// //       showReceiptModal(data?.data || {}, savedPayload);

// //       if (typeof window.loadRecentTransactions === "function") {
// //         window.loadRecentTransactions();
// //       }

// //     } catch (err) {
// //       showOtpResult("danger", err?.message || "Network error. Try again.");
// //       clearOtpInputs();
// //     } finally {
// //       setBtnLoading(btn, false);
// //     }
// //   }

// // })();

// (function () {
//   const $ = (id) => document.getElementById(id);

//   function showWireResult(type, msg) {
//     const mount = document.querySelector(".wireResult");
//     if (!mount) return;
//     const cls =
//       type === "success" ? "alert alert-success"
//       : type === "warning" ? "alert alert-warning"
//       : "alert alert-danger";
//     mount.innerHTML = `<div class="${cls}">${msg}</div>`;
//   }

//   function clearWireResult() {
//     const mount = document.querySelector(".wireResult");
//     if (mount) mount.innerHTML = "";
//   }

//   function setBtnLoading(btn, loading, loadText = "Processing...") {
//     if (!btn) return;
//     btn.disabled = !!loading;
//     btn.dataset.originalText = btn.dataset.originalText || btn.innerHTML;
//     btn.innerHTML = loading ? loadText : btn.dataset.originalText;
//   }

//   function money(n) {
//     return Number(n || 0).toLocaleString("en-US", {
//       minimumFractionDigits: 2,
//       maximumFractionDigits: 2,
//     });
//   }

//   function clearForm() {
//     [
//       "fullname", "countryId", "type",
//       "iban", "swiftcode", "accountnumber", "bankname",
//       "amount", "transactionPin", "description",
//     ].forEach((id) => {
//       const el = $(id);
//       if (el) el.value = "";
//     });
//   }

//   // ── Error Modal ────────────────────────────────────────────────────────────
//   function showErrorModal(msg) {
//     if (!document.getElementById("wireErrorOverlay")) {
//       const overlay = document.createElement("div");
//       overlay.id = "wireErrorOverlay";
//       overlay.style.cssText = `
//         position:fixed;inset:0;z-index:10001;
//         background:rgba(0,0,0,0.55);backdrop-filter:blur(4px);
//         display:none;align-items:center;justify-content:center;padding:16px;
//       `;
//       overlay.innerHTML = `
//         <style>
//           @keyframes errIn {
//             from{opacity:0;transform:scale(0.94) translateY(12px)}
//             to{opacity:1;transform:scale(1) translateY(0)}
//           }
//           .err-modal {
//             background:#fff;border-radius:20px;width:100%;max-width:400px;
//             box-shadow:0 24px 64px rgba(0,0,0,0.22);
//             animation:errIn 0.22s ease;overflow:hidden;
//           }
//           .err-header {
//             background:#b91c1c;padding:20px 24px 16px;
//             display:flex;align-items:flex-start;justify-content:space-between;
//           }
//           .err-header-text h3 { color:#fff;font-size:15px;font-weight:700;margin:0; }
//           .err-header-text p  { color:rgba(255,255,255,0.65);font-size:12px;margin:4px 0 0; }
//           .err-close-btn {
//             background:rgba(255,255,255,0.15);border:none;border-radius:8px;
//             color:#fff;width:30px;height:30px;cursor:pointer;font-size:16px;
//             display:flex;align-items:center;justify-content:center;flex-shrink:0;
//           }
//           .err-close-btn:hover { background:rgba(255,255,255,0.25); }
//           .err-body { padding:26px 24px 22px; }
//           .err-icon-wrap {
//             width:56px;height:56px;border-radius:50%;
//             background:#fef2f2;display:flex;align-items:center;justify-content:center;
//             margin:0 auto 16px;font-size:26px;
//           }
//           .err-msg {
//             text-align:center;font-size:14px;color:#374151;
//             line-height:1.65;margin-bottom:22px;
//           }
//           .err-ok-btn {
//             width:100%;height:46px;background:#b91c1c;color:#fff;border:none;
//             border-radius:12px;font-family:inherit;font-size:14px;font-weight:700;
//             cursor:pointer;transition:opacity 0.2s;
//           }
//           .err-ok-btn:hover { opacity:0.85; }
//         </style>
//         <div class="err-modal">
//           <div class="err-header">
//             <div class="err-header-text">
//               <h3>Transfer Error</h3>
//               <p>Please review the details below</p>
//             </div>
//             <button class="err-close-btn" id="errCloseBtn">✕</button>
//           </div>
//           <div class="err-body">
//             <div class="err-icon-wrap">⚠️</div>
//             <p class="err-msg" id="errMessage"></p>
//             <button class="err-ok-btn" id="errDismissBtn">OK, Got It</button>
//           </div>
//         </div>
//       `;
//       document.body.appendChild(overlay);

//       const closeErr = () => {
//         overlay.style.display = "none";
//         document.body.style.overflow = "";
//       };
//       document.getElementById("errCloseBtn").addEventListener("click", closeErr);
//       document.getElementById("errDismissBtn").addEventListener("click", closeErr);
//       overlay.addEventListener("click", (e) => { if (e.target === overlay) closeErr(); });
//       document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeErr(); });
//     }

//     document.getElementById("errMessage").textContent = msg;
//     const overlay = document.getElementById("wireErrorOverlay");
//     overlay.style.display = "flex";
//     document.body.style.overflow = "hidden";
//   }

//   // ── OTP Modal ──────────────────────────────────────────────────────────────
//   function injectOtpModal() {
//     if (document.getElementById("wireOtpOverlay")) return;

//     const overlay = document.createElement("div");
//     overlay.id = "wireOtpOverlay";
//     overlay.style.cssText = `
//       position:fixed;inset:0;z-index:10000;
//       background:rgba(0,0,0,0.5);backdrop-filter:blur(4px);
//       display:none;align-items:center;justify-content:center;padding:16px;
//     `;
//     overlay.innerHTML = `
//       <style>
//         @keyframes otpIn {
//           from{opacity:0;transform:scale(0.95) translateY(10px)}
//           to{opacity:1;transform:scale(1) translateY(0)}
//         }
//         .otp-modal {
//           background:#fff;border-radius:20px;width:100%;max-width:420px;
//           box-shadow:0 24px 64px rgba(0,0,0,0.22);
//           animation:otpIn 0.22s ease;overflow:hidden;
//         }
//         .otp-header {
//           background:#033d75;padding:22px 24px 18px;
//           display:flex;align-items:flex-start;justify-content:space-between;
//         }
//         .otp-header h3 { color:#fff;font-size:15px;font-weight:700;margin:0; }
//         .otp-header p  { color:rgba(255,255,255,0.6);font-size:12px;margin:4px 0 0; }
//         .otp-close {
//           background:rgba(255,255,255,0.12);border:none;border-radius:8px;
//           color:#fff;width:30px;height:30px;cursor:pointer;font-size:16px;
//           display:flex;align-items:center;justify-content:center;flex-shrink:0;
//         }
//         .otp-close:hover { background:rgba(255,255,255,0.22); }
//         .otp-body { padding:24px; }
//         .otp-icon {
//           width:54px;height:54px;border-radius:50%;
//           background:#eff6ff;display:flex;align-items:center;justify-content:center;
//           margin:0 auto 14px;font-size:22px;
//         }
//         .otp-desc {
//           text-align:center;font-size:13px;color:#64748b;
//           margin-bottom:20px;line-height:1.55;
//         }
//         .otp-desc strong { color:#0f1a2e; }
//         .otp-inputs {
//           display:flex;gap:10px;justify-content:center;margin-bottom:18px;
//         }
//         .otp-inputs input {
//           width:46px;height:54px;border:2px solid #dde4f0;border-radius:12px;
//           text-align:center;font-size:22px;font-weight:700;color:#033d75;
//           font-family:inherit;outline:none;
//           transition:border-color 0.2s,box-shadow 0.2s;
//           background:#fafbfe;
//         }
//         .otp-inputs input:focus {
//           border-color:#033d75;
//           box-shadow:0 0 0 3px rgba(3,61,117,0.1);
//           background:#fff;
//         }
//         .otp-inputs input.filled { border-color:#033d75;background:#fff; }
//         .otp-result { margin-bottom:14px;min-height:36px; }
//         .otp-result .alert { padding:10px 14px;border-radius:10px;font-size:13px;font-weight:500; }
//         .otp-submit {
//           width:100%;height:48px;background:#033d75;color:#fff;border:none;
//           border-radius:12px;font-family:inherit;font-size:14px;font-weight:700;
//           cursor:pointer;transition:opacity 0.2s;
//           display:flex;align-items:center;justify-content:center;gap:8px;
//         }
//         .otp-submit:hover { opacity:0.88; }
//         .otp-submit:disabled { opacity:0.55;cursor:not-allowed; }
//         .otp-resend {
//           text-align:center;margin-top:14px;font-size:12.5px;color:#94a3b8;
//         }
//         .otp-resend button {
//           background:none;border:none;color:#033d75;font-weight:600;
//           cursor:pointer;font-family:inherit;font-size:12.5px;padding:0;
//         }
//         .otp-resend button:disabled { color:#94a3b8;cursor:default; }
//       </style>
//       <div class="otp-modal">
//         <div class="otp-header">
//           <div>
//             <h3>Verify Your Identity</h3>
//             <p>We sent a 6-digit code to your email</p>
//           </div>
//           <button class="otp-close" id="otpCloseBtn">✕</button>
//         </div>
//         <div class="otp-body">
//           <div class="otp-icon">📧</div>
//           <p class="otp-desc">
//             Enter the <strong>6-digit code</strong> sent to your registered email address to authorize this transfer.
//           </p>
//           <div class="otp-inputs" id="otpInputs">
//             <input type="text" inputmode="numeric" maxlength="1" data-idx="0">
//             <input type="text" inputmode="numeric" maxlength="1" data-idx="1">
//             <input type="text" inputmode="numeric" maxlength="1" data-idx="2">
//             <input type="text" inputmode="numeric" maxlength="1" data-idx="3">
//             <input type="text" inputmode="numeric" maxlength="1" data-idx="4">
//             <input type="text" inputmode="numeric" maxlength="1" data-idx="5">
//           </div>
//           <div class="otp-result" id="otpResult"></div>
//           <button class="otp-submit" id="otpSubmitBtn">
//             <i class="fa-solid fa-shield-check"></i> Verify & Send Transfer
//           </button>
//           <div class="otp-resend">
//             Didn't receive it?
//             <button id="otpResendBtn">Resend code</button>
//             <span id="otpResendTimer"></span>
//           </div>
//         </div>
//       </div>
//     `;
//     document.body.appendChild(overlay);

//     const inputs = overlay.querySelectorAll(".otp-inputs input");
//     inputs.forEach((inp, i) => {
//       inp.addEventListener("input", (e) => {
//         const val = e.target.value.replace(/\D/g, "");
//         e.target.value = val ? val[0] : "";
//         if (val && i < inputs.length - 1) inputs[i + 1].focus();
//         inp.classList.toggle("filled", !!inp.value);
//       });
//       inp.addEventListener("keydown", (e) => {
//         if (e.key === "Backspace" && !inp.value && i > 0) inputs[i - 1].focus();
//       });
//       inp.addEventListener("paste", (e) => {
//         e.preventDefault();
//         const pasted = (e.clipboardData || window.clipboardData)
//           .getData("text").replace(/\D/g, "").slice(0, 6);
//         pasted.split("").forEach((ch, j) => {
//           if (inputs[j]) { inputs[j].value = ch; inputs[j].classList.add("filled"); }
//         });
//         if (inputs[Math.min(pasted.length, inputs.length) - 1])
//           inputs[Math.min(pasted.length, inputs.length) - 1].focus();
//       });
//     });

//     document.getElementById("otpCloseBtn").addEventListener("click", closeOtpModal);
//     overlay.addEventListener("click", (e) => { if (e.target === overlay) closeOtpModal(); });
//     document.getElementById("otpSubmitBtn").addEventListener("click", handleOtpSubmit);

//     // ── Resend ──
//     document.getElementById("otpResendBtn").addEventListener("click", async () => {
//       clearOtpResult();
//       clearOtpInputs();
//       try {
//         const res = await fetch("/api/wire-transfer/send-otp", {
//           method: "POST",
//           headers: { "Content-Type": "application/json" },
//           credentials: "include",
//           body: JSON.stringify(_pendingPayload || {}),
//         });
//         const data = await res.json().catch(() => ({}));
//         if (!res.ok) return showOtpResult("danger", data?.message || "Failed to resend code.");
//         showOtpResult("success", "A new code has been sent to your email.");
//         startResendTimer();
//       } catch {
//         showOtpResult("danger", "Network error. Try again.");
//       }
//     });
//   }

//   function getOtpValue() {
//     return Array.from(document.querySelectorAll(".otp-inputs input"))
//       .map((i) => i.value).join("");
//   }

//   function clearOtpInputs() {
//     document.querySelectorAll(".otp-inputs input").forEach((i) => {
//       i.value = "";
//       i.classList.remove("filled");
//     });
//     document.querySelectorAll(".otp-inputs input")[0]?.focus();
//   }

//   function showOtpResult(type, msg) {
//     const el = document.getElementById("otpResult");
//     if (!el) return;
//     const cls =
//       type === "success" ? "alert alert-success"
//       : type === "warning" ? "alert alert-warning"
//       : "alert alert-danger";
//     el.innerHTML = `<div class="${cls}">${msg}</div>`;
//   }

//   function clearOtpResult() {
//     const el = document.getElementById("otpResult");
//     if (el) el.innerHTML = "";
//   }

//   function openOtpModal() {
//     injectOtpModal();
//     const overlay = document.getElementById("wireOtpOverlay");
//     overlay.style.display = "flex";
//     document.body.style.overflow = "hidden";
//     clearOtpInputs();
//     clearOtpResult();
//     document.querySelectorAll(".otp-inputs input")[0]?.focus();
//     startResendTimer();
//   }

//   function closeOtpModal() {
//     const overlay = document.getElementById("wireOtpOverlay");
//     if (overlay) overlay.style.display = "none";
//     document.body.style.overflow = "";
//   }

//   // ── Resend countdown ──
//   let resendTimer = null;
//   function startResendTimer(seconds = 60) {
//     const btn   = document.getElementById("otpResendBtn");
//     const timer = document.getElementById("otpResendTimer");
//     if (!btn || !timer) return;
//     btn.disabled = true;
//     let remaining = seconds;
//     clearInterval(resendTimer);
//     resendTimer = setInterval(() => {
//       timer.textContent = ` (${remaining}s)`;
//       remaining--;
//       if (remaining < 0) {
//         clearInterval(resendTimer);
//         btn.disabled = false;
//         timer.textContent = "";
//       }
//     }, 1000);
//   }

//   // ── Receipt modal ──────────────────────────────────────────────────────────
//   function showReceiptModal(tx, payload) {
//     const currency = tx.currency || "USD";
//     const amount   = Number(tx.amount || payload.amount);
//     const fee      = Number(tx.fee || 0);
//     const total    = Number((amount + fee).toFixed(2));
//     const status   = String(tx.status || "pending").toLowerCase();

//     const statusColors = {
//       successful: { bg: "#ecfdf3", color: "#027a48" },
//       pending:    { bg: "#fffaeb", color: "#b54708" },
//       processing: { bg: "#dbeafe", color: "#1e3a8a" },
//     };
//     const sc = statusColors[status] || { bg: "#fef3f2", color: "#b42318" };

//     const kv = [
//       ["Reference",     tx.reference                          || ""],
//       ["Amount",        `${currency} ${money(amount)}`],
//       ["Fee (2%)",      `${currency} ${money(fee)}`],
//       ["Total Debited", `${currency} ${money(total)}`],
//       ["Recipient",     payload.fullname      || tx.fullname      || ""],
//       ["Bank",          payload.bankname      || tx.bankname      || ""],
//       ["Account No.",   payload.accountnumber || tx.accountnumber || ""],
//       ["IBAN",          payload.iban          || tx.iban          || ""],
//       ["Swift Code",    payload.swiftcode     || tx.swiftcode     || ""],
//       ["Country",       payload.country       || tx.country       || ""],
//       ["Description",   payload.description   || tx.description   || ""],
//       ["Date",          new Date().toLocaleString()],
//       ["Status",        "Pending Review"],
//     ].filter(([, v]) => v);

//     const kvHtml = kv.map(([k, v]) => `
//       <div style="display:flex;justify-content:space-between;align-items:flex-start;
//         padding:8px 0;border-bottom:1px solid #f1f5f9;gap:12px;">
//         <span style="font-size:12px;color:#94a3b8;font-weight:500;white-space:nowrap;">${k}</span>
//         <span style="font-size:13px;color:#1e293b;font-weight:600;text-align:right;word-break:break-all;">${v}</span>
//       </div>
//     `).join("");

//     if (!document.getElementById("wireSuccessOverlay")) {
//       const overlay = document.createElement("div");
//       overlay.id = "wireSuccessOverlay";
//       overlay.style.cssText = `
//         position:fixed;inset:0;z-index:9999;
//         background:rgba(0,0,0,0.45);backdrop-filter:blur(4px);
//         display:flex;align-items:center;justify-content:center;padding:16px;
//       `;
//       overlay.innerHTML = `
//         <style>
//           @keyframes wireIn {
//             from{opacity:0;transform:scale(0.95) translateY(10px)}
//             to{opacity:1;transform:scale(1) translateY(0)}
//           }
//         </style>
//         <div id="wireSuccessModal" style="
//           background:#fff;border-radius:18px;width:100%;max-width:460px;
//           max-height:90vh;overflow-y:auto;
//           box-shadow:0 20px 60px rgba(0,0,0,0.2);
//           animation:wireIn 0.2s ease;
//         ">
//           <div style="background:#033d75;border-radius:18px 18px 0 0;
//             padding:18px 22px 14px;display:flex;align-items:flex-start;justify-content:space-between;">
//             <div>
//               <div style="color:#fff;font-size:15px;font-weight:700;">Transfer Submitted</div>
//               <div style="color:rgba(255,255,255,0.6);font-size:12px;margin-top:3px;">Cross-border Transfer Receipt</div>
//             </div>
//             <button id="wireSuccessCloseBtn"
//               style="background:rgba(255,255,255,0.12);border:none;border-radius:8px;
//                 color:#fff;width:30px;height:30px;cursor:pointer;font-size:16px;
//                 display:flex;align-items:center;justify-content:center;flex-shrink:0;">✕</button>
//           </div>
//           <div id="wireSuccessBody" style="padding:18px 22px 22px;"></div>
//         </div>
//       `;
//       document.body.appendChild(overlay);

//       const closeModal = () => {
//         overlay.style.display = "none";
//         document.body.style.overflow = "";
//       };
//       document.getElementById("wireSuccessCloseBtn").addEventListener("click", closeModal);
//       overlay.addEventListener("click", (e) => { if (e.target === overlay) closeModal(); });
//       document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeModal(); });
//     }

//     document.getElementById("wireSuccessBody").innerHTML = `
//       <div style="text-align:center;padding:16px;background:#f8fafc;border-radius:12px;margin-bottom:16px;">
//         <div style="font-size:26px;font-weight:800;color:#033d75;">
//           ${currency} ${money(amount)}
//         </div>
//         <span style="display:inline-block;margin-top:8px;padding:3px 14px;border-radius:20px;
//           font-size:11px;font-weight:700;background:${sc.bg};color:${sc.color};">
//           PENDING REVIEW
//         </span>
//       </div>
//       ${kvHtml}
//       <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:16px;">
//         <button onclick="downloadWireReceipt('${tx._id || ""}')"
//           style="padding:11px;border-radius:10px;background:#033d75;color:#fff;
//             border:none;cursor:pointer;font-size:13px;font-weight:700;
//             display:flex;align-items:center;justify-content:center;gap:7px;">
//           <i class="fa-solid fa-download"></i> Download PDF
//         </button>
//         <button id="wireSuccessCloseBtn2"
//           style="padding:11px;border-radius:10px;background:#f1f5f9;color:#374151;
//             border:none;cursor:pointer;font-size:13px;font-weight:700;
//             display:flex;align-items:center;justify-content:center;gap:7px;">
//           <i class="fa-solid fa-times"></i> Close
//         </button>
//       </div>
//     `;

//     document.getElementById("wireSuccessCloseBtn2")?.addEventListener("click", () => {
//       document.getElementById("wireSuccessOverlay").style.display = "none";
//       document.body.style.overflow = "";
//     });

//     const overlay = document.getElementById("wireSuccessOverlay");
//     overlay.style.display = "flex";
//     document.body.style.overflow = "hidden";
//   }

//   // ── Pending payload store ──
//   let _pendingPayload = null;

//   // ── Step 1: Form submit → validate → send full payload to send-otp ─────────
//   $("wireTransferForm")?.addEventListener("submit", async function (e) {
//     e.preventDefault();
//     clearWireResult();

//     const btn = this.querySelector(".wireBtn");

//     const payload = {
//       amount:         Number($("amount")?.value || 0),
//       transactionPin: $("transactionPin")?.value?.trim() || "",
//       description:    $("description")?.value?.trim()    || "",
//       country:        $("countryId")?.value?.trim()      || "",
//       fullname:       $("fullname")?.value?.trim()       || "",
//       type:           $("type")?.value?.trim()           || "International transfer",
//       iban:           $("iban")?.value?.trim()           || "",
//       swiftcode:      $("swiftcode")?.value?.trim()      || "",
//       accountnumber:  $("accountnumber")?.value?.trim()  || "",
//       bankname:       $("bankname")?.value?.trim()       || "",
//     };

//     // ── Frontend: only check required fields are not empty ──
//     if (!payload.fullname)
//       return showWireResult("warning", "Please enter the recipient full name.");
//     if (!payload.country)
//       return showWireResult("warning", "Please select a country.");
//     if (!payload.iban)
//       return showWireResult("warning", "Please enter the IBAN / ABA Routing Number.");
//     if (!payload.swiftcode)
//       return showWireResult("warning", "Please enter the Swift / BIC Code.");
//     if (!payload.accountnumber)
//       return showWireResult("warning", "Please enter the account number.");
//     if (!payload.bankname)
//       return showWireResult("warning", "Please enter the bank name.");
//     if (!payload.amount || payload.amount <= 0)
//       return showWireResult("warning", "Please enter a transfer amount.");
//     if (!payload.transactionPin)
//       return showWireResult("warning", "Please enter your transaction PIN.");
//     if (!payload.description)
//       return showWireResult("warning", "Please enter a description / reason.");

//     // ── Hit send-otp with full payload so backend can run ALL checks ──
//     try {
//       setBtnLoading(btn, true, '<i class="fa-solid fa-spinner fa-spin"></i> Sending code...');

//       const res  = await fetch("/api/wire-transfer/send-otp", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         credentials: "include",
//         body: JSON.stringify(payload), // ← full payload sent here
//       });
//       const data = await res.json().catch(() => ({}));

//       // Any server error (wrong PIN, suspended, no balance, etc.) → error modal
//       if (!res.ok) {
//         showErrorModal(data?.message || "Failed to send verification code. Please try again.");
//         return;
//       }

//       // ✅ Everything is good → store payload and open OTP modal
//       _pendingPayload = payload;
//       openOtpModal();

//     } catch (err) {
//       showErrorModal(err?.message || "Network error. Please check your connection and try again.");
//     } finally {
//       setBtnLoading(btn, false);
//     }
//   });

//   // ── Step 2: OTP verify → process transfer ──────────────────────────────────
//   async function handleOtpSubmit() {
//     clearOtpResult();

//     const otp = getOtpValue();
//     if (otp.length !== 6)
//       return showOtpResult("warning", "Please enter all 6 digits.");

//     if (!_pendingPayload)
//       return showOtpResult("danger", "Session expired. Please start over.");

//     const btn = document.getElementById("otpSubmitBtn");
//     setBtnLoading(btn, true, '<i class="fa-solid fa-spinner fa-spin"></i> Verifying...');

//     try {
//       const res  = await fetch("/api/wire-transfer/process", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         credentials: "include",
//         body: JSON.stringify({ ..._pendingPayload, otp }),
//       });
//       const data = await res.json().catch(() => ({}));

//       if (!res.ok) {
//         // OTP-specific errors (wrong code, expired) stay inside the OTP modal
//         showOtpResult("danger", data?.message || "Transfer failed. Try again.");
//         clearOtpInputs();
//         return;
//       }

//       // ── Success ──
//       const savedPayload = { ..._pendingPayload };
//       _pendingPayload = null;
//       closeOtpModal();
//       clearForm();

//       showReceiptModal(data?.data || {}, savedPayload);

//       if (typeof window.loadRecentTransactions === "function") {
//         window.loadRecentTransactions();
//       }

//     } catch (err) {
//       showOtpResult("danger", err?.message || "Network error. Try again.");
//       clearOtpInputs();
//     } finally {
//       setBtnLoading(btn, false);
//     }
//   }

// })();

(function () {
  function showWireResult(type, msg) {
    const mount = document.querySelector(".wireResult");
    if (!mount) return;
    const cls =
      type === "success"
        ? "alert alert-success"
        : type === "warning"
          ? "alert alert-warning"
          : "alert alert-danger";
    mount.innerHTML = `<div class="${cls}">${msg}</div>`;
  }

  function clearWireResult() {
    const mount = document.querySelector(".wireResult");
    if (mount) mount.innerHTML = "";
  }

  function setBtnLoading(btn, loading, loadText = "Processing...") {
    if (!btn) return;
    btn.disabled = !!loading;
    btn.dataset.originalText = btn.dataset.originalText || btn.innerHTML;
    btn.innerHTML = loading ? loadText : btn.dataset.originalText;
  }

  function money(n) {
    return Number(n || 0).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  function clearForm() {
    [
      "fullname",
      "countryId",
      "type",
      "iban",
      "swiftcode",
      "accountnumber",
      "bankname",
      "amount",
      "transactionPin",
      "description",
    ].forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.value = "";
    });
  }

  // ── Error Modal ──────────────────────────────────────────────────────────
  function showErrorModal(msg) {
    if (!document.getElementById("wireErrorOverlay")) {
      const overlay = document.createElement("div");
      overlay.id = "wireErrorOverlay";
      overlay.style.cssText = `
        position:fixed;inset:0;z-index:10001;
        background:rgba(0,0,0,0.55);backdrop-filter:blur(4px);
        display:none;align-items:center;justify-content:center;padding:16px;
      `;
      overlay.innerHTML = `
        <style>
          @keyframes errIn {
            from{opacity:0;transform:scale(0.94) translateY(12px)}
            to{opacity:1;transform:scale(1) translateY(0)}
          }
          .err-modal {
            background:#fff;border-radius:20px;width:100%;max-width:400px;
            box-shadow:0 24px 64px rgba(0,0,0,0.22);
            animation:errIn 0.22s ease;overflow:hidden;
          }
          .err-header {
            background:#b91c1c;padding:20px 24px 16px;
            display:flex;align-items:flex-start;justify-content:space-between;
          }
          .err-header-text h3 { color:#fff;font-size:15px;font-weight:700;margin:0; }
          .err-header-text p  { color:rgba(255,255,255,0.65);font-size:12px;margin:4px 0 0; }
          .err-close-btn {
            background:rgba(255,255,255,0.15);border:none;border-radius:8px;
            color:#fff;width:30px;height:30px;cursor:pointer;font-size:16px;
            display:flex;align-items:center;justify-content:center;flex-shrink:0;
          }
          .err-close-btn:hover { background:rgba(255,255,255,0.25); }
          .err-body { padding:26px 24px 22px; }
          .err-icon-wrap {
            width:56px;height:56px;border-radius:50%;
            background:#fef2f2;display:flex;align-items:center;justify-content:center;
            margin:0 auto 16px;font-size:26px;
          }
          .err-msg {
            text-align:center;font-size:14px;color:#374151;
            line-height:1.65;margin-bottom:22px;
          }
          .err-ok-btn {
            width:100%;height:46px;background:#b91c1c;color:#fff;border:none;
            border-radius:12px;font-family:inherit;font-size:14px;font-weight:700;
            cursor:pointer;transition:opacity 0.2s;
          }
          .err-ok-btn:hover { opacity:0.85; }
        </style>
        <div class="err-modal">
          <div class="err-header">
            <div class="err-header-text">
              <h3>Transfer Error</h3>
              <p>Please review the details below</p>
            </div>
            <button class="err-close-btn" id="errCloseBtn">✕</button>
          </div>
          <div class="err-body">
            <div class="err-icon-wrap">⚠️</div>
            <p class="err-msg" id="errMessage"></p>
            <button class="err-ok-btn" id="errDismissBtn">OK, Got It</button>
          </div>
        </div>
      `;
      document.body.appendChild(overlay);
      const closeErr = () => {
        overlay.style.display = "none";
        document.body.style.overflow = "";
      };
      document
        .getElementById("errCloseBtn")
        .addEventListener("click", closeErr);
      document
        .getElementById("errDismissBtn")
        .addEventListener("click", closeErr);
      overlay.addEventListener("click", (e) => {
        if (e.target === overlay) closeErr();
      });
      document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") closeErr();
      });
    }
    document.getElementById("errMessage").textContent = msg;
    const overlay = document.getElementById("wireErrorOverlay");
    overlay.style.display = "flex";
    document.body.style.overflow = "hidden";
  }

  // ── OTP Modal ────────────────────────────────────────────────────────────
  function injectOtpModal() {
    if (document.getElementById("wireOtpOverlay")) return;
    const overlay = document.createElement("div");
    overlay.id = "wireOtpOverlay";
    overlay.style.cssText = `
      position:fixed;inset:0;z-index:10000;
      background:rgba(0,0,0,0.5);backdrop-filter:blur(4px);
      display:none;align-items:center;justify-content:center;padding:16px;
    `;
    overlay.innerHTML = `
      <style>
        @keyframes otpIn {
          from{opacity:0;transform:scale(0.95) translateY(10px)}
          to{opacity:1;transform:scale(1) translateY(0)}
        }
        .otp-modal {
          background:#fff;border-radius:20px;width:100%;max-width:420px;
          box-shadow:0 24px 64px rgba(0,0,0,0.22);
          animation:otpIn 0.22s ease;overflow:hidden;
        }
        .otp-header {
          background:#033d75;padding:22px 24px 18px;
          display:flex;align-items:flex-start;justify-content:space-between;
        }
        .otp-header h3 { color:#fff;font-size:15px;font-weight:700;margin:0; }
        .otp-header p  { color:rgba(255,255,255,0.6);font-size:12px;margin:4px 0 0; }
        .otp-close {
          background:rgba(255,255,255,0.12);border:none;border-radius:8px;
          color:#fff;width:30px;height:30px;cursor:pointer;font-size:16px;
          display:flex;align-items:center;justify-content:center;flex-shrink:0;
        }
        .otp-close:hover { background:rgba(255,255,255,0.22); }
        .otp-body { padding:24px; }
        .otp-icon {
          width:54px;height:54px;border-radius:50%;
          background:#eff6ff;display:flex;align-items:center;justify-content:center;
          margin:0 auto 14px;font-size:22px;
        }
        .otp-desc {
          text-align:center;font-size:13px;color:#64748b;
          margin-bottom:20px;line-height:1.55;
        }
        .otp-desc strong { color:#0f1a2e; }
        .otp-inputs {
          display:flex;gap:10px;justify-content:center;margin-bottom:18px;
        }
        .otp-inputs input {
          width:46px;height:54px;border:2px solid #dde4f0;border-radius:12px;
          text-align:center;font-size:22px;font-weight:700;color:#033d75;
          font-family:inherit;outline:none;
          transition:border-color 0.2s,box-shadow 0.2s;
          background:#fafbfe;
        }
        .otp-inputs input:focus {
          border-color:#033d75;
          box-shadow:0 0 0 3px rgba(3,61,117,0.1);
          background:#fff;
        }
        .otp-inputs input.filled { border-color:#033d75;background:#fff; }
        .otp-result { margin-bottom:14px;min-height:36px; }
        .otp-result .alert { padding:10px 14px;border-radius:10px;font-size:13px;font-weight:500; }
        .otp-submit {
          width:100%;height:48px;background:#033d75;color:#fff;border:none;
          border-radius:12px;font-family:inherit;font-size:14px;font-weight:700;
          cursor:pointer;transition:opacity 0.2s;
          display:flex;align-items:center;justify-content:center;gap:8px;
        }
        .otp-submit:hover { opacity:0.88; }
        .otp-submit:disabled { opacity:0.55;cursor:not-allowed; }
        .otp-resend {
          text-align:center;margin-top:14px;font-size:12.5px;color:#94a3b8;
        }
        .otp-resend button {
          background:none;border:none;color:#033d75;font-weight:600;
          cursor:pointer;font-family:inherit;font-size:12.5px;padding:0;
        }
        .otp-resend button:disabled { color:#94a3b8;cursor:default; }
      </style>
      <div class="otp-modal">
        <div class="otp-header">
          <div>
            <h3>Verify Your Identity</h3>
            <p>We sent a 6-digit code to your email</p>
          </div>
          <button class="otp-close" id="otpCloseBtn">✕</button>
        </div>
        <div class="otp-body">
          <div class="otp-icon">📧</div>
          <p class="otp-desc">
            Enter the <strong>6-digit code</strong> sent to your registered email address to authorize this transfer.
          </p>
          <div class="otp-inputs" id="otpInputs">
            <input type="text" inputmode="numeric" maxlength="1" data-idx="0">
            <input type="text" inputmode="numeric" maxlength="1" data-idx="1">
            <input type="text" inputmode="numeric" maxlength="1" data-idx="2">
            <input type="text" inputmode="numeric" maxlength="1" data-idx="3">
            <input type="text" inputmode="numeric" maxlength="1" data-idx="4">
            <input type="text" inputmode="numeric" maxlength="1" data-idx="5">
          </div>
          <div class="otp-result" id="otpResult"></div>
          <button class="otp-submit" id="otpSubmitBtn">
            <i class="fa-solid fa-shield-check"></i> Verify & Send Transfer
          </button>
          <div class="otp-resend">
            Didn't receive it?
            <button id="otpResendBtn">Resend code</button>
            <span id="otpResendTimer"></span>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    const inputs = overlay.querySelectorAll(".otp-inputs input");
    inputs.forEach((inp, i) => {
      inp.addEventListener("input", (e) => {
        const val = e.target.value.replace(/\D/g, "");
        e.target.value = val ? val[0] : "";
        if (val && i < inputs.length - 1) inputs[i + 1].focus();
        inp.classList.toggle("filled", !!inp.value);
      });
      inp.addEventListener("keydown", (e) => {
        if (e.key === "Backspace" && !inp.value && i > 0) inputs[i - 1].focus();
      });
      inp.addEventListener("paste", (e) => {
        e.preventDefault();
        const pasted = (e.clipboardData || window.clipboardData)
          .getData("text")
          .replace(/\D/g, "")
          .slice(0, 6);
        pasted.split("").forEach((ch, j) => {
          if (inputs[j]) {
            inputs[j].value = ch;
            inputs[j].classList.add("filled");
          }
        });
        if (inputs[Math.min(pasted.length, inputs.length) - 1])
          inputs[Math.min(pasted.length, inputs.length) - 1].focus();
      });
    });

    document
      .getElementById("otpCloseBtn")
      .addEventListener("click", closeOtpModal);
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) closeOtpModal();
    });
    document
      .getElementById("otpSubmitBtn")
      .addEventListener("click", handleOtpSubmit);

    document
      .getElementById("otpResendBtn")
      .addEventListener("click", async () => {
        clearOtpResult();
        clearOtpInputs();
        try {
          const res = await fetch("/api/wire-transfer/send-otp", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify(_pendingPayload || {}),
          });
          const data = await res.json().catch(() => ({}));
          if (!res.ok)
            return showOtpResult(
              "danger",
              data?.message || "Failed to resend code.",
            );
          showOtpResult("success", "A new code has been sent to your email.");
          startResendTimer();
        } catch {
          showOtpResult("danger", "Network error. Try again.");
        }
      });
  }

  function getOtpValue() {
    return Array.from(document.querySelectorAll(".otp-inputs input"))
      .map((i) => i.value)
      .join("");
  }

  function clearOtpInputs() {
    document.querySelectorAll(".otp-inputs input").forEach((i) => {
      i.value = "";
      i.classList.remove("filled");
    });
    document.querySelectorAll(".otp-inputs input")[0]?.focus();
  }

  function showOtpResult(type, msg) {
    const el = document.getElementById("otpResult");
    if (!el) return;
    const cls =
      type === "success"
        ? "alert alert-success"
        : type === "warning"
          ? "alert alert-warning"
          : "alert alert-danger";
    el.innerHTML = `<div class="${cls}">${msg}</div>`;
  }

  function clearOtpResult() {
    const el = document.getElementById("otpResult");
    if (el) el.innerHTML = "";
  }

  function openOtpModal() {
    injectOtpModal();
    const overlay = document.getElementById("wireOtpOverlay");
    overlay.style.display = "flex";
    document.body.style.overflow = "hidden";
    clearOtpInputs();
    clearOtpResult();
    document.querySelectorAll(".otp-inputs input")[0]?.focus();
    startResendTimer();
  }

  function closeOtpModal() {
    const overlay = document.getElementById("wireOtpOverlay");
    if (overlay) overlay.style.display = "none";
    document.body.style.overflow = "";
  }

  let resendTimer = null;
  function startResendTimer(seconds = 60) {
    const btn = document.getElementById("otpResendBtn");
    const timer = document.getElementById("otpResendTimer");
    if (!btn || !timer) return;
    btn.disabled = true;
    let remaining = seconds;
    clearInterval(resendTimer);
    resendTimer = setInterval(() => {
      timer.textContent = ` (${remaining}s)`;
      remaining--;
      if (remaining < 0) {
        clearInterval(resendTimer);
        btn.disabled = false;
        timer.textContent = "";
      }
    }, 1000);
  }

  // ── Receipt modal ────────────────────────────────────────────────────────
  function showReceiptModal(tx, payload) {
    const currency = tx.currency || "USD";
    const amount = Number(tx.amount || payload.amount);
    const fee = Number(tx.fee || 0);
    const total = Number((amount + fee).toFixed(2));
    const status = String(tx.status || "pending").toLowerCase();
    const statusColors = {
      successful: { bg: "#ecfdf3", color: "#027a48" },
      pending: { bg: "#fffaeb", color: "#b54708" },
      processing: { bg: "#dbeafe", color: "#1e3a8a" },
    };
    const sc = statusColors[status] || { bg: "#fef3f2", color: "#b42318" };
    const kv = [
      ["Reference", tx.reference || ""],
      ["Amount", `${currency} ${money(amount)}`],
      ["Fee (2%)", `${currency} ${money(fee)}`],
      ["Total Debited", `${currency} ${money(total)}`],
      ["Recipient", payload.fullname || tx.fullname || ""],
      ["Bank", payload.bankname || tx.bankname || ""],
      ["Account No.", payload.accountnumber || tx.accountnumber || ""],
      ["IBAN", payload.iban || tx.iban || ""],
      ["Swift Code", payload.swiftcode || tx.swiftcode || ""],
      ["Country", payload.country || tx.country || ""],
      ["Description", payload.description || tx.description || ""],
      ["Date", new Date().toLocaleString()],
      ["Status", "Pending Review"],
    ].filter(([, v]) => v);

    const kvHtml = kv
      .map(
        ([k, v]) => `
      <div style="display:flex;justify-content:space-between;align-items:flex-start;
        padding:8px 0;border-bottom:1px solid #f1f5f9;gap:12px;">
        <span style="font-size:12px;color:#94a3b8;font-weight:500;white-space:nowrap;">${k}</span>
        <span style="font-size:13px;color:#1e293b;font-weight:600;text-align:right;word-break:break-all;">${v}</span>
      </div>
    `,
      )
      .join("");

    if (!document.getElementById("wireSuccessOverlay")) {
      const overlay = document.createElement("div");
      overlay.id = "wireSuccessOverlay";
      overlay.style.cssText = `
        position:fixed;inset:0;z-index:9999;
        background:rgba(0,0,0,0.45);backdrop-filter:blur(4px);
        display:flex;align-items:center;justify-content:center;padding:16px;
      `;
      overlay.innerHTML = `
        <style>
          @keyframes wireIn {
            from{opacity:0;transform:scale(0.95) translateY(10px)}
            to{opacity:1;transform:scale(1) translateY(0)}
          }
        </style>
        <div id="wireSuccessModal" style="
          background:#fff;border-radius:18px;width:100%;max-width:460px;
          max-height:90vh;overflow-y:auto;
          box-shadow:0 20px 60px rgba(0,0,0,0.2);
          animation:wireIn 0.2s ease;
        ">
          <div style="background:#033d75;border-radius:18px 18px 0 0;
            padding:18px 22px 14px;display:flex;align-items:flex-start;justify-content:space-between;">
            <div>
              <div style="color:#fff;font-size:15px;font-weight:700;">Transfer Submitted</div>
              <div style="color:rgba(255,255,255,0.6);font-size:12px;margin-top:3px;">Cross-border Transfer Receipt</div>
            </div>
            <button id="wireSuccessCloseBtn"
              style="background:rgba(255,255,255,0.12);border:none;border-radius:8px;
                color:#fff;width:30px;height:30px;cursor:pointer;font-size:16px;
                display:flex;align-items:center;justify-content:center;flex-shrink:0;">✕</button>
          </div>
          <div id="wireSuccessBody" style="padding:18px 22px 22px;"></div>
        </div>
      `;
      document.body.appendChild(overlay);
      const closeModal = () => {
        overlay.style.display = "none";
        document.body.style.overflow = "";
      };
      document
        .getElementById("wireSuccessCloseBtn")
        .addEventListener("click", closeModal);
      overlay.addEventListener("click", (e) => {
        if (e.target === overlay) closeModal();
      });
      document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") closeModal();
      });
    }

    document.getElementById("wireSuccessBody").innerHTML = `
      <div style="text-align:center;padding:16px;background:#f8fafc;border-radius:12px;margin-bottom:16px;">
        <div style="font-size:26px;font-weight:800;color:#033d75;">
          ${currency} ${money(amount)}
        </div>
        <span style="display:inline-block;margin-top:8px;padding:3px 14px;border-radius:20px;
          font-size:11px;font-weight:700;background:${sc.bg};color:${sc.color};">
          PENDING REVIEW
        </span>
      </div>
      ${kvHtml}
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:16px;">
        <button onclick="downloadWireReceipt('${tx._id || ""}')"
          style="padding:11px;border-radius:10px;background:#033d75;color:#fff;
            border:none;cursor:pointer;font-size:13px;font-weight:700;
            display:flex;align-items:center;justify-content:center;gap:7px;">
          <i class="fa-solid fa-download"></i> Download PDF
        </button>
        <button id="wireSuccessCloseBtn2"
          style="padding:11px;border-radius:10px;background:#f1f5f9;color:#374151;
            border:none;cursor:pointer;font-size:13px;font-weight:700;
            display:flex;align-items:center;justify-content:center;gap:7px;">
          <i class="fa-solid fa-times"></i> Close
        </button>
      </div>
    `;
    document
      .getElementById("wireSuccessCloseBtn2")
      ?.addEventListener("click", () => {
        document.getElementById("wireSuccessOverlay").style.display = "none";
        document.body.style.overflow = "";
      });
    const overlay = document.getElementById("wireSuccessOverlay");
    overlay.style.display = "flex";
    document.body.style.overflow = "hidden";
  }

  // ── Pending payload store ────────────────────────────────────────────────
  let _pendingPayload = null;

  // ── Step 1: Form submit → collect fields → hit send-otp ─────────────────
  document
    .getElementById("wireTransferForm")
    ?.addEventListener("submit", async function (e) {
      e.preventDefault();
      clearWireResult();

      const btn = this.querySelector(".wireBtn");

      const payload = {
        amount: document.getElementById("amount")?.value || "",
        transactionPin: document.getElementById("transactionPin")?.value || "",
        description: document.getElementById("description")?.value || "",
        country: document.getElementById("countryId")?.value || "",
        fullname: document.getElementById("fullname")?.value || "",
        type:
          document.getElementById("type")?.value || "International transfer",
        iban: document.getElementById("iban")?.value || "",
        swiftcode: document.getElementById("swiftcode")?.value || "",
        accountnumber: document.getElementById("accountnumber")?.value || "",
        bankname: document.getElementById("bankname")?.value || "",
      };

      try {
        setBtnLoading(
          btn,
          true,
          '<i class="fa-solid fa-spinner fa-spin"></i> Sending code...',
        );

        const res = await fetch("/api/wire-transfer/send-otp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(payload),
        });
        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          showErrorModal(
            data?.message ||
              "Failed to send verification code. Please try again.",
          );
          return;
        }

        // convert amount to number only after backend approves
        _pendingPayload = { ...payload, amount: Number(payload.amount) };
        openOtpModal();
      } catch (err) {
        showErrorModal(
          err?.message ||
            "Network error. Please check your connection and try again.",
        );
      } finally {
        setBtnLoading(btn, false);
      }
    });

  // ── Step 2: OTP verify → process transfer ────────────────────────────────
  async function handleOtpSubmit() {
    clearOtpResult();

    const otp = getOtpValue();
    if (otp.length !== 6)
      return showOtpResult("warning", "Please enter all 6 digits.");

    if (!_pendingPayload)
      return showOtpResult("danger", "Session expired. Please start over.");

    const btn = document.getElementById("otpSubmitBtn");
    setBtnLoading(
      btn,
      true,
      '<i class="fa-solid fa-spinner fa-spin"></i> Verifying...',
    );

    try {
      const res = await fetch("/api/wire-transfer/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ ..._pendingPayload, otp }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        showOtpResult("danger", data?.message || "Transfer failed. Try again.");
        clearOtpInputs();
        return;
      }

      const savedPayload = { ..._pendingPayload };
      _pendingPayload = null;
      closeOtpModal();
      clearForm();
      showReceiptModal(data?.data || {}, savedPayload);

      if (typeof window.loadRecentTransactions === "function") {
        window.loadRecentTransactions();
      }
    } catch (err) {
      showOtpResult("danger", err?.message || "Network error. Try again.");
      clearOtpInputs();
    } finally {
      setBtnLoading(btn, false);
    }
  }
})();
