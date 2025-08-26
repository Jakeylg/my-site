// Shared navigation/header for Greenfield Group
(function () {
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

      <!-- Desktop nav (always visible on desktop by CSS) -->
      <nav class="desktop-nav" aria-label="Primary">
        ${linkHTML}
      </nav>

      <!-- Mobile toggle (visible only on mobile by CSS) -->
      <button class="mobile-toggle" aria-controls="menu" aria-expanded="false" type="button">
        <span aria-hidden="true">☰</span>
        <span class="sr-only">Menu</span>
      </button>
    </div>

    <!-- Mobile menu container (hidden on desktop by CSS) -->
    <div id="menu" class="container mobile-menu" hidden>
      ${linkHTML}
    </div>
  </header>
  `;

  // Inject header at top of <body>
  document.addEventListener('DOMContentLoaded', () => {
    document.body.insertAdjacentHTML('afterbegin', headerHTML);

    const menu = document.getElementById('menu');
    const toggle = document.querySelector('.mobile-toggle');

    function setMenu(open) {
      if (!menu || !toggle) return;
      toggle.setAttribute('aria-expanded', String(open));
      if (open) {
        menu.hidden = false;
        menu.classList.add('show');     // matches your CSS
      } else {
        menu.classList.remove('show');
        // use hidden to prevent accidental focus on links when closed
        menu.hidden = true;
      }
    }
    window.toggleMenu = setMenu;

    // Toggle button
    toggle.addEventListener('click', () => {
      const open = toggle.getAttribute('aria-expanded') !== 'true';
      setMenu(open);
      if (open) {
        const first = menu.querySelector('a');
        if (first) first.focus();
      }
    });

    // Close on Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') setMenu(false);
    });

    // Close when clicking a mobile menu link
    menu.addEventListener('click', (e) => {
      if (e.target.closest('a')) setMenu(false);
    });
  });
})();
