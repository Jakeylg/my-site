document.addEventListener("DOMContentLoaded", () => {
  const banner = document.createElement("div");
  banner.className = "notice";
  banner.innerHTML = `
    <div class="container" style="padding:8px 0; text-align:center">
      🎓 The <strong>Greenfield Group</strong> is moving to St Andrews — October 2025.
    </div>
  `;
  document.body.insertBefore(banner, document.body.firstChild);
});