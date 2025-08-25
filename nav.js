// Shared navigation/header for Greenfield Group
(function(){
  // Determine which page we're on to set the active state
  const path = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
  const isHome = path === '' || path === 'index.html' || path.indexOf('index') === 0;

  function link(href, label, current){
    const active = current ? ' style="font-weight:700"' : '';
    return `<a href="${href}"${active}>${label}</a>`;
  }

  // Build desktop links
  const links = [
    link('index.html#home', 'Home', isHome),
    link('research.html', 'Research', path === 'research.html'),
    link('publications.html', 'Publications', path === 'publications.html'),
    link('people.html', 'People', path === 'people.html'),
    link('news.html', 'News', path === 'news.html'),
    link('join.html', 'Join Us', path === 'join.html'),
    link('contact.html', 'Contact', path === 'contact.html'),
  ].join('');

  // Build mobile menu links (no bolding here, mirrors original)
  const mobileLinks = [
    '<a href="index.html#home" onclick="toggleMenu(false)">Home</a>',
    '<a href="research.html" onclick="toggleMenu(false)">Research</a>',
    '<a href="publications.html" onclick="toggleMenu(false)">Publications</a>',
    '<a href="people.html" onclick="toggleMenu(false)">People</a>',
    '<a href="news.html" onclick="toggleMenu(false)">News</a>',
    '<a href="join.html" onclick="toggleMenu(false)">Join Us</a>',
    '<a href="contact.html" onclick="toggleMenu(false)">Contact</a>',
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
      <nav aria-label="Primary">
        ${links}
      </nav>
      <button class="mobile-toggle" aria-controls="menu" aria-expanded="false" onclick="toggleMenu()">Menu ▾</button>
    </div>
    <div id="menu" class="container mobile-menu" style="display:none" role="dialog" aria-modal="true">
      ${mobileLinks}
    </div>
  </header>`;

  const mount = document.getElementById('site-header');
  if(mount){
    mount.outerHTML = headerHTML;
  } else {
    // If placeholder not found, insert before the first element of body
    document.body.insertAdjacentHTML('afterbegin', headerHTML);
  }
})();
