const loginForm = document.getElementById("loginForm");
const keyInput = document.getElementById("apiKey");
const message = document.getElementById("message");
const tableWrap = document.getElementById("tableWrap");
const count = document.getElementById("count");
let apiKey = "";
const statuses = ["new", "contacted", "confirmed", "completed", "cancelled"];
const esc = value => String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
async function request(path, options={}) {
  const res = await fetch(path, {...options, headers: {...(options.headers||{}), Authorization: `Bearer ${apiKey}`, "Content-Type":"application/json"}});
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Request failed.");
  return data;
}
function render(items) {
  count.textContent = `${items.length} request${items.length===1?"":"s"} (latest 200)`;
  if (!items.length) { tableWrap.innerHTML = "<p>No appointment requests yet.</p>"; tableWrap.hidden = false; return; }
  const rows = items.map(item => `<tr><td>${esc(item.reference)}</td><td><strong>${esc(item.name)}</strong><br>${esc(item.phone)}<br>${esc(item.email)}</td><td>${esc(item.treatment)}<br><small>${esc(item.preferred_date || "No preferred date")}</small></td><td>${esc(item.message || "—")}</td><td>${esc(new Date(item.created_at).toLocaleString())}</td><td><select data-id="${Number(item.id)}" aria-label="Status for ${esc(item.reference)}">${statuses.map(s=>`<option value="${s}" ${s===item.status?"selected":""}>${s}</option>`).join("")}</select></td></tr>`).join("");
  tableWrap.innerHTML = `<table><thead><tr><th>Reference</th><th>Patient</th><th>Treatment</th><th>Message</th><th>Received</th><th>Status</th></tr></thead><tbody>${rows}</tbody></table>`;
  tableWrap.hidden = false;
  tableWrap.querySelectorAll("select").forEach(select => select.addEventListener("change", async () => {
    select.disabled = true;
    try { await request("admin-appointments", {method:"PATCH",body:JSON.stringify({id:Number(select.dataset.id),status:select.value})}); message.textContent = "Status updated."; message.className = "admin-message"; }
    catch (error) { message.textContent = error.message; message.className = "admin-message admin-error"; }
    finally { select.disabled = false; }
  }));
}
loginForm.addEventListener("submit", async event => {
  event.preventDefault(); apiKey = keyInput.value.trim(); message.textContent = "Loading…"; message.className = "admin-message";
  try { const data = await request("admin-appointments"); render(data.appointments || []); message.textContent = "Appointments loaded. Keep this page private and sign out by closing the tab."; }
  catch (error) { tableWrap.hidden = true; count.textContent = ""; message.textContent = error.message; message.className = "admin-message admin-error"; }
});
