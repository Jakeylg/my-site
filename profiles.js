(function(){
  const el = (tag, attrs={}, children=[]) => {
    const node = document.createElement(tag);
    Object.entries(attrs).forEach(([k,v])=>{
      if(k === 'class') node.className = v;
      else if(k === 'html') node.innerHTML = v;
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

  if(!slug){
    container.innerHTML = `
      <h1>Profile not found</h1>
      <p>We couldn't find that team member.</p>
      <p><a class="btn btn-gray" href="people.html">Return to team overview</a></p>`;
    return;
  }

  const jsonUrl = `data/people/${slug}.json`;

  fetch(jsonUrl, {cache:'no-store'})
    .then(r => {
      if(!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json();
    })
    .then(data => renderProfile(data))
    .catch(err => {
      console.error(err);
      container.innerHTML = `
        <h1>Profile not found</h1>
        <p>We couldn't load <code>${slug}</code>. Make sure <code>${jsonUrl}</code> exists.</p>
        <p><a class="btn btn-gray" href="people.html">Return to team overview</a></p>`;
    });

  function renderProfile(p){
    // Header
    const header = el('div', {class:'card'}, [
      el('div', {style:'display:flex;gap:20px;align-items:center;flex-wrap:wrap'}, [
        el('div', {class:'avatar-wrap', style:'width:140px;height:140px'}, [
          el('div', {class:'avatar'}, [
            el('img', {src:p.photo || 'img/people/headshots/placeholder.svg', alt:`Headshot of ${p.name}`})
          ])
        ]),
        el('div', {}, [
          el('h1', {}, p.name),
          el('p', {class:'muted'}, p.role || ''),
          p.email ? el('p', {}, el('a', {href:`mailto:${p.email}`}, p.email)) : null,
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
      el('h2', {}, 'Selected Publications'),
      (p.publications && p.publications.length)
        ? el('div', {class:'publist'}, p.publications.map((pub, i) => pubItem(pub, i+1)))
        : el('p', {class:'muted'}, '—')
    ]);

    // Back link
    const back = el('p', {}, [
      el('a', {class:'btn btn-gray', href:'people.html'}, 'Return to team overview')
    ]);

    container.innerHTML = '';
    container.appendChild(back);
    container.appendChild(header);
    container.appendChild(bio);
    container.appendChild(awards);
    container.appendChild(edu);
    container.appendChild(pubs);
    container.appendChild(back);
  }

  function linksRow(p){
    const row = el('div', {class:'chip-row'});
    if(p.links){
      p.links.forEach(link=>{
        row.appendChild(
          el('a', {class:'chip-link', href:link.url, target:'_blank', rel:'noopener'}, [
            link.icon ? el('img', {src:link.icon, alt:''}) : null,
            ` ${link.label}`
          ])
        );
      });
    }
    return row;
  }

  function pubItem(pub, n){
    const left = el('figure', {}, [
      el('img', {src: pub.image || 'img/pubs/placeholder.png', alt: pub.title || `Publication ${n}`})
    ]);

    const metaBits = [];
    if(pub.authors) metaBits.push(pub.authors);
    if(pub.journal) metaBits.push(pub.journal);
    if(pub.year)    metaBits.push(pub.year);

    const title = el('h3', {}, [
      pub.title || `Publication ${n}`,
      (pub.badges && pub.badges.length)
        ? el('span', {class:'badges'}, pub.badges.map(b => el('span', {class:'badge'}, b)))
        : null
    ]);

    const links = el('div', {class:'links-row'}, (pub.links||[]).map(L =>
      el('a', {href:L.url, target:'_blank', rel:'noopener', class:'chip-link'}, L.label)
    ));

    const right = el('div', {}, [
      title,
      metaBits.length ? el('div', {class:'meta'}, metaBits.join(' · ')) : null,
      pub.abstract ? el('p', {class:'abstract'}, pub.abstract) : null,
      links
    ]);

    const card = el('div', {class:'pubcard'}, [left, right]);
    return card;
  }
})();
