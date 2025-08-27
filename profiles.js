<script>
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

  if(!container){
    console.error('#profile-container not found');
    return;
  }

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
      if(!r.ok) throw new Error(\`HTTP \${r.status}\`);
      return r.json();
    })
    .then(data => renderProfile(data))
    .catch(err => {
      console.error(err);
      container.innerHTML = `
        <h1>Profile not found</h1>
        <p>We couldn't load <code>${slug}</code>. Make sure <code>${jsonUrl}</code> exists (case-sensitive on GitHub Pages).</p>
        <p><a class="btn btn-gray" href="people.html">Return to team overview</a></p>`;
    });

  function renderProfile(p){
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
      el('h2', {}, 'Publications'),
      renderPubList(p.publications)
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
    if(p.links && Array.isArray(p.links)){
      p.links.forEach(link=>{
        if(!link || !link.url) return;
        row.appendChild(
          el('a', {class:'chip-link', href:link.url, target:'_blank', rel:'noopener'}, [
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

    const ListTag = pubs.length > 1 ? 'ol' : 'ul';
    const list = el(ListTag, {class:'pub-list'});

    pubs.forEach(pub=>{
      const bits = [];
      if(pub.title) bits.push(`<strong>${pub.title}</strong>`);
      const meta = [pub.authors, pub.journal ? `<em>${pub.journal}</em>` : null, pub.year]
        .filter(Boolean)
        .join(', ');
      if(meta) bits.push(meta);
      if(pub.doi){
        const doiUrl = pub.doi.startsWith('http') ? pub.doi : `https://doi.org/${pub.doi}`;
        bits.push(`<a href="${doiUrl}" target="_blank" rel="noopener">DOI</a>`);
      } else if (pub.url){
        bits.push(`<a href="${pub.url}" target="_blank" rel="noopener">Link</a>`);
      }

      list.appendChild(el('li', {html: bits.join('. ') }));
    });

    return list;
  }
})();
</script>
