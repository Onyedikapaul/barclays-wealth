// POST /api/verify-turnstile
export const verifyTurnstileEndpoint = async (req, res) => {
  const { token } = req.body;
  if (!token) return res.status(400).json({ ok: false });

  const r = await fetch(
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

  const data = await r.json();
  return res.json({ ok: data.success === true });
};
