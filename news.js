
/**
 * News system with image placeholder fallback.
 * - Uses window.NEWS_ITEMS if present (works from file://)
 * - Otherwise fetches news.json (works on a server)
 * - Thumbnails always render an <img>; if missing/broken, a placeholder is used.
 */
(function(){
  const JSON_SRC = 'news.json';
  const PLACEHOLDER_SRC = 'img/news/placeholder.png';

  const FALLBACK_DATAURI = 'data:image/svg+xml;utf8,' + encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="640" height="420">
      <rect width="100%" height="100%" fill="#F5F7FA"/>
      <rect x="20" y="20" width="600" height="380" fill="none" stroke="#C8CDD2" stroke-width="3"/>
      <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle"
            font-family="system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif"
            font-size="24" fill="#5A646E">No image available</text>
    </svg>
  `);

  const HOME_TITLE   = 'Latest News';
  const HOME_TAGLINE = 'Highlights and updates from the Greenfield Group';

  const slugify = s => (s||'').toLowerCase()
    .replace(/[^a-z0-9]+/g,'-')
    .replace(/(^-|-$)/g,'');

  function el(tag, attrs={}, children=[]){
    const node = document.createElement(tag);
    Object.entries(attrs).forEach(([k,v])=>{
      if(k==='class') node.className=v;
      else if(k==='html') node.innerHTML=v;
      else node.setAttribute(k,v);
    });
    (Array.isArray(children)?children:[children]).filter(Boolean).forEach(c=>{
      if(typeof c === 'string') node.appendChild(document.createTextNode(c));
      else node.appendChild(c);
    });
    return node;
  }

  function imgWithFallback(src, alt){
    const img = document.createElement('img');
    img.loading = 'lazy';
    img.alt = alt || '';
    img.src = src || PLACEHOLDER_SRC;
    img.addEventListener('error', ()=>{
      // First fallback: placeholder file
      if(img.src.indexOf(PLACEHOLDER_SRC) === -1){
        img.src = PLACEHOLDER_SRC;
      }else{
        // Final fallback: inline data URI
        img.src = FALLBACK_DATAURI;
      }
    }, { once:true });
    return img;
  }

  function renderCard(item, mode='news'){
    const thumb = el('div', {class:'news-thumb'}, imgWithFallback(item.image, item.title));
    const meta = el('p', {class:'news-meta'}, item.date);
    const title = el('div', {class:'news-title'}, item.title);
    const excerpt = el('p', {class:'news-excerpt'}, item.excerpt || '');
    const body = el('div', {class:'news-body', html: (item.body||'').replace(/\n/g,'<br>') });

    const right = el('div', {class:'news-right'}, [meta, title, excerpt, body]);
    const card = el('article', {class:'news-card', id: slugify(item.title)}, [thumb, right]);

    if(mode === 'home'){
      card.addEventListener('click', ()=>{
        window.location.href = 'news.html#' + slugify(item.title);
      });
    } else {
      card.addEventListener('click', ()=>{
        card.classList.toggle('expanded');
      });
    }
    return card;
  }

  function renderList(container, items, mode='news'){
    const list = el('div', {class:'news-list'});
    items.forEach(it => list.appendChild(renderCard(it, mode)));
    container.innerHTML = '';
    container.appendChild(list);

    if(mode==='news' && window.location.hash){
      const id = window.location.hash.slice(1);
      const target = document.getElementById(id);
      if(target){
        target.classList.add('expanded');
        target.scrollIntoView({behavior:'smooth', block:'start'});
      }
    }
  }

  function mountHome(container, items){
    const header = el('div', {class:'news-header-box'},
      [
        el('div', {class:'news-header-title'}, HOME_TITLE),
        el('div', {class:'news-header-tag'}, HOME_TAGLINE)
      ]
    );
    container.appendChild(header);
    renderList(container, items.slice(0,3), 'home');
  }

  function start(items){
    // Normalize and sort
    items = (items||[]).map(it => ({
      ...it,
      date: new Date(it.date).toISOString().slice(0,10)
    })).sort((a,b)=> (a.date < b.date ? 1 : -1));

    const homeMount = document.getElementById('home-news');
    if(homeMount) mountHome(homeMount, items);

    const newsMount = document.getElementById('news-list');
    if(newsMount) renderList(newsMount, items, 'news');
  }

  // Prefer embedded data for file:// use
  if(Array.isArray(window.NEWS_ITEMS)){
    start(window.NEWS_ITEMS);
  } else {
    fetch(JSON_SRC).then(r=>r.json()).then(start).catch(()=>{
      // As a last resort, show nothing but keep console clean
      console.warn('News: no data source found (NEWS_ITEMS or news.json).');
    });
  }
})();
