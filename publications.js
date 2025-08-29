(function(){
  const FALLBACK_IMG = 'img/pubs/placeholder.svg';
  const pubListEl   = document.getElementById('pubList');
  const otherListEl = document.getElementById('otherList');
  const searchEl    = document.getElementById('pubSearch');
  const yearEl      = document.getElementById('yearFilter');

  function showError(container, msg){
    container.innerHTML = `
      <div style="background:#fef2f2;border:1px solid #fecaca;color:#7f1d1d;padding:12px;border-radius:8px">
        <strong>Couldn’t load data:</strong> ${msg}
      </div>`;
  }

  async function getJSON(url){
    try{
      const res = await fetch(url + (url.includes('?')?'':'?v=' + Date.now()), {cache:'no-store'});
      if(!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
      return await res.json();
    }catch(e){
      throw new Error(`${url} — ${e.message}`);
    }
  }

  function doiUrl(doi){
    if(!doi) return '';
    const clean = String(doi).replace(/^https?:\/\/(dx\.)?doi\.org\//i,'').trim();
    return 'https://doi.org/' + clean;
  }

  function metaLine(p){
    const where = p.journal || p.outlet || '';
    const volIssue = [p.volume, p.issue && `(${p.issue})`].filter(Boolean).join('');
    return [where, volIssue, p.pages].filter(Boolean).join(', ');
  }

  function cardHTML(p, idx){
    const link = p.publisherUrl || doiUrl(p.doi) || p.pdfUrl || '';
    const hasAbs = !!(p.abstract && String(p.abstract).trim());
    const num = Number.isFinite(+p.number) ? +p.number : '';
    return `
      <article class="pubcard" aria-expanded="false">
        <figure>
          <img src="${p.tocImage || FALLBACK_IMG}" alt="" onerror="this.src='${FALLBACK_IMG}'">
        </figure>
        <div>
          ${num ? `<div class="pubnum">#${num}</div>` : ''}
          <h3>${p.title || 'Untitled'}</h3>
          <div class="meta">
            ${(p.authors||[]).join(', ')}${(p.authors||[]).length && (p.journal||p.outlet||p.year) ? ' — ' : ''}${metaLine(p)}${p.year? (metaLine(p)?', ':'') + p.year : ''}
          </div>
          <div class="links-row">
            ${link ? `<a href="${link}" target="_blank" rel="noopener">View</a>` : ''}
            ${p.doi ? ` • <a href="${doiUrl(p.doi)}" target="_blank" rel="noopener">DOI</a>` : ''}
            ${p.pdfUrl && p.pdfUrl!==link ? ` • <a href="${p.pdfUrl}" target="_blank" rel="noopener">PDF</a>` : ''}
          </div>
          ${hasAbs ? `
            <button class="toggle-abs" aria-expanded="false" aria-controls="abs_${idx}">Show abstract</button>
            <div id="abs_${idx}" class="abstract" hidden>${String(p.abstract)}</div>
          ` : ''}
        </div>
      </article>
    `;
  }

function wireCards(container){
  function collapseAll(except){
    container.querySelectorAll('.pubcard').forEach(card=>{
      if(card === except) return;
      const btn = card.querySelector('.toggle-abs');
      const abs = card.querySelector('.abstract');
      if(btn) btn.setAttribute('aria-expanded','false');
      card.setAttribute('aria-expanded','false');
      if(abs) abs.hidden = true;
    });
  }

  // Click on card (but not on links) — accordion open/close
  container.addEventListener('click', e=>{
    const card = e.target.closest('.pubcard');
    if(!card || e.target.closest('a')) return;

    const btn = card.querySelector('.toggle-abs');
    const abs = card.querySelector('.abstract');
    if(!btn || !abs) return; // no abstract, nothing to do

    const isOpen = card.getAttribute('aria-expanded') === 'true';
    if(isOpen){
      // close current
      btn.setAttribute('aria-expanded','false');
      card.setAttribute('aria-expanded','false');
      abs.hidden = true;
      abs.setAttribute('hidden', ''); // ensure attribute is present
    }else{
      // open this one, close others
      collapseAll(card);
      btn.setAttribute('aria-expanded','true');
      card.setAttribute('aria-expanded','true');
      abs.hidden = false;
      abs.removeAttribute('hidden');   // ensure attribute is removed
    }
  });

  // Keyboard support: Enter/Space toggles via the button
  container.addEventListener('keydown', e=>{
    if(e.key !== 'Enter' && e.key !== ' ' && e.key !== 'Spacebar') return;
    const card = e.target.closest('.pubcard');
    if(!card) return;
    const btn = card.querySelector('.toggle-abs');
    if(btn){
      e.preventDefault();
      btn.click(); // re-use click logic above (will accordion)
    }
  });
}


  function render(list, container){
    if(!list || !list.length){
      container.innerHTML = `<p class="muted" style="padding:8px 0">No items to display.</p>`;
      return;
    }
    list.sort((a,b)=>{
      const da = a.date ? Date.parse(a.date) : (a.year? Date.parse(`${a.year}-01-01`):0);
      const db = b.date ? Date.parse(b.date) : (b.year? Date.parse(`${b.year}-01-01`):0);
      if(db !== da) return db - da;
      const na = Number(a.number)||0, nb = Number(b.number)||0;
      return nb - na;
    });
    container.innerHTML = list.map((p,i)=>cardHTML(p,i)).join('');
    wireCards(container);
  }

  function attachFilter(list){
    if(!searchEl || !yearEl) return;
    const years = [...new Set(list.map(p=>p.year).filter(Boolean))].sort((a,b)=>b-a);
    yearEl.innerHTML = `<option value="">All years</option>` + years.map(y=>`<option>${y}</option>`).join('');
    window.filterPubs = function(){
      const q = (searchEl.value||'').toLowerCase().trim();
      const y = (yearEl.value||'').trim();
      const filtered = list.filter(p=>{
        const okY = !y || String(p.year) === y;
        if(!q) return okY;
        const hay = [
          p.title||'',
          ...(p.authors||[]),
          p.journal||'',
          p.outlet||'',
          p.abstract||''
        ].join(' ').toLowerCase();
        return okY && hay.includes(q);
      });
      render(filtered, pubListEl);
    };
  }

  async function init(){
    try{
      const pubs = await getJSON('publications.json');
      render(pubs, pubListEl);
      attachFilter(pubs);
    }catch(err){
      showError(pubListEl, err.message);
    }

    if(otherListEl){
      try{
        const other = await getJSON('otherpubs.json');
        render(other, otherListEl);
      }catch(err){
        showError(otherListEl, err.message);
      }
    }
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', init);
  }else{
    init();
  }
})();
