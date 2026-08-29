const RESEND_ENDPOINT = "https://api.resend.com/emails";
const RECEIVER = "sutharmohit999@gmail.com";

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { wish } = req.body || {};

    if (typeof wish !== "string" || !wish.trim()) {
      return res.status(400).json({ error: "Wish is required" });
    }

    const cleanWish = wish.trim().slice(0, 120);

    if (!process.env.RESEND_API_KEY) {
      return res.status(500).json({ error: "Email service is not configured yet." });
    }

    const emailResponse = await fetch(RESEND_ENDPOINT, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: process.env.WISH_FROM_EMAIL || "onboarding@resend.dev",
        to: [RECEIVER],
        subject: "🌙 A wish from Mamta",
        text:
`Mamta made a wish through the birthday universe.

Her wish:
"${cleanWish}"

Sent privately from the birthday website.`
      })
    });

    if (!emailResponse.ok) {
      const detail = await emailResponse.text();
      console.error("Resend error:", detail);
      return res.status(502).json({ error: detail || "Email service could not send the wish." });
    }

    const result = await emailResponse.json().catch(()=>({}));
    return res.status(200).json({ ok: true, id: result.id || null });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Something went wrong." });
  }
};
