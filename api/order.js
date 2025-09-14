// Vercel Serverless Function: POST /api/order
export default async function handler(req, res) {
  // Autoriser uniquement la méthode POST
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "Method Not Allowed" });
  }

  try {
    const { buyer, email, group, items, total } = req.body || {};

    // Validation simple
    if (!buyer || !group || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ ok: false, error: "Invalid payload" });
    }

    // URL de l’API Airtable
    const airtableUrl = `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/${encodeURIComponent(process.env.AIRTABLE_TABLE_ORDERS)}`;

    const record = {
      fields: {
        buyer,
        email: email || "",
        group,
        items: JSON.stringify(items),   // on stocke le panier en JSON
        total: Number(total || 0)
      }
    };

    const r = await fetch(airtableUrl, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.AIRTABLE_TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ records: [record] })
    });

    if (!r.ok) {
      const errTxt = await r.text();
      console.error("Airtable error:", errTxt);
      return res.status(502).json({ ok: false, error: "Airtable error", detail: errTxt });
    }

    const data = await r.json();
    const id = data?.records?.[0]?.id || null;
    return res.status(200).json({ ok: true, id });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ ok: false, error: "Server error" });
  }
}
