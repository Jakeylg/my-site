(function(){
  const el = (tag, attrs={}, children=[]) => {
    const node = document.createElement(tag);
    Object.entries(attrs).forEach(([k,v])=>{
      if(k === 'class') node.className = v;
      else if(k.startsWith('on') && typeof v === 'function') node[k] = v;
      else node.setAttribute(k, v);
    });
    (Array.isArray(children)?children:[children]).filter(Boolean).forEach(c=>{
      if(typeof c === 'string') node.appendChild(document.createTextNode(c));
      else node.appendChild(c);
    });
    return node;
  };

  const params = new URLSearchParams(location.search);
  const slug = (params.get('person') || '').trim();
  const container = document.getElementById('profile-container');

  const safeHref = value => {
    if(!value) return '';
    try {
      const url = new URL(String(value), location.href);
      return ['http:', 'https:', 'mailto:'].includes(url.protocol) ? String(value) : '';
    } catch (error) {
      return '';
    }
  };

  if(!container){
    console.error('#profile-container not found');
    return;
  }

  if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)){
    showNotFound();
    return;
  }

  const jsonUrl = `data/people/${slug}.json`;

  fetch(jsonUrl)
    .then(r => {
      if(!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json();
    })
    .then(data => {
      document.title = `${data.name || 'Profile'} — Greenfield Group`;
      const canonical = document.getElementById('canonical');
      if(canonical) canonical.href = `https://imineswitch.com/profile.html?person=${encodeURIComponent(slug)}`;
      renderProfile(data);
    })
    .catch(err => {
      console.error(err);
      showNotFound();
    });

  function showNotFound(){
    container.replaceChildren(
      el('h1', {}, 'Profile not found'),
      el('p', {}, "We couldn't find that team member."),
      el('p', {}, el('a', {class:'btn btn-gray', href:'people.html'}, 'Return to team overview'))
    );
  }

  function renderProfile(p){
    const backHref = p.former ? 'alumni.html' : 'people.html';
    const backLabel = p.former ? 'Return to former members' : 'Return to team overview';
    const makeBackLink = () => el('p', {}, [
      el('a', {class:'btn btn-gray', href:backHref}, backLabel)
    ]);

    // Header
    const header = el('div', {class:'card'}, [
      el('div', {style:'display:flex;gap:20px;align-items:center;flex-wrap:wrap'}, [
        el('div', {class:'avatar-wrap', style:'width:140px;height:140px'}, [
          el('div', {class:'avatar'}, [
            el('img', {src:(p.photo && p.photo.trim()) || 'img/people/headshots/placeholder.svg', alt:`Headshot of ${p.name || '—'}`})
          ])
        ]),
        el('div', {}, [
          el('h1', {}, p.name || '—'),
          p.former ? el('span', {class:'badge'}, 'Former group member') : null,
          el('p', {class:'muted'}, p.role || ''),
          p.email ? el('p', {}, el('a', {href:safeHref(`mailto:${p.email}`)}, p.email)) : null,
          linksRow(p)
        ])
      ])
    ]);

    // Bio card
    const bio = el('article', {class:'card'}, [
      el('h2', {}, 'Bio'),
      el('p', {}, p.bio || '—')
    ]);

    // Awards card
    const awards = el('article', {class:'card'}, [
      el('h2', {}, 'Awards & Prizes'),
      (p.awards && p.awards.length)
        ? el('ul', {}, p.awards.map(a => el('li', {}, a)))
        : el('p', {class:'muted'}, '—')
    ]);

    // Education card
    const edu = el('article', {class:'card'}, [
      el('h2', {}, 'Education'),
      (p.education && p.education.length)
        ? el('ul', {}, p.education.map(e => el('li', {}, e)))
        : el('p', {class:'muted'}, '—')
    ]);

    // Publications card
    const pubs = el('article', {class:'card'}, [
      el('h2', {}, 'Publications'),
      renderPubList(p.publications)
    ]);

    container.innerHTML = '';
    container.appendChild(makeBackLink());
    container.appendChild(header);
    container.appendChild(bio);
    container.appendChild(awards);
    container.appendChild(edu);
    container.appendChild(pubs);
    container.appendChild(makeBackLink());
  }

  function linksRow(p){
    const row = el('div', {class:'chip-row'});
    if(p.links && Array.isArray(p.links)){
      p.links.forEach(link=>{
        const href = safeHref(link && link.url);
        if(!href) return;
        row.appendChild(
          el('a', {class:'chip-link', href, target:'_blank', rel:'noopener'}, [
            link.icon ? el('img', {src:link.icon, alt:''}) : null,
            ` ${link.label || link.url}`
          ])
        );
      });
    }
    return row;
  }

  // Publication list renderer
function renderPubList(pubs){
  if(!pubs || !pubs.length) return el('p', {class:'muted'}, '—');

  const list = el('ol', {
    class: 'pub-list',
    reversed: '',
    start: pubs.length
  });

  pubs.forEach(pub=>{
    const item = el('li');
    if(pub.title) item.appendChild(el('strong', {}, pub.title));

    const volumeIssue = [pub.volume, pub.issue ? `(${pub.issue})` : ''].filter(Boolean).join('');
    const meta = [pub.authors, pub.journal, volumeIssue, pub.pages, pub.year].filter(Boolean).join(', ');
    if(meta) item.append(document.createTextNode(`${pub.title ? '. ' : ''}${meta}`));

    let links = Array.isArray(pub.links) ? pub.links : [];
    if(!links.length && pub.doi) links = [{label:'DOI', url:pub.doi.startsWith('http') ? pub.doi : `https://doi.org/${pub.doi}`}];
    if(!links.length && pub.url) links = [{label:'Link', url:pub.url}];

    links.forEach(link=>{
      const href = safeHref(link && link.url);
      if(!href) return;
      item.append(
        document.createTextNode(' · '),
        el('a', {href, target:'_blank', rel:'noopener'}, link.label || 'Link')
      );
    });

    if(!item.childNodes.length){
      item.textContent = 'Publication details unavailable';
    }
    list.appendChild(item);
  });

  return list;
}
})();
