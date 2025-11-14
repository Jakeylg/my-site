document.addEventListener("DOMContentLoaded", () => {
  const banner = document.createElement("div");
  banner.className = "notice";
  banner.innerHTML = `
    <div class="container" style="padding:8px 0; text-align:center">
      🎓 <strong>PhD Student Positions Available</strong> in 2026, more details and other (potential) opportunities will be announced soon.
    </div>
  `;
  document.body.insertBefore(banner, document.body.firstChild);
});