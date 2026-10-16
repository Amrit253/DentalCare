const crypto = require("crypto");

const allowedTreatments = new Set([
  "Dental Checkup", "Cleaning & Scaling", "Root Canal Treatment",
  "Braces & Alignment", "Teeth Whitening", "Dental Implants",
  "Tooth Extraction", "Other / Not sure"
]);
const json = (statusCode, body) => ({
  statusCode,
  headers: {
    "Content-Type": "application/json",
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff"
  },
  body: JSON.stringify(body)
});
const clean = (value, max) => String(value || "").trim().slice(0, max);

exports.handler = async event => {
  if (event.httpMethod === "OPTIONS") return {statusCode: 204, headers: {"Access-Control-Allow-Origin": "null"}};
  if (event.httpMethod !== "POST") return json(405, {error: "Method not allowed."});
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return json(503, {error: "Booking service is not configured yet. Please contact the clinic directly."});
  }
  let body;
  try { body = JSON.parse(event.body || "{}"); } catch { return json(400, {error: "Invalid request."}); }
  // Hidden honeypot: silently accept bot submissions without storing them.
  if (clean(body.website, 100)) return json(200, {ok: true, reference: "submitted"});
  const name = clean(body.name, 100);
  const phone = clean(body.phone, 20);
  const email = clean(body.email, 160);
  const treatment = clean(body.treatment, 80);
  const preferredDate = clean(body.preferred_date, 10);
  const message = clean(body.message, 1000);
  if (name.length < 2 || !/^[\p{L}\p{M} .'-]+$/u.test(name)) return json(400, {error: "Please enter a valid name."});
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 10 || digits.length > 13) return json(400, {error: "Please enter a valid phone number."});
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json(400, {error: "Please enter a valid email address."});
  if (!allowedTreatments.has(treatment)) return json(400, {error: "Please select a valid treatment."});
  if (preferredDate && (!/^\d{4}-\d{2}-\d{2}$/.test(preferredDate) || Number.isNaN(Date.parse(preferredDate)))) return json(400, {error: "Please choose a valid preferred date."});
  if (body.consent !== true) return json(400, {error: "Consent is required."});

  const reference = "DCC-" + crypto.randomBytes(4).toString("hex").toUpperCase();
  const record = {
    reference, name, phone, email: email || null, treatment,
    preferred_date: preferredDate || null, message: message || null,
    status: "new", consent: true, source: "website"
  };
  try {
    const response = await fetch(`${process.env.SUPABASE_URL.replace(/\/$/, "")}/rest/v1/appointments`, {
      method: "POST",
      headers: {
        "apikey": process.env.SUPABASE_SERVICE_ROLE_KEY,
        "Authorization": `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        "Content-Type": "application/json",
        "Prefer": "return=minimal"
      },
      body: JSON.stringify(record)
    });
    if (!response.ok) {
      console.error("Appointment storage failed", response.status, (await response.text()).slice(0, 300));
      return json(502, {error: "We couldn't save your request right now. Please try again later."});
    }
    return json(201, {ok: true, reference});
  } catch (error) {
    console.error("Appointment request error", error.message);
    return json(502, {error: "Booking service temporarily unavailable. Please try again later."});
  }
};