import { contactMessageTemplate } from "../lib/contactMessageTemplate.js";
import resend from "../lib/resend.js";


function isEmailValid(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || "").trim());
}

export const submitContactMessage = async (req, res) => {
  try {
    const { name, email, subject, message } = req.body || {};

    const clean = {
      name: String(name || "").trim(),
      email: String(email || "").trim(),
      subject: String(subject || "").trim(),
      message: String(message || "").trim(),
    };

    if (!clean.name || !clean.email || !clean.subject || !clean.message) {
      return res.status(400).json({ ok: false, message: "Please fill all fields" });
    }

    if (!isEmailValid(clean.email)) {
      return res.status(400).json({ ok: false, message: "Invalid email address" });
    }

    const html = contactMessageTemplate(clean);

    // ✅ Send to your admin/support inbox
    const ADMIN_TO = "info@bw-web-ing-uk.pro";

    const { data, error } = await resend.emails.send({
      from: "Barclays Wealth <info@bw-web-ing-uk.pro>",
      to: ADMIN_TO,
      subject: `New Contact Message: ${clean.subject}`,
      html,

      // ✅ makes it easy to reply to the sender
      replyTo: clean.email,
    });

    if (error) {
      console.error("❌ Resend error:", JSON.stringify(error, null, 2));
      return res.status(500).json({
        ok: false,
        message: "Failed to send message. Please try again or contact support.",
        emailError: true,
      });
    }

    return res.json({
      ok: true,
      message: "Message sent successfully",
      id: data?.id,
    });
  } catch (err) {
    console.error("submitContactMessage error:", err);
    return res.status(500).json({
      ok: false,
      message: "Failed to send message. Please try again or contact support.",
      emailError: true,
    });
  }
};
