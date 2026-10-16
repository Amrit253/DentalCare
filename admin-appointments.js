const json = (statusCode, body) => ({
  statusCode,
  headers: {"Content-Type": "application/json", "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff"},
  body: JSON.stringify(body)
});
function authorized(event) {
  const expected = process.env.ADMIN_API_KEY;
  const header = event.headers.authorization || event.headers.Authorization || "";
  const supplied = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!expected || !supplied || supplied.length !== expected.length) return false;
  // Timing-safe comparison avoids leaking key comparison timing.
  const a = Buffer.from(supplied);
  const b = Buffer.from(expected);
  try { return require("crypto").timingSafeEqual(a, b); } catch { return false; }
}
exports.handler = async event => {
  if (!authorized(event)) return json(401, {error: "Unauthorized. Enter the staff API key."});
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) return json(503, {error: "Database is not configured."});
  const base = `${process.env.SUPABASE_URL.replace(/\/$/, "")}/rest/v1/appointments`;
  const headers = {
    "apikey": process.env.SUPABASE_SERVICE_ROLE_KEY,
    "Authorization": `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
    "Content-Type": "application/json",
    "Prefer": "return=representation"
  };
  try {
    if (event.httpMethod === "GET") {
      const url = new URL(base);
      url.searchParams.set("select", "id,reference,name,phone,email,treatment,preferred_date,message,status,created_at");
      url.searchParams.set("order", "created_at.desc");
      url.searchParams.set("limit", "200");
      const res = await fetch(url, {headers});
      const data = await res.json().catch(() => []);
      if (!res.ok) throw new Error("Could not retrieve appointments.");
      return json(200, {appointments: data});
    }
    if (event.httpMethod === "PATCH") {
      let body;
      try { body = JSON.parse(event.body || "{}"); } catch { return json(400, {error: "Invalid JSON."}); }
      const id = Number(body.id);
      const status = String(body.status || "");
      if (!Number.isInteger(id) || id < 1 || !["new", "contacted", "confirmed", "completed", "cancelled"].includes(status)) {
        return json(400, {error: "Invalid appointment ID or status."});
      }
      const url = new URL(base);
      url.searchParams.set("id", `eq.${id}`);
      const res = await fetch(url, {method: "PATCH", headers, body: JSON.stringify({status})});
      if (!res.ok) throw new Error("Could not update appointment.");
      return json(200, {ok: true});
    }
    return json(405, {error: "Method not allowed."});
  } catch (error) {
    console.error("Admin endpoint error", error.message);
    return json(502, {error: "Unable to complete the request. Check database setup and try again."});
  }
};