import PDFDocument from "pdfkit";
import TransactionModel from "../models/TransactionModel.js";

export const downloadReceiptPdf = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?._id;

    const tx = await TransactionModel.findOne({ _id: id, user: userId }).lean();
    if (!tx) return res.status(404).json({ ok: false, message: "Transaction not found" });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="receipt-${tx.ref}.pdf"`);

    const doc = new PDFDocument({ size: "A4", margin: 50 });
    doc.pipe(res);

    // Header
    doc.fontSize(18).text("Transaction Receipt", { align: "center" });
    doc.moveDown(0.5);
    doc.fontSize(10).fillColor("#666").text(`Ref: ${tx.ref}`, { align: "center" });
    doc.moveDown(1);

    // Amount + status
    const type = String(tx.type || "").toLowerCase();
    const sign = type === "credit" ? "+" : "-";
    doc.fillColor("#111").fontSize(28).text(`${tx.currency || "USD"}${sign}${Number(tx.amount || 0).toLocaleString()}`, { align: "center" });
    doc.moveDown(0.3);
    doc.fillColor("#0b5ed7").fontSize(12).text(String(tx.status || "").toUpperCase(), { align: "center" });
    doc.moveDown(1);

    // Divider
    doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor("#ddd").stroke();
    doc.moveDown(1);

    // Key/Value helper
    const row = (k, v) => {
      doc.fillColor("#666").fontSize(11).text(k, 50, doc.y, { continued: true });
      doc.fillColor("#111").fontSize(11).text(String(v ?? "-"), { align: "right" });
      doc.moveDown(0.6);
    };

    row("Transaction Type", String(tx.type || "-").toUpperCase());
    row("Account ID", userId);
    row("Transaction ID", tx._id);
    row("Title", tx.title || "-");
    row("Description", tx.narration || "-");
    row("Date", tx.createdAt ? new Date(tx.createdAt).toLocaleString() : "-");

    // Beneficiary full details
    const b = tx.beneficiary || {};
    row("Beneficiary Name", b.accountName || "-");
    row("Beneficiary Account", b.accountNumber || "-");
    row("Beneficiary Bank", b.bankName || "-");

    doc.moveDown(1);
    doc.fillColor("#888").fontSize(9).text("Powered by Atlas Heritage", { align: "center" });

    doc.end();
  } catch (err) {
    console.error("downloadReceiptPdf:", err);
    return res.status(500).json({ ok: false, message: "Failed to generate receipt" });
  }
};
