import UserModel from "../models/UserModel.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import resend from "../lib/resend.js";
import { verificationEmailTemplate } from "../lib/email-verification-template.js";
import cloudinary from "../config/cloudinary.js";
import { uploadBufferToCloudinary } from "../utils/ploadToCloudinary.js";
import Card from "../models/CardModel.js";

const generateAccountNumber = () => {
  // 10-digit numeric account number
  return Math.floor(1000000000 + Math.random() * 9000000000).toString();
};

function gen6() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

// ── Cloudflare Turnstile verification helper ──
const verifyTurnstile = async (token) => {
  if (!token) return false;

  const res = await fetch(
    "https://challenges.cloudflare.com/turnstile/v0/siteverify",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        secret: process.env.TURNSTILE_SECRET_KEY,
        response: token,
      }),
    },
  );

  const data = await res.json();
  return data.success === true;
};

export const registerUser = async (req, res) => {
  try {
    const body = req.body;

    // ── Turnstile check ──
    const turnstileValid = await verifyTurnstile(body["cf-turnstile-response"]);
    if (!turnstileValid) {
      return res
        .status(400)
        .json({
          ok: false,
          message: "Captcha verification failed. Please try again.",
        });
    }

    const required = [
      "firstname",
      "middlename",
      "lastname",
      "country",
      "state",
      "city",
      "zipcode",
      "dob",
      "address",
      "phone",
      "email",
      "occupation",
      "income",
      "ssn",
      "accounttype",
      "usercurrency",
      "secretCode",
      "password",
      "cpassword",
    ];

    for (const k of required) {
      if (!body[k] || String(body[k]).trim() === "") {
        return res.status(400).json({ ok: false, message: `Missing ${k}` });
      }
    }

    if (!req.file) {
      return res
        .status(400)
        .json({ ok: false, message: "Passport image is required" });
    }

    if (body.password !== body.cpassword) {
      return res
        .status(400)
        .json({ ok: false, message: "Passwords do not match" });
    }

    if (String(body.secretCode).length !== 4) {
      return res
        .status(400)
        .json({ ok: false, message: "2FA PIN must be 4 digits" });
    }

    const exists = await UserModel.findOne({ email: body.email.toLowerCase() });
    if (exists) {
      return res
        .status(409)
        .json({ ok: false, message: "Email already registered" });
    }

    let uploaded;
    try {
      uploaded = await uploadBufferToCloudinary(
        req.file.buffer,
        "barclays-wealth/passports",
      );
    } catch (e) {
      return res
        .status(500)
        .json({ ok: false, message: "Passport upload failed" });
    }

    const passportUrl = uploaded.secure_url;
    const passportPublicId = uploaded.public_id;

    // 🏦 unique account number
    let accountNumber;
    let accountExists;

    do {
      accountNumber = generateAccountNumber();
      accountExists = await UserModel.findOne({ accountNumber });
    } while (accountExists);

    // ✅ create user
    const user = await UserModel.create({
      firstname: body.firstname,
      middlename: body.middlename,
      lastname: body.lastname,

      country: body.country,
      state: body.state,
      city: body.city,
      zipcode: body.zipcode,
      dob: new Date(body.dob),
      address: body.address,

      phone: body.phone,
      email: body.email.toLowerCase(),

      occupation: body.occupation,
      income: body.income,

      ssn: body.ssn,
      accounttype: body.accounttype,
      usercurrency: body.usercurrency,

      accountNumber,
      accountBalance: 0,

      transactionPin: null,
      isAllowedToTransfer: true,

      secretCodeHash: body.secretCode,
      passwordHash: body.password,
      passportUrl,
      passportPublicId,
    });

    // ✅ auto-create card (inactive)
    try {
      await Card.create({
        userId: user._id,
        accountNumber: user.accountNumber,
        cardType: "virtual",
        status: "inactive",
        brand: "VISA",
      });
    } catch (cardErr) {
      // rollback user if card creation failed
      await UserModel.findByIdAndDelete(user._id);

      if (passportPublicId) {
        await cloudinary.uploader.destroy(passportPublicId).catch(() => {});
      }

      console.error("Card create error:", cardErr);
      return res.status(500).json({
        ok: false,
        message: "Registration failed: could not create card",
      });
    }

    const verifyCode = gen6();
    const emailVerifyCodeHash = await bcrypt.hash(verifyCode, 12);
    const emailVerifyCodeExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

    user.emailVerifyCodeHash = emailVerifyCodeHash;
    user.emailVerifyCodeExpiresAt = emailVerifyCodeExpiresAt;
    user.emailVerified = false;
    await user.save();

    const html = verificationEmailTemplate({
      name: `${user.firstname} ${user.lastname}`,
      code: verifyCode,
    });

    try {
      const { data, error } = await resend.emails.send({
        from: "Barclays Wealth <info@bw-web-ing-uk.pro>",
        to: user.email,
        subject: "Verify Your Email | Barclays Wealth",
        html: html,
      });

      if (error) {
        console.error("❌ Resend error:", JSON.stringify(error, null, 2));
        // Don't fail registration, but log the error
        console.error("Email failed to send, but registration continues");
      } else {
        console.log("✅ Email sent successfully! ID:", data.id);
      }
    } catch (emailError) {
      console.error("❌ Email exception:", emailError);
      // Don't fail registration, continue
    }

    return res.json({
      ok: true,
      message: "Registration successful",
      userId: user._id,
      accountNumber: user.accountNumber,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      ok: false,
      message: err.message || "Server error",
    });
  }
};

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // ── Turnstile check ──
    const turnstileValid = await verifyTurnstile(
      req.body["cf-turnstile-response"],
    );
    if (!turnstileValid) {
      return res
        .status(400)
        .json({
          ok: false,
          message: "Captcha verification failed. Please try again.",
        });
    }

    if (!email || !password) {
      return res
        .status(400)
        .json({ ok: false, message: "Email and password are required" });
    }

    const cleanEmail = String(email).trim().toLowerCase();

    const user = await UserModel.findOne({ email: cleanEmail });
    if (!user)
      return res
        .status(401)
        .json({ ok: false, message: "Invalid credentials" });

    const ok = (await password) === user.passwordHash;
    if (!ok)
      return res
        .status(401)
        .json({ ok: false, message: "Invalid credentials" });

    // ✅ CHECK ACCOUNT STATUS FIRST (before email verification)
    const status = String(user.status || "active").toLowerCase();

    if (status !== "active") {
      return res.status(403).json({
        ok: false,
        message: `Account suspended. Please contact support. Reason: ${
          user.suspensionReason ||
          "Your account is suspended. Please contact support."
        }`,
      });
    }

    if (status === "closed") {
      return res.status(403).json({
        ok: false,
        message: "Your account is closed. Please contact support.",
      });
    }

    // ✅ CHECK EMAIL VERIFICATION
    if (!user.emailVerified) {
      const verifyCode = gen6();
      const emailVerifyCodeHash = await bcrypt.hash(String(verifyCode), 12);
      const emailVerifyCodeExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

      await UserModel.findByIdAndUpdate(
        user._id,
        { emailVerifyCodeHash, emailVerifyCodeExpiresAt },
        { new: false },
      );

      const html = verificationEmailTemplate({
        name: `${user.firstname} ${user.lastname}`,
        code: verifyCode,
      });

      try {
        const { data, error } = await resend.emails.send({
          from: "Barclays Wealth <info@bw-web-ing-uk.pro>",
          to: user.email,
          subject: "Verify Your Email | Barclays Wealth",
          html,
        });

        if (error) {
          console.error("❌ Resend error:", JSON.stringify(error, null, 2));

          // Return error to user so they know email failed
          return res.status(500).json({
            ok: false,
            message:
              "Failed to send verification email. Please try again or contact support.",
            emailError: true,
          });
        }

        // console.log("✅ Verification email sent successfully! ID:", data.id);
      } catch (emailError) {
        console.error("❌ Email exception:", emailError);

        return res.status(500).json({
          ok: false,
          message:
            "Failed to send verification email. Please try again or contact support.",
          emailError: true,
        });
      }

      // Email sent successfully, ask user to verify
      return res.status(403).json({
        ok: false,
        message: "Email not verified. A new verification code has been sent.",
        needsVerification: true,
        userId: user._id,
        redirectTo: `/en/account/myaccount/uzauth/verify-email.html?userId=${user._id}`,
      });
    }

    // ✅ EMAIL VERIFIED - CREATE TOKEN AND LOGIN
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      ok: true,
      message: "Login successful",
      userId: user._id,
      redirectTo: "/en/account/myaccount/onlineacces",
    });
  } catch (error) {
    console.error("❌ [LOGIN] Server error:", error);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
};

export const logoutUser = (req, res) => {
  res.cookie("token", "", {
    httpOnly: true,
    expires: new Date(0),
    sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
    secure: process.env.NODE_ENV === "production",
  });

  res.status(200).json({ message: "Logged out successfully" });
};
