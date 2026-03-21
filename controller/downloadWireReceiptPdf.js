import PDFDocument from "pdfkit";
import wireTransferHistoryModel from "../models/wireTransferHistoryModel.js";

export const downloadWireReceiptPdf = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?._id;

    const tx = await wireTransferHistoryModel
      .findOne({ _id: id, user: userId })
      .populate("recipient", "fullname bankname country city state address iban swiftcode accountnumber accountholder accounttype email phone")
      .lean();

    if (!tx)
      return res.status(404).json({ ok: false, message: "Transfer not found" });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="wire-receipt-${tx.reference || id}.pdf"`);

    const doc = new PDFDocument({ size: "A4", margin: 0 });
    doc.pipe(res);

    const W = 595;
    const H = 842; // A4 height
    const navy        = "#033d75";
    const navyMid     = "#0a4d8c";
    const white       = "#ffffff";
    const gray        = "#667085";
    const dark        = "#101828";
    const border      = "#e4e7ec";
    const successGreen  = "#027a48";
    const successBg     = "#ecfdf3";
    const pendingOrange = "#b54708";
    const pendingBg     = "#fffaeb";
    const failRed     = "#b42318";
    const failBg      = "#fef3f2";
    const blueBg      = "#dbeafe";
    const blueColor   = "#1e3a8a";

    // ── HEADER (compact) ────────────────────────────────────────────────────
    doc.rect(0, 0, W, 88).fill(navy);

    doc.fillColor(white).font("Helvetica-Bold").fontSize(16)
      .text("Barclays Wealth", 0, 18, { align: "center" });

    doc.fillColor("#a8c4e0").font("Helvetica").fontSize(9)
      .text("Cross-border Transfer Receipt", 0, 38, { align: "center" });

    doc.roundedRect(W / 2 - 95, 54, 190, 20, 10).fill("#0a4d8c");
    doc.fillColor("#c8dff2").font("Helvetica").fontSize(8)
      .text(`Ref: ${tx.reference || "-"}`, 0, 58, { align: "center" });

    // ── AMOUNT HERO (compact) ───────────────────────────────────────────────
    doc.rect(0, 88, W, 86).fill("#f8fafc");

    const currency  = tx.currency || "USD";
    const amountStr = `${currency} ${Number(tx.amount || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}`;

    doc.fillColor(navy).font("Helvetica-Bold").fontSize(26)
      .text(amountStr, 0, 104, { align: "center" });

    const status = String(tx.status || "pending").toLowerCase();
    let statusBg, statusColor, statusLabel;
    if (status === "successful" || status === "completed") {
      statusBg = successBg; statusColor = successGreen; statusLabel = "SUCCESSFUL";
    } else if (status === "pending") {
      statusBg = pendingBg; statusColor = pendingOrange; statusLabel = "PENDING";
    } else if (status === "processing") {
      statusBg = blueBg; statusColor = blueColor; statusLabel = "PROCESSING";
    } else {
      statusBg = failBg; statusColor = failRed; statusLabel = status.toUpperCase();
    }

    const badgeW = 96;
    const badgeX = (W - badgeW) / 2;
    doc.roundedRect(badgeX, 140, badgeW, 18, 9).fill(statusBg);
    doc.fillColor(statusColor).font("Helvetica-Bold").fontSize(8)
      .text(statusLabel, badgeX, 145, { width: badgeW, align: "center" });

    // ── DIVIDER ─────────────────────────────────────────────────────────────
    doc.rect(0, 174, W, 1).fill(border);

    // ── ROW helpers (tighter) ───────────────────────────────────────────────
    const leftPad  = 44;
    const rightPad = 44;
    const rowH     = 26;  // tighter rows
    let y = 182;

    function sectionLabel(label) {
      doc.rect(leftPad - 8, y, W - (leftPad + rightPad - 16), 18).fill("#f1f5f9");
      doc.fillColor(navy).font("Helvetica-Bold").fontSize(9)
        .text(label, leftPad, y + 4, { width: W - leftPad - rightPad });
      y += 22;
    }

    function row(k, v, i) {
      if (i % 2 === 0) {
        doc.rect(leftPad - 8, y - 3, W - (leftPad + rightPad - 16), rowH).fill("#f8fafc");
      }
      doc.fillColor(gray).font("Helvetica").fontSize(9)
        .text(k, leftPad, y, { width: 175 });
      doc.fillColor(dark).font("Helvetica-Bold").fontSize(9)
        .text(String(v || "-"), leftPad + 185, y, {
          width: W - leftPad - rightPad - 185,
          align: "right",
          lineBreak: false,
          ellipsis: true,
        });
      doc.moveTo(leftPad, y + rowH - 4)
        .lineTo(W - rightPad, y + rowH - 4)
        .strokeColor(border).lineWidth(0.4).stroke();
      y += rowH;
    }

    const r        = tx.recipient || {};
    const fee      = Number(tx.fee || 0);
    const total    = Number((tx.amount + fee).toFixed(2));

    // ── TRANSFER DETAILS ────────────────────────────────────────────────────
    sectionLabel("Transfer Details");
    [
      ["Reference",     tx.reference || "-"],
      ["Amount",        `${currency} ${Number(tx.amount).toLocaleString("en-US", { minimumFractionDigits: 2 })}`],
      ["Fee (2%)",      `${currency} ${fee.toLocaleString("en-US", { minimumFractionDigits: 2 })}`],
      ["Total Debited", `${currency} ${total.toLocaleString("en-US", { minimumFractionDigits: 2 })}`],
      ["Description",   tx.description || "-"],
      ["Date",          tx.createdAt ? new Date(tx.createdAt).toLocaleString() : "-"],
      ["Status",        statusLabel],
    ].forEach(([k, v], i) => row(k, v, i));

    y += 6;

    // ── RECIPIENT DETAILS ───────────────────────────────────────────────────
    sectionLabel("Recipient Details");
    [
      ["Full Name",      r.fullname      || ""],
      ["Bank Name",      r.bankname      || ""],
      ["Account Number", r.accountnumber || ""],
      ["Account Holder", r.accountholder || ""],
      ["Account Type",   r.accounttype   || ""],
      ["IBAN",           r.iban          || ""],
      ["Swift Code",     r.swiftcode     || ""],
    ]
      .filter(([, v]) => v)
      .forEach(([k, v], i) => row(k, v, i));

    y += 6;

    // ── LOCATION & CONTACT ──────────────────────────────────────────────────
    sectionLabel("Location & Contact");
    [
      ["Country", r.country || ""],
      ["City",    r.city    || ""],
      ["Address", r.address || ""],
      ["Email",   r.email   || ""],
      ["Phone",   r.phone   || ""],
    ]
      .filter(([, v]) => v)
      .forEach(([k, v], i) => row(k, v, i));

    // ── FOOTER (pinned near bottom) ─────────────────────────────────────────
    const footerY = Math.max(y + 16, H - 56);

    doc.rect(0, footerY, W, 56).fill("#f1f5f9");
    doc.rect(0, footerY, W, 1).fill(border);

    doc.fillColor(gray).font("Helvetica").fontSize(8)
      .text("This is an auto-generated receipt. Please keep it for your records.", 0, footerY + 12, { align: "center" });

    doc.fillColor(navy).font("Helvetica-Bold").fontSize(8)
      .text("Powered by Barclays Wealth", 0, footerY + 28, { align: "center" });

    // ── LEFT ACCENT BAR ─────────────────────────────────────────────────────
    doc.rect(0, 0, 4, H).fill(navyMid);

    doc.end();
  } catch (err) {
    console.error("downloadWireReceiptPdf:", err);
    return res.status(500).json({ ok: false, message: "Failed to generate receipt" });
  }
};