(function(){
  async function loadData(){
    // Priority 1: JS data file (works over file://)
    if (Array.isArray(window.PUBLICATIONS)) {
      return window.PUBLICATIONS;
    }
    // Priority 2: Fetch JSON (works when hosted over http/https)
    try{
      const resp = await fetch('publications.json', {cache:'no-store'});
      if(!resp.ok) throw new Error('HTTP '+resp.status);
      return await resp.json();
    }catch(e){
      const isFile = location.protocol === 'file:';
      throw new Error(isFile
        ? 'Running from file:// and no publications.data.js found. Edit publications.data.js or serve over http(s).'
        : 'Could not load publications.json: ' + e.message);
    }
  }

  function fmtJournal(p){
    const bits = [p.journal, p.year];
    const vol = p.volume && String(p.volume).trim();
    const issue = p.issue && String(p.issue).trim();
    const pages = p.pages && String(p.pages).trim();
    if(vol) bits.push(vol + (issue ? `(${issue})` : ''));
    if(pages) bits.push(pages);
    return bits.filter(Boolean).join(', ');
  }
  function doiUrl(doi){
    if(!doi) return null;
    const clean = String(doi).replace(/^https?:\/\/(dx\.)?doi\.org\//i,'').trim();
    return 'https://doi.org/' + clean;
  }

  function render(listEl, pubs, searchEl, yearEl){
    // Sort by manual number DESC if present; else by newest date/year
    pubs.sort((a,b)=>{
      const aHas = Number.isFinite(+a.number);
      const bHas = Number.isFinite(+b.number);
      const na = aHas ? +a.number : 0;
      const nb = bHas ? +b.number : 0;

      if (aHas && bHas && nb !== na) return nb - na;
      if (aHas && !bHas) return -1;
      if (!aHas && bHas) return 1;

      const da = a.date ? new Date(a.date).getTime() : (a.year? new Date(a.year,0,1).getTime():0);
      const db = b.date ? new Date(b.date).getTime() : (b.year? new Date(b.year,0,1).getTime():0);
      return db - da;
    });

    // Populate year filter
    if(yearEl){
      const years = [...new Set(pubs.map(p=>p.year))].filter(Boolean).sort((a,b)=>b-a);
      yearEl.innerHTML = '<option value="">All years</option>' + years.map(y=>`<option>${y}</option>`).join('');
    }

    function draw(items){
      listEl.innerHTML = '';
      const startNum = items.length;

      // Helper: enforce single expansion
      const collapseAll = () => {
        listEl.querySelectorAll('.pubcard.expanded').forEach(c => {
          c.classList.remove('expanded');
          c.setAttribute('aria-expanded','false');
          const btn = c.querySelector('.toggle-abs');
          const abs = c.querySelector('.abstract');
          if (btn) btn.setAttribute('aria-expanded','false');
          if (btn) btn.textContent = 'Show abstract';
          if (abs) abs.hidden = true;
        });
      };
      const setExpanded = (card, expanded) => {
        if (expanded) collapseAll();
        card.classList.toggle('expanded', expanded);
        card.setAttribute('aria-expanded', expanded ? 'true' : 'false');
        const btn = card.querySelector('.toggle-abs');
        const abs = card.querySelector('.abstract');
        if (btn) {
          btn.setAttribute('aria-expanded', expanded ? 'true' : 'false');
          btn.textContent = expanded ? 'Hide abstract' : 'Show abstract';
        }
        if (abs) abs.hidden = !expanded;
      };

      items.forEach((p, idx)=>{
        const dispNum = Number.isFinite(+p.number) ? +p.number : (startNum - idx);

        const id = `pub_${idx}_${(p.doi||p.title||'').toString().replace(/[^a-z0-9]+/gi,'_')}`;
        const doiLink = doiUrl(p.doi);
        const publisherUrl = p.publisherUrl || doiLink || '#';
        const hasAbstract = !!(p.abstract && String(p.abstract).trim());

        const article = document.createElement('article');
        article.className = 'pubcard';
        article.setAttribute('data-year', p.year);
        article.setAttribute('data-title', (p.title||'').toLowerCase());
        article.setAttribute('data-authors', (Array.isArray(p.authors)?p.authors.join('; '):p.authors||'').toLowerCase());
        article.id = id;
        article.setAttribute('aria-expanded','false');

        article.innerHTML = `
          <figure>
            <a href="${publisherUrl}" target="_blank" rel="noopener">
              <img loading="lazy" src="${p.tocImage || 'img/pubs/placeholder.svg'}" alt="TOC: ${p.title||''}">
            </a>
          </figure>
          <div class="pub-right">
            <h3><span class="pubnum">${dispNum}.</span>${p.title||''}
              <span class="badges"><span class="badge">${p.year || ''}</span></span>
            </h3>
            <div class="meta">${Array.isArray(p.authors)?p.authors.join('; '):p.authors||''}</div>
            <div class="meta">${fmtJournal(p)}</div>
            <div class="links-row">
              ${doiLink ? `<a href="${doiLink}" target="_blank" rel="noopener">DOI</a>` : ''}
              ${publisherUrl && publisherUrl !== doiLink ? ` · <a href="${publisherUrl}" target="_blank" rel="noopener">Publisher</a>` : ''}
              ${hasAbstract ? ` · <button class="toggle-abs" aria-expanded="false" aria-controls="${id}_abs">Show abstract</button>` : ''}
            </div>
            ${hasAbstract ? `<div id="${id}_abs" class="abstract" hidden>${p.abstract}</div>` : ''}
          </div>
        `;

        // Click anywhere on the card (except links) to toggle abstract
        article.addEventListener('click', (e)=>{
          // Ignore clicks on links/buttons inside the card that are not the toggle button
          if (e.target.closest('a')) return;

          if (hasAbstract) {
            const isOpen = article.classList.contains('expanded');
            setExpanded(article, !isOpen);
          }
        });

        // Dedicated button toggler (prevents bubbling)
        const btn = article.querySelector('.toggle-abs');
        if(btn){
          btn.addEventListener('click', (e)=>{
            e.preventDefault();
            e.stopPropagation();
            const isOpen = article.classList.contains('expanded');
            setExpanded(article, !isOpen);
          });
        }

        listEl.appendChild(article);
      });
    }

    // First draw all
    draw(pubs);

    // Filtering (preserves the current sort order)
    function runFilter(){
      const q = (searchEl && searchEl.value || '').toLowerCase().trim();
      const y = (yearEl && yearEl.value) || '';
      const items = pubs.filter(p=>{
        const text = (p.title + ' ' + (Array.isArray(p.authors)?p.authors.join(' '):p.authors)).toLowerCase();
        const okQ = !q || text.includes(q);
        const okY = !y || String(p.year) === y;
        return okQ && okY;
      });
      draw(items);
    }
    window.filterPubs = runFilter;
  }

  async function init(){
    const listEl = document.getElementById('pubList');
    const searchEl = document.getElementById('pubSearch');
    const yearEl = document.getElementById('yearFilter');
    if(!listEl){ return; }

    let pubs = [];
    try{
      pubs = await loadData();
    }catch(err){
      console.error('[publications.js]', err);
      listEl.innerHTML = `<p style="color:#b91c1c">${err.message}</p>`;
      return;
    }
    render(listEl, pubs, searchEl, yearEl);
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', init);
  }else{
    init();
  }
})();
