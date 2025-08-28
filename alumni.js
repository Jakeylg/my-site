// alumni.js (drop-in)
(function(){
  // Where to load data
  const currentScript =
    document.currentScript ||
    (function(){ const s=document.getElementsByTagName('script'); return s[s.length-1]; })();
  const JSON_SRC = (currentScript && currentScript.dataset.jsonSrc) || 'alumni.json?v=2';

  // Helpers
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
  const escapeHTML = s => (s||'').replace(/[&<>\"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const normalize = s => (s||'').toString().toLowerCase();

  // DOM
  const listEl  = document.getElementById('alumni-list');
  const emptyEl = document.getElementById('alumni-empty');
  const q       = document.getElementById('alumni-search');
  const roleSel = document.getElementById('alumni-role');
  const yearSel = document.getElementById('alumni-year');
  const clearBtn= document.getElementById('alumni-clear');

  // State
  let items = [];
  let filtered = [];

  // Render
  function render(){
    listEl.innerHTML = '';
    if(filtered.length===0){ emptyEl.style.display='block'; return; }
    emptyEl.style.display='none';

    filtered.forEach(a=>{
      const head = el('div', {}, [
        el('div', {class:'alumni-row-1'}, [
          el('strong', {class:'alumni-name'}, a.name || 'Unknown'),
          a.role ? el('span', {class:'badge'}, a.role) : null,
          a.period ? el('span', {class:'badge'}, a.period) : null
        ]),
        a.project ? el('p', {class:'news-excerpt', html: escapeHTML(a.project)}) : null,
        a.now ? el('p', {class:'alumni-now'}, 'Now: ' + a.now) : null,
        a.slug ? el('div', {class:'links-row'}, [
          el('a', {class:'btn btn-gray', href:`profile.html?person=${encodeURIComponent(a.slug)}`}, 'View bio')
        ]) : null
      ]);

      const card = el('article', {class:'news-card alumni-card'}, [
        el('div', {class:'alumni-icon'}, [ el('span', {class:'dot', title:'Alumni'}, '') ]),
        head
      ]);

      listEl.appendChild(card);
    });
  }

  // Filters
  function applyFilters(){
    const term = normalize(q.value);
    const role = normalize(roleSel.value);
    const year = normalize(yearSel.value);

    filtered = items.filter(a=>{
      const hay = normalize([a.name, a.role, a.project, a.now, a.destination, a.period, (a.years||[]).join(' ')].join(' '));
      const roleOk = !role || normalize(a.role)===role;
      const yearOk = !year || (Array.isArray(a.years) && a.years.map(String).includes(year));
      return (!term || hay.includes(term)) && roleOk && yearOk;
    });

    render();
  }

  function populateYearFilter(){
    const years = new Set();
    items.forEach(a=> (a.years||[]).forEach(y=> years.add(String(y))));
    const yearsSorted = Array.from(years).sort((a,b)=> Number(b)-Number(a));
    yearsSorted.forEach(y=> yearSel.appendChild(el('option', {value:y}, y)));
  }

  function wire(){
    q.addEventListener('input', applyFilters);
    roleSel.addEventListener('change', applyFilters);
    yearSel.addEventListener('change', applyFilters);
    clearBtn.addEventListener('click', ()=>{
      q.value=''; roleSel.value=''; yearSel.value=''; applyFilters();
    });
  }

  // Load
  function load(){
    // Inline fallback (works if you set window.ALUMNI_ITEMS in HTML)
    if(Array.isArray(window.ALUMNI_ITEMS)){
      console.info('[alumni] Using window.ALUMNI_ITEMS (%d items).', window.ALUMNI_ITEMS.length);
      items = window.ALUMNI_ITEMS;
      afterLoad();
      return;
    }

    // Fetch JSON from file
    fetch(JSON_SRC, { cache: 'no-store' })
      .then(async r=>{
        if(!r.ok) throw new Error(`Failed to load ${JSON_SRC} (HTTP ${r.status})`);
        const text = await r.text();
        try { return JSON.parse(text); }
        catch(e1){
          try { return JSON.parse(JSON.parse(text)); } // handles accidentally quoted JSON
          catch(e2){ console.error('[alumni] JSON parse error:', e1, e2); throw e2; }
        }
      })
      .then(data=>{
        items = Array.isArray(data) ? data : (Array.isArray(data.items) ? data.items : []);
        afterLoad();
      })
      .catch(err=>{
        console.error('[alumni] Load error:', err);
        items = [];
        emptyEl.style.display = 'block';
        emptyEl.textContent = 'Could not load alumni data.';
      });
  }

  function afterLoad(){
    items = items.map(a=>({
      name:a.name||'',
      role:a.role||'',
      period:a.period||'',
      years:Array.isArray(a.years)?a.years:[],
      project:a.project||'',
      now:a.now||'',
      destination:a.destination||'',
      slug:a.slug||''
    }));
    populateYearFilter();
    wire();
    filtered = items.slice();
    render();
  }

  load();
})();
