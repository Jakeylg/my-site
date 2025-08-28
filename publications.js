<script>
/* Publications + Other Publications renderer
   - Main list: uses window.PUBLICATIONS_ITEMS or publications.json
   - Other list: uses window.OTHERPUBS_ITEMS or otherpubs.json
   - Same card layout, separate sections
*/

(function(){
  const FALLBACK_IMG = 'img/pubs/placeholder.svg';

  // Utilities
  const qs  = s => document.querySelector(s);
  const qsa = s => Array.from(document.querySelectorAll(s));

  const state = {
    main: [],
    mainFiltered: [],
    other: []
  };

  // --- Card template (shared) ---
  function cardHTML(item){
    const {
      title,
      authors = [],
      journal,
      outlet,              // optional (for News & Views / biographical sketch)
      year,
      date,                // YYYY-MM-DD (optional, improves sorting)
      volume, issue, pages,
      doi,
      publisherUrl,
      pdfUrl,
      tocImage = FALLBACK_IMG,
      abstract,
      badge,               // optional short tag, e.g. "News & Views"
      type                 // optional, e.g. "Biographical Sketch"
    } = item;

    // Choose a label line: journal OR outlet
    const where = outlet || journal || '';
    const metaBits = [
      where,
      [volume, issue && `(${issue})`].filter(Boolean).join(''),
      pages
    ].filter(Boolean).join(' • ');

    // Badges to the right of title
    const badges = [];
    if (badge) badges.push(badge);
    if (type)  badges.push(type);

    // Prefer publisherUrl > pdfUrl > doi link
    const link = publisherUrl || pdfUrl || (doi ? `https://doi.org/${doi.replace(/^https?:\/\/(dx\.)?doi\.org\//i,'')}` : '');

    return `
      <article class="pubcard" tabindex="0" aria-expanded="false">
        <figure>
          <img src="${tocImage}" alt="" onerror="this.src='${FALLBACK_IMG}'">
        </figure>
        <div>
          <h3>
            ${title ? escapeHTML(title) : 'Untitled'}
            ${badges.length ? `<span class="badges">${badges.map(b=>`<span class="badge">${escapeHTML(b)}</span>`).join('')}</span>` : ''}
          </h3>
          <div class="meta">
            ${authors.join(', ')}${authors.length && (metaBits||date) ? ' — ' : ''}${metaBits}${date ? ` • ${date}` : ''}
          </div>
          ${link ? `<div class="links-row" style="margin-top:6px"><a href="${link}" target="_blank" rel="noopener">View</a>${doi && !/doi\.org/.test(link)? ` • <a href="https://doi.org/${encodeURIComponent(doi)}" target="_blank" rel="noopener">DOI</a>`:''}${pdfUrl && pdfUrl!==link? ` • <a href="${pdfUrl}" target="_blank" rel="noopener">PDF</a>`:''}</div>` : ''}
          ${abstract ? `<div class="abstract" hidden>${escapeHTML(abstract)}</div>` : ''}
        </div>
      </article>
    `;
  }

  // Toggle expand on click/Enter
  function wireCardBehavior(container){
    container.addEventListener('click', e=>{
      const card = e.target.closest('.pubcard');
      if(!card) return;
      toggleCard(card);
    });
    container.addEventListener('keydown', e=>{
      if(e.key === 'Enter' || e.key === ' '){
        const card = e.target.closest('.pubcard');
        if(!card) return;
        e.preventDefault();
        toggleCard(card);
      }
    });
    function toggleCard(card){
      const abs = card.querySelector('.abstract');
      const expanded = card.getAttribute('aria-expanded') === 'true';
      card.setAttribute('aria-expanded', String(!expanded));
      card.classList.toggle('expanded', !expanded);
      if(abs){
        abs.hidden = expanded; // show when expanding
      }
    }
  }

  // Escape for text nodes placed into HTML strings
  function escapeHTML(str){
    return String(str).replace(/[&<>"']/g, s=>({
      '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
    }[s]));
  }

  // --- MAIN LIST: load, render, filter ---
  const pubListEl  = qs('#pubList');
  const yearSel    = qs('#yearFilter');
  const searchBox  = qs('#pubSearch');

  init();

  async function init(){
    // Load main items
    state.main = await loadJSON(window.PUBLICATIONS_ITEMS, 'publications.json');
    // Sort newest first (date then year)
    state.main.sort((a,b)=>{
      const da = a.date || `${a.year||0}-01-01`;
      const db = b.date || `${b.year||0}-01-01`;
      return db.localeCompare(da);
    });

    // Populate year filter
    const years = Array.from(new Set(state.main.map(p=>p.year).filter(Boolean))).sort((a,b)=>b-a);
    yearSel.innerHTML = `<option value="">All years</option>` + years.map(y=>`<option value="${y}">${y}</option>`).join('');

    // Initial render
    state.mainFiltered = state.main.slice();
    renderList(state.mainFiltered, pubListEl);
    wireCardBehavior(pubListEl);

    // Load other section (no filtering tied to main)
    const otherListEl = qs('#otherList');
    if(otherListEl){
      state.other = await loadJSON(window.OTHERPUBS_ITEMS, 'otherpubs.json');
      // Sort newest first too
      state.other.sort((a,b)=>{
        const da = a.date || `${a.year||0}-01-01`;
        const db = b.date || `${b.year||0}-01-01`;
        return db.localeCompare(da);
      });
      renderList(state.other, otherListEl);
      wireCardBehavior(otherListEl);
    }
  }

  function renderList(items, container){
    container.innerHTML = items.map(cardHTML).join('');
  }

  // Shared filter (applies only to main list)
  window.filterPubs = function(){
    const q = (searchBox.value || '').toLowerCase().trim();
    const y = yearSel.value;

    state.mainFiltered = state.main.filter(p=>{
      const matchYear = !y || String(p.year) === y;
      if(!q) return matchYear;
      const hay = [
        p.title || '',
        ...(p.authors || []),
        p.journal || '',
        p.outlet || '',
        p.abstract || ''
      ].join(' ').toLowerCase();
      return matchYear && hay.includes(q);
    });

    renderList(state.mainFiltered, pubListEl);
  };

  // Data loader with graceful fallback
  async function loadJSON(inlineArray, url){
    if(Array.isArray(inlineArray)) return inlineArray;
    try{
      const res = await fetch(url, {cache:'no-store'});
      if(!res.ok) throw new Error(res.statusText);
      return await res.json();
    }catch(e){
      console.warn('Failed to load', url, e);
      return [];
    }
  }
})();
</script>
