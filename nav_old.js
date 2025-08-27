// Shared navigation/header for Greenfield Group + Dark Mode
(function () {
  // --- EARLY THEME APPLY (prevents flash) ---
  try {
    const saved = localStorage.getItem('gg_theme');
    const systemDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const theme = saved || (systemDark ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', theme);
  } catch (e) {}

  // Identify current page for "active" styling
  const path = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
  const isHome = path === '' || path === 'index.html' || path.startsWith('index');

  const makeLink = (href, label, current) =>
    `<a href="${href}"${current ? ' style="font-weight:700"' : ''}>${label}</a>`;

  const linkHTML = [
    makeLink('index.html#home', 'Home', isHome),
    makeLink('research.html', 'Research', path === 'research.html'),
    makeLink('publications.html', 'Publications', path === 'publications.html'),
    makeLink('people.html', 'People', path === 'people.html'),
    makeLink('news.html', 'News', path === 'news.html'),
    makeLink('contact.html', 'Contact', path === 'contact.html')
  ].join('');

  // Theme toggle control (desktop + mobile)
  const themeToggleBtn = `
    <button class="theme-toggle" type="button" aria-pressed="false" title="Toggle dark mode">
      <span class="theme-icon" aria-hidden="true">🌗</span>
      <span class="theme-label">Dark: Off</span>
    </button>
  `;

  const headerHTML = `
  <header>
    <div class="container nav-row">
      <div class="brand">
        <div class="logo">GG</div>
        <div>
          <div style="font-weight:700">Greenfield Group</div>
          <div class="muted" style="font-size:12px">School of Chemistry · University of St Andrews</div>
        </div>
      </div>

      <!-- Desktop nav -->
      <nav class="desktop-nav" aria-label="Primary">
        ${linkHTML}
      </nav>

      <!-- Right-side actions (desktop only) -->
      <div class="nav-actions">
        ${themeToggleBtn}
      </div>

      <!-- Mobile toggle -->
      <button class="mobile-toggle" aria-controls="menu" aria-expanded="false" type="button">
        <span aria-hidden="true">☰</span>
        <span class="sr-only">Menu</span>
      </button>
    </div>

    <!-- Mobile menu -->
    <div id="menu" class="container mobile-menu" hidden>
      ${linkHTML}
      <div class="mobile-theme">${themeToggleBtn}</div>
    </div>
  </header>
  `;

  // Inject header
  document.addEventListener('DOMContentLoaded', () => {
    document.body.insertAdjacentHTML('afterbegin', headerHTML);

    const menu = document.getElementById('menu');
    const toggle = document.querySelector('.mobile-toggle');

    function setMenu(open) {
      if (!menu || !toggle) return;
      toggle.setAttribute('aria-expanded', String(open));
      if (open) {
        menu.hidden = false;
        menu.classList.add('show');
      } else {
        menu.classList.remove('show');
        menu.hidden = true;
      }
    }
    window.toggleMenu = setMenu;

    toggle.addEventListener('click', () => {
      const open = toggle.getAttribute('aria-expanded') !== 'true';
      setMenu(open);
      if (open) {
        const first = menu.querySelector('a');
        if (first) first.focus();
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') setMenu(false);
    });

    menu.addEventListener('click', (e) => {
      if (e.target.closest('a')) setMenu(false);
    });

    // --- THEME TOGGLING ---
    const allToggleBtns = document.querySelectorAll('.theme-toggle');

    function applyTheme(theme) {
      document.documentElement.setAttribute('data-theme', theme);
      try { localStorage.setItem('gg_theme', theme); } catch (e) {}
      const darkOn = theme === 'dark';
      allToggleBtns.forEach(btn => {
        btn.setAttribute('aria-pressed', String(darkOn));
        const lbl = btn.querySelector('.theme-label');
        if (lbl) lbl.textContent = `Dark: ${darkOn ? 'On' : 'Off'}`;
      });
    }

    // initialize button state from current attribute
    (function initThemeButtons() {
      const current = document.documentElement.getAttribute('data-theme') || 'light';
      applyTheme(current);
    })();

    allToggleBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const now = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        applyTheme(now);
      });
    });

    // Optional: react to system changes if user hasn't chosen manually yet
    try {
      if (!localStorage.getItem('gg_theme') && window.matchMedia) {
        const mq = window.matchMedia('(prefers-color-scheme: dark)');
        mq.addEventListener('change', e => applyTheme(e.matches ? 'dark' : 'light'));
      }
    } catch (e) {}
  });
})();
