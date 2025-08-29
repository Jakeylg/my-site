<script>
(function(){
  const FALLBACK_IMG = 'img/pubs/placeholder.svg';

  // Try multiple globals so old/new data files both work.
  function pickInlineData() {
    if (Array.isArray(window.PUBLICATIONS_ITEMS) && window.PUBLICATIONS_ITEMS.length) return window.PUBLICATIONS_ITEMS;
    if (Array.isArray(window.PUBLICATIONS) && window.PUBLICATIONS.length) return window.PUBLICATIONS;
    return null;
  }

  async function loadData(){
    const inline = pickInlineData();
    if (inline) {
      console.log('[pubs] using inline data:', inline.length);
      return inline;
    }
    // Hosted: fetch JSON
    try{
      const resp = await fetch('publications.json?v=1', { cache:'no-store' });
      if(!resp.ok) throw new Error('HTTP '+resp.status);
      const data = await resp.json();
      console.log('[pubs] fetched publications.json:', data.length);
      return data;
    }catch(e){
      const hint = (location.protocol === 'file:') ?
        'Running from file:// — include publications.data.js or serve over http(s).' :
        'Could not load publications.json.';
      throw new Error(hint);
    }
  }

  function doiUrl(doi){
    if(!doi) return null;
    const clean = String(doi).replace(/^https?:\/\/(dx\.)?doi\.org\//i,'').trim();
    return 'https://doi.org/' + clean;
  }

  function fmtJournal(p){
    const bits = [p.journal, p.year];
    const vol   = p.volume && String(p.volume).trim();
    const issue = p.issue && String(p.issue).trim();
    const pages = p.pages && String(p.pages).trim();
    if(vol)   bits.push(vol + (issue ? `(${issue})` : ''));
    if(pages) bits.push(pages);
    return bits.filter(Boolean).join(', ');
  }

  function render(listEl, pubs, searchEl, yearEl){
    // Sort newest first (number desc > date > year)
    pubs.sort((a,b)=>{
      const aHas = Number.isFinite(+a.number);
      const bHas = Number.isFinite(+b.number);
      if (aHas && bHas && +b.number !== +a.number) return +b.number - +a.number;
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
      if(!items.length){
        listEl.innerHTML = `
          <div class="empty-note" style="color:#6b7280;padding:12px 0">
            No publications to display.
            <span style="display:block;margin-top:4px;font-size:.95em">
              If this is unexpected, check that <code>publications.data.js</code> defines
              <code>window.PUBLICATIONS</code> <em>or</em> <code>window.PUBLICATIONS_ITEMS</code>,
              or that <code>publications.json</code> is reachable.
            </span>
          </div>`;
        return;
      }

      const startNum = items.length;
      listEl.innerHTML = '';
      const collapseAll = () => {
        listEl.querySelectorAll('.pubcard.expanded').forEach(c => {
          c.classList.remove('expanded');
          c.setAttribute('aria-expanded','false');
          const btn = c.querySelector('.toggle-abs');
          const abs = c.querySelector('.abstract');
          if (btn) btn.setAttribute('aria-expanded','false');
          if (abs) abs.hidden = true;
        });
      };

      items.forEach((p, idx)=>{
        const dispNum = Number.isFinite(+p.number) ? +p.number : (startNum - idx);
        const link  = p.publisherUrl || doiUrl(p.doi) || '#';
        const hasAbstract = !!(p.abstract && String(p.abstract).trim());

        const el = document.createElement('article');
        el.className = 'pubcard';
        el.setAttribute('data-year', p.year);
        el.setAttribute('data-title', (p.title||'').toLowerCase());
        el.setAttribute('data-authors', (Array.isArray(p.authors)?p.authors.join(', '):'').toLowerCase());
        el.setAttribute('aria-expanded','false');

        el.innerHTML = `
          <figure>
            <img src="${p.tocImage || FALLBACK_IMG}" alt="" onerror="this.src='${FALLBACK_IMG}'">
          </figure>
          <div>
            <div class="pubnum">#${dispNum}</div>
            <h3>${p.title || 'Untitled'}</h3>
            <div class="meta">${(p.authors||[]).join(', ')}${p.journal||p.year? ' — ' : ''}${fmtJournal(p)}</div>
            <div class="links-row">
              ${link ? `<a href="${link}" target="_blank" rel="noopener">View</a>` : ''}
              ${p.doi ? ` • <a href="${doiUrl(p.doi)}" target="_blank" rel="noopener">DOI</a>` : ''}
              ${p.pdfUrl && p.pdfUrl!==link ? ` • <a href="${p.pdfUrl}" target="_blank" rel="noopener">PDF</a>` : ''}
            </div>
            ${hasAbstract ? `
              <button class="toggle-abs" aria-expanded="false" aria-controls="abs_${idx}">Show abstract</button>
              <div id="abs_${idx}" class="abstract" hidden>${String(p.abstract)}</div>
            ` : ''}
          </div>
        `;

        // Expand/collapse
        const btn = el.querySelector('.toggle-abs');
        if(btn){
          const abs = el.querySelector('.abstract');
          btn.addEventListener('click', e=>{
            e.stopPropagation();
            const expanded = btn.getAttribute('aria-expanded') === 'true';
            collapseAll();
            if(!expanded){
              el.classList.add('expanded');
              el.setAttribute('aria-expanded','true');
              btn.setAttribute('aria-expanded','true');
              abs.hidden = false;
            }
          });
          // Clicking card (not link) toggles too
          el.addEventListener('click', e=>{
            if(e.target.closest('a,button')) return;
            btn.click();
          });
        }

        listEl.appendChild(el);
      });
    }

    // Initial draw + filter wiring
    draw(pubs);

    function runFilter(){
      const q = (searchEl?.value || '').trim().toLowerCase();
      const y = (yearEl?.value || '').trim();
      const items = pubs.filter(p=>{
        const hay = [
          p.title || '',
          ...(p.authors || []),
          p.journal || '',
          p.abstract || ''
        ].join(' ').toLowerCase();
        const okQ = !q || hay.includes(q);
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

    try{
      const pubs = await loadData();
      render(listEl, pubs, searchEl, yearEl);
    }catch(err){
      console.error('[publications.js]', err);
      listEl.innerHTML = `<p style="color:#b91c1c">${err.message}</p>`;
    }
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', init);
  }else{
    init();
  }
})();
</script>
