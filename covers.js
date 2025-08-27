(function(){
  const JSON_SRC = 'covers.json';
  const FALLBACK = Array.isArray(window.COVERS_ITEMS) ? window.COVERS_ITEMS : null;

  const el = (tag, attrs={}, children=[])=>{
    const n = document.createElement(tag);
    Object.entries(attrs).forEach(([k,v])=>{
      if(k==='class') n.className=v;
      else if(k==='html') n.innerHTML=v;
      else if(k.startsWith('on') && typeof v==='function') n[k]=v;
      else n.setAttribute(k, v);
    });
    (Array.isArray(children)?children:[children]).filter(Boolean).forEach(c=>{
      n.appendChild(typeof c==='string' ? document.createTextNode(c) : c);
    });
    return n;
  };

  const state = { items: [], filtered: [], idxMap: [], activeIdx: 0 };

  const gallery = document.getElementById('covers-gallery');
  const typeSel = document.getElementById('filter-type');
  const yearSel = document.getElementById('filter-year');
  const searchEl = document.getElementById('search');
  const dlg = document.getElementById('lightbox');
  const lbImg = document.getElementById('lb-img');
  const lbCap = document.getElementById('lb-cap');
  const lbLinks = document.getElementById('lb-links');

  // --- dialog fallback (Safari, older browsers) ---
  const HAS_SHOWMODAL = !!(window.HTMLDialogElement && HTMLDialogElement.prototype && 'showModal' in HTMLDialogElement.prototype);
  if (!HAS_SHOWMODAL) {
    dlg.showModal = function(){ this.setAttribute('open',''); document.documentElement.style.overflow = 'hidden'; };
    dlg.close = function(){ this.removeAttribute('open'); document.documentElement.style.overflow = ''; };
  }

  function init(){
    if(FALLBACK){ setData(FALLBACK); }
    else fetch(JSON_SRC).then(r=>r.json()).then(setData).catch(()=>{
      gallery.innerHTML = '<p class="muted">Could not load covers.json.</p>';
    });
    bindUI();
  }

  function setData(items){
    state.items = (items||[]).map((d,i)=>({
      id: d.id || ('item-'+i),
      title: d.title || 'Untitled',
      journal: d.journal || '',
      type: d.type || 'Other',
      year: Number(d.year) || '',
      thumb: d.thumb || d.image,
      image: d.image || d.thumb,
      credit: d.credit || '',
      links: Array.isArray(d.links) ? d.links : []
    })).sort((a,b)=> (b.year||0) - (a.year||0));

    const years = [...new Set(state.items.map(d=>d.year).filter(Boolean))].sort((a,b)=>b-a);
    yearSel.innerHTML = '<option value="">All years</option>' + years.map(y=>`<option>${y}</option>`).join('');

    applyFilters();
  }

  function bindUI(){
    typeSel.addEventListener('change', applyFilters);
    yearSel.addEventListener('change', applyFilters);
    searchEl.addEventListener('input', applyFilters);

    // Lightbox nav + close
    dlg.querySelector('.prev').addEventListener('click', ()=> nav(-1));
    dlg.querySelector('.next').addEventListener('click', ()=> nav(1));
    dlg.addEventListener('keydown', (e)=>{
      if(e.key==='ArrowLeft') nav(-1);
      if(e.key==='ArrowRight') nav(1);
      if(e.key==='Escape') dlg.close();
    });
    // Click outside dialog to close (works for both native and fallback)
    dlg.addEventListener('click', (e)=>{
      const r = dlg.getBoundingClientRect();
      if(e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom){
        dlg.close();
      }
    });
  }

  function applyFilters(){
    const q = (searchEl.value || '').toLowerCase().trim();
    const t = (typeSel.value || '').trim();
    const y = (yearSel.value || '').trim();

    const filtered = [];
    const idxMap = [];

    state.items.forEach((d, i)=>{
      const okType = !t || d.type === t;
      const okYear = !y || String(d.year) === y;
      const hay = [d.title, d.journal, d.credit].join(' ').toLowerCase();
      const okQuery = !q || hay.includes(q);
      if(okType && okYear && okQuery){ filtered.push(d); idxMap.push(i); }
    });

    state.filtered = filtered;
    state.idxMap = idxMap;
    render();
  }

  function render(){
    if(!state.filtered.length){
      gallery.innerHTML = '<p class="muted">No items match your filters.</p>';
      return;
    }

    gallery.innerHTML = '';
    state.filtered.forEach((d, fi)=>{
      const fig = el('figure', {class:'gallery-card', tabindex:'0', role:'button',
        onclick:()=>openLightbox(fi),
        onkeypress:(e)=>{ if(e.key==='Enter' || e.key===' ') openLightbox(fi); }
      },[
        el('div', {class:'gallery-thumb'}, [
          el('img', {src:d.thumb, alt:`${d.title}${d.journal? ' — '+d.journal:''}`})
        ]),
        el('figcaption', {class:'gallery-cap'}, [
          el('div', {class:'gallery-title'}, d.title),
          el('div', {class:'gallery-meta muted'}, `${d.journal || d.type}${d.year? ' · '+d.year:''}`)
        ])
      ]);
      gallery.appendChild(fig);
    });
  }

  function openLightbox(filteredIdx){
    state.activeIdx = filteredIdx;
    showActive();
    dlg.showModal(); // now safe even on older browsers (polyfilled above)
  }

  function nav(delta){
    if(!state.filtered.length) return;
    state.activeIdx = (state.activeIdx + delta + state.filtered.length) % state.filtered.length;
    showActive();
  }

  function showActive(){
    const d = state.filtered[state.activeIdx];
    lbImg.src = d.image;
    lbImg.alt = d.title + (d.journal? ' — '+d.journal : '');
    lbCap.innerHTML = `
      <strong>${d.title}</strong>${d.journal? ' · '+d.journal:''}${d.year? ' · '+d.year:''}
      ${d.type? `<span class="badge" style="margin-left:8px">${d.type}</span>`:''}
      ${d.credit? `<div class="muted" style="margin-top:6px">${d.credit}</div>`:''}
    `;
    lbLinks.innerHTML = (d.links||[]).map(l=>`<a class="chip-link" href="${l.url}" target="_blank" rel="noopener">${l.label}</a>`).join('');
  }

  init();
})();
