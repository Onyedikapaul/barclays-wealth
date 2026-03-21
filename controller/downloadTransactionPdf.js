// import PDFDocument from "pdfkit";
// import TransactionModel from "../models/TransactionModel.js";

// export const downloadReceiptPdf = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const userId = req.user?._id;

//     const tx = await TransactionModel.findOne({ _id: id, user: userId }).lean();
//     if (!tx) return res.status(404).json({ ok: false, message: "Transaction not found" });

//     res.setHeader("Content-Type", "application/pdf");
//     res.setHeader("Content-Disposition", `attachment; filename="receipt-${tx.ref}.pdf"`);

//     const doc = new PDFDocument({ size: "A4", margin: 50 });
//     doc.pipe(res);

//     // Header
//     doc.fontSize(18).text("Transaction Receipt", { align: "center" });
//     doc.moveDown(0.5);
//     doc.fontSize(10).fillColor("#666").text(`Ref: ${tx.ref}`, { align: "center" });
//     doc.moveDown(1);

//     // Amount + status
//     const type = String(tx.type || "").toLowerCase();
//     const sign = type === "credit" ? "+" : "-";
//     doc.fillColor("#111").fontSize(28).text(`${tx.currency || "USD"}${sign}${Number(tx.amount || 0).toLocaleString()}`, { align: "center" });
//     doc.moveDown(0.3);
//     doc.fillColor("#0b5ed7").fontSize(12).text(String(tx.status || "").toUpperCase(), { align: "center" });
//     doc.moveDown(1);

//     // Divider
//     doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor("#ddd").stroke();
//     doc.moveDown(1);

//     // Key/Value helper
//     const row = (k, v) => {
//       doc.fillColor("#666").fontSize(11).text(k, 50, doc.y, { continued: true });
//       doc.fillColor("#111").fontSize(11).text(String(v ?? "-"), { align: "right" });
//       doc.moveDown(0.6);
//     };

//     row("Transaction Type", String(tx.type || "-").toUpperCase());
//     row("Account ID", userId);
//     row("Transaction ID", tx._id);
//     row("Title", tx.title || "-");
//     row("Description", tx.narration || "-");
//     row("Date", tx.createdAt ? new Date(tx.createdAt).toLocaleString() : "-");

//     // Beneficiary full details
//     const b = tx.beneficiary || {};
//     row("Beneficiary Name", b.accountName || "-");
//     row("Beneficiary Account", b.accountNumber || "-");
//     row("Beneficiary Bank", b.bankName || "-");

//     doc.moveDown(1);
//     doc.fillColor("#888").fontSize(9).text("Powered by Atlas Heritage", { align: "center" });

//     doc.end();
//   } catch (err) {
//     console.error("downloadReceiptPdf:", err);
//     return res.status(500).json({ ok: false, message: "Failed to generate receipt" });
//   }
// };


import PDFDocument from "pdfkit";
import TransactionModel from "../models/TransactionModel.js";

export const downloadReceiptPdf = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?._id;

    const tx = await TransactionModel.findOne({ _id: id, user: userId }).lean();
    if (!tx)
      return res.status(404).json({ ok: false, message: "Transaction not found" });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="receipt-${tx.ref}.pdf"`);

    const doc = new PDFDocument({ size: "A4", margin: 0 });
    doc.pipe(res);

    const W = 595;
    const navy      = "#033d75";
    const navyLight = "#0a5298";
    const white     = "#ffffff";
    const gray      = "#667085";
    const dark      = "#101828";
    const border    = "#e4e7ec";
    const successGreen  = "#027a48";
    const successBg     = "#ecfdf3";
    const pendingOrange = "#b54708";
    const pendingBg     = "#fffaeb";
    const failRed   = "#b42318";
    const failBg    = "#fef3f2";

    // ── HEADER BAND ──────────────────────────────────────────────────────────
 // ── HEADER BAND ──────────────────────────────────────────────────────────
doc.rect(0, 0, W, 110).fill(navy);

// Bank name
doc.fillColor(white).font("Helvetica-Bold").fontSize(18)
  .text("Barclays Wealth", 0, 28, { align: "center" });

doc.fillColor("#a8c4e0").font("Helvetica").fontSize(10)
  .text("Transaction Receipt", 0, 52, { align: "center" });

// Ref pill — use a real hex color instead of rgba
doc.roundedRect(W / 2 - 90, 70, 180, 22, 11)
  .fill("#0a4d8c");  // ← solid navy shade instead of rgba

doc.fillColor("#c8dff2").font("Helvetica").fontSize(9)
  .text(`Ref: ${tx.ref || "-"}`, 0, 75, { align: "center" });

    // ── AMOUNT HERO ──────────────────────────────────────────────────────────
    doc.rect(0, 110, W, 110).fill("#f8fafc");

    const type = String(tx.type || "").toLowerCase();
    const sign = type === "credit" ? "+" : "-";
    const amountStr = `${tx.currency || "USD"} ${sign}${Number(tx.amount || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}`;

    doc.fillColor(navy).font("Helvetica-Bold").fontSize(30)
      .text(amountStr, 0, 128, { align: "center" });

    // Status badge
    const status = String(tx.status || "pending").toLowerCase();
    let statusBg, statusColor, statusLabel;
    if (status === "success" || status === "completed") {
      statusBg = successBg; statusColor = successGreen; statusLabel = "SUCCESS";
    } else if (status === "pending") {
      statusBg = pendingBg; statusColor = pendingOrange; statusLabel = "PENDING";
    } else {
      statusBg = failBg; statusColor = failRed; statusLabel = status.toUpperCase();
    }

    const badgeW = 90;
    const badgeX = (W - badgeW) / 2;
    doc.roundedRect(badgeX, 172, badgeW, 22, 11).fill(statusBg);
    doc.fillColor(statusColor).font("Helvetica-Bold").fontSize(9)
      .text(statusLabel, badgeX, 178, { width: badgeW, align: "center" });

    // ── DIVIDER ──────────────────────────────────────────────────────────────
    doc.rect(0, 220, W, 1).fill(border);
    const bodyStartY = 240;

    // ── DETAIL ROWS ──────────────────────────────────────────────────────────
    const leftPad  = 50;
    const rightPad = 50;
    const rowH     = 38;
    let y = bodyStartY;

    const b = tx.beneficiary || {};

    const rows = [
      ["Transaction Type",    String(tx.type || "-").toUpperCase()],
      ["Account ID",          String(userId || "-")],
      ["Transaction ID",      String(tx._id || "-")],
      ["Title",               tx.title || "-"],
      ["Description",         tx.narration || tx.description || "-"],
      ["Date",                tx.createdAt ? new Date(tx.createdAt).toLocaleString() : "-"],
      ["Beneficiary Name",    b.accountName   || "-"],
      ["Beneficiary Account", b.accountNumber || "-"],
      ["Beneficiary Bank",    b.bankName      || "-"],
    ];

    rows.forEach(([k, v], i) => {
      // Alternate row background
      if (i % 2 === 0) {
        doc.rect(leftPad - 10, y - 6, W - (leftPad + rightPad - 20), rowH - 2)
          .fill("#f8fafc");
      }

      // Key
      doc.fillColor(gray).font("Helvetica").fontSize(10)
        .text(k, leftPad, y, { width: 180 });

      // Value
      doc.fillColor(dark).font("Helvetica-Bold").fontSize(10)
        .text(String(v || "-"), leftPad + 190, y, {
          width: W - leftPad - rightPad - 190,
          align: "right",
          lineBreak: false,
          ellipsis: true,
        });

      // Row separator
      doc.moveTo(leftPad, y + rowH - 8)
        .lineTo(W - rightPad, y + rowH - 8)
        .strokeColor(border).lineWidth(0.5).stroke();

      y += rowH;
    });

    // ── FOOTER ───────────────────────────────────────────────────────────────
    const footerY = y + 30;

    doc.rect(0, footerY, W, 60).fill("#f1f5f9");
    doc.rect(0, footerY, W, 1).fill(border);

    doc.fillColor(gray).font("Helvetica").fontSize(9)
      .text("This is an auto-generated receipt. Please keep it for your records.",
        0, footerY + 14, { align: "center" });

    doc.fillColor(navy).font("Helvetica-Bold").fontSize(9)
      .text("Powered by Barclays Wealth", 0, footerY + 30, { align: "center" });

    // ── LEFT ACCENT BAR ──────────────────────────────────────────────────────
    doc.rect(0, 0, 4, footerY + 60).fill(navyLight);

    doc.end();
  } catch (err) {
    console.error("downloadReceiptPdf:", err);
    return res.status(500).json({ ok: false, message: "Failed to generate receipt" });
  }
};