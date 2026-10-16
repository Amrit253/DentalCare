const modal = document.getElementById("bookingModal");
const form = document.getElementById("bookingForm");
const formError = document.getElementById("formError");
const successPanel = document.getElementById("bookingSuccess");
const captchaCode = document.getElementById("captchaCode");
const captchaInput = document.getElementById("captchaInput");
const submitButton = document.getElementById("submitBooking");
const toast = document.getElementById("toast");
let captchaAnswer = "";
let lastFocus = null;

document.getElementById("year").textContent = new Date().getFullYear();
function newCaptcha() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  captchaAnswer = Array.from({length: 5}, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  captchaCode.textContent = captchaAnswer.split("").join(" ");
  captchaInput.value = "";
}
newCaptcha();
document.getElementById("refreshCaptcha").addEventListener("click", newCaptcha);

function openModal(treatment) {
  lastFocus = document.activeElement;
  modal.classList.add("is-open");
  modal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
  form.hidden = false;
  successPanel.hidden = true;
  formError.textContent = "";
  if (treatment) document.getElementById("treatment").value = treatment;
  newCaptcha();
  setTimeout(() => document.getElementById("patientName").focus(), 50);
}
function closeModal() {
  modal.classList.remove("is-open");
  modal.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
  if (lastFocus && typeof lastFocus.focus === "function") lastFocus.focus();
}
document.querySelectorAll("[data-open-booking]").forEach(el => {
  el.addEventListener("click", event => {
    event.preventDefault();
    openModal(el.dataset.treatment || "");
    document.getElementById("navLinks").classList.remove("is-open");
    document.getElementById("menuToggle").setAttribute("aria-expanded", "false");
  });
});
document.getElementById("closeModal").addEventListener("click", closeModal);
document.getElementById("successClose").addEventListener("click", closeModal);
modal.addEventListener("click", e => { if (e.target === modal) closeModal(); });
document.addEventListener("keydown", e => { if (e.key === "Escape" && modal.classList.contains("is-open")) closeModal(); });
document.querySelectorAll("#navLinks a").forEach(a => a.addEventListener("click", () => {
  document.getElementById("navLinks").classList.remove("is-open");
  document.getElementById("menuToggle").setAttribute("aria-expanded", "false");
}));
document.getElementById("menuToggle").addEventListener("click", () => {
  const nav = document.getElementById("navLinks");
  const open = nav.classList.toggle("is-open");
  document.getElementById("menuToggle").setAttribute("aria-expanded", String(open));
});
document.getElementById("preferredDate").min = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0,10);

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 3200);
}
form.addEventListener("submit", async event => {
  event.preventDefault();
  formError.textContent = "";
  const data = Object.fromEntries(new FormData(form).entries());
  if (!form.elements.consent.checked) { formError.textContent = "Please agree to be contacted about this request."; return; }
  if (String(data.captchaInput || "").trim().toUpperCase() !== captchaAnswer) {
    formError.textContent = "The verification code doesn't match. Please try again.";
    newCaptcha();
    return;
  }
  const digits = String(data.phone || "").replace(/\D/g, "");
  if (digits.length < 10 || digits.length > 13) {
    formError.textContent = "Please enter a valid phone number (including country code if needed).";
    return;
  }
  if (!data.name || !data.treatment) { formError.textContent = "Please complete the required fields."; return; }

  const payload = {
    name: String(data.name).trim(),
    phone: String(data.phone).trim(),
    email: String(data.email || "").trim(),
    treatment: String(data.treatment),
    preferred_date: String(data.preferred_date || ""),
    message: String(data.message || "").trim(),
    consent: true,
    website: "" // honeypot field for server-side spam protection
  };
  submitButton.disabled = true;
  submitButton.innerHTML = "Submitting…";
  try {
    const response = await fetch("appointments", {
      method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify(payload)
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || "We couldn't submit your request. Please try again.");
    form.hidden = true;
    successPanel.hidden = false;
    document.getElementById("requestRef").textContent = result.reference || "received";
    form.reset();
    newCaptcha();
  } catch (error) {
    formError.textContent = error.message || "Network error. Please try again.";
    showToast("Appointment request was not submitted.");
  } finally {
    submitButton.disabled = false;
    submitButton.innerHTML = 'Submit Appointment Request <span>→</span>';
  }
});
