document.addEventListener("DOMContentLoaded", () => {
  const banner = document.createElement("div");
  banner.className = "notice";
  banner.innerHTML = `
    <div class="container">
      <a class="notice-link" href="/join.html">
        <span aria-hidden="true">🎓</span>
        <strong>PhD positions available for 2026</strong>
        <span class="notice-separator" aria-hidden="true">—</span>
        <span class="notice-cta">View opportunities</span>
      </a>
    </div>
  `;
  document.body.insertBefore(banner, document.body.firstChild);
});
