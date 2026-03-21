import mongoose from "mongoose";
import UserModel from "../models/UserModel.js";
import resend from "../lib/resend.js";
import { adminSendEmailTemplate } from "../lib/admin-send-email-template.js";

function escapeHtml(s = "") {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function toBasicHtmlFromText(text) {
  // keeps line breaks and prevents HTML injection
  const safe = escapeHtml(text);
  return `
    <div style="font-size:14px;color:#475467;white-space:pre-wrap;line-height:1.7;">
      ${safe}
    </div>
  `;
}

function chunk(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

/**
 * POST /api/admin/messages/email
 * body: { subject, body, audience: "all"|"selected", userIds?: [] }
 */
export const sendAdminEmail = async (req, res) => {
  try {
    const subject = String(req.body.subject || "").trim();
    const body = String(req.body.body || "").trim();
    const audience = String(req.body.audience || "").trim(); // all | selected
    const userIds = Array.isArray(req.body.userIds) ? req.body.userIds : [];

    if (!subject)
      return res.status(400).json({ message: "Subject is required" });
    if (!body) return res.status(400).json({ message: "Body is required" });
    if (!["all", "selected"].includes(audience)) {
      return res
        .status(400)
        .json({ message: 'Audience must be "all" or "selected"' });
    }
    if (audience === "selected" && userIds.length === 0) {
      return res.status(400).json({ message: "Select at least one user" });
    }

    // ✅ Build recipient filter
    const filter = {};
    if (audience === "selected") {
      const validIds = userIds.filter((id) =>
        mongoose.Types.ObjectId.isValid(id),
      );
      if (validIds.length === 0) {
        return res.status(400).json({ message: "No valid userIds provided" });
      }
      filter._id = { $in: validIds };
    }

    // ✅ Fetch recipient emails (only)
    const users = await UserModel.find(filter).select("email").lean();
    const emails = users
      .map((u) =>
        String(u.email || "")
          .trim()
          .toLowerCase(),
      )
      .filter(Boolean);

    if (emails.length === 0) {
      return res.status(404).json({ message: "No recipients found" });
    }

    // ✅ Build professional HTML using your template
    const innerContent = toBasicHtmlFromText(body);
    const html = adminSendEmailTemplate({
      title: escapeHtml(subject), // safe
      content: innerContent, // already safe
    });

    const from = "Reallegal <info@reallegal-plc.com>";

    // ✅ Send in chunks
    const batches = chunk(emails, 50);

    let sent = 0;
    const errors = [];

    for (const toList of batches) {
      try {
        const resp = await resend.emails.send({
          from,
          to: toList,
          subject,
          html,
          text: body,
        });

        if (resp?.error) {
          errors.push({ batchSize: toList.length, error: resp.error });
        } else {
          sent += toList.length;
        }
      } catch (e) {
        errors.push({
          batchSize: toList.length,
          error: e?.message || String(e),
        });
      }
    }

    const failed = errors.reduce((acc, e) => acc + (e.batchSize || 0), 0);

    return res.json({
      message:
        errors.length === 0
          ? `Email sent to ${sent} users`
          : `Email sent to ${sent} users, failed batches: ${errors.length}`,
      audience,
      totalRecipients: emails.length,
      sent,
      failed,
      errors: errors.length ? errors : undefined,
    });
  } catch (err) {
    console.error("sendAdminEmail error:", err);
    return res.status(500).json({ message: "Failed to send email" });
  }
};
