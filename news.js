
/**
 * News system with image placeholder fallback.
 * - Uses window.NEWS_ITEMS from the canonical news_data.js file.
 * - Thumbnails always render an <img>; if missing/broken, a placeholder is used.
 */
(function(){
  const PLACEHOLDER_SRC = 'img/news/placeholder.png';
  const PAGE_SIZE = 12;

  const FALLBACK_DATAURI = 'data:image/svg+xml;utf8,' + encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="640" height="420">
      <rect width="100%" height="100%" fill="#F5F7FA"/>
      <rect x="20" y="20" width="600" height="380" fill="none" stroke="#C8CDD2" stroke-width="3"/>
      <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle"
            font-family="system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif"
            font-size="24" fill="#5A646E">No image available</text>
    </svg>
  `);

  const slugify = s => (s||'').toLowerCase()
    .replace(/[^a-z0-9]+/g,'-')
    .replace(/(^-|-$)/g,'');

  function el(tag, attrs={}, children=[]){
    const node = document.createElement(tag);
    Object.entries(attrs).forEach(([k,v])=>{
      if(k==='class') node.className=v;
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
    img.decoding = 'async';
    img.alt = alt || '';
    img.src = src || PLACEHOLDER_SRC;
    img.addEventListener('error', function useFallback(){
      if(img.src.indexOf(PLACEHOLDER_SRC) === -1){
        img.src = PLACEHOLDER_SRC;
      }else{
        img.removeEventListener('error', useFallback);
        img.src = FALLBACK_DATAURI;
      }
    });
    return img;
  }

  function safeUrl(value){
    try{
      const url = new URL(String(value || ''), location.href);
      return ['http:', 'https:'].includes(url.protocol) ? url.href : '';
    }catch(error){
      return '';
    }
  }

  function newsBody(value){
    const body = el('div', {class:'news-body'});
    const template = document.createElement('template');
    template.innerHTML = String(value || '');
    template.content.childNodes.forEach(node => {
      if(node.nodeType === Node.TEXT_NODE){
        node.textContent.split('\n').forEach((part, index) => {
          if(index) body.appendChild(document.createElement('br'));
          body.appendChild(document.createTextNode(part));
        });
        return;
      }
      if(node.nodeType === Node.ELEMENT_NODE && node.tagName === 'A'){
        const href = safeUrl(node.getAttribute('href'));
        if(href) body.appendChild(el('a', {href, target:'_blank', rel:'noopener'}, node.textContent));
        else body.appendChild(document.createTextNode(node.textContent));
        return;
      }
      if(node.nodeType === Node.ELEMENT_NODE && node.tagName === 'BR'){
        body.appendChild(document.createElement('br'));
        return;
      }
      body.appendChild(document.createTextNode(node.textContent || ''));
    });
    return body;
  }

  function renderCard(item, mode='news'){
    const thumb = el('div', {class:'news-thumb'}, imgWithFallback(item.image, item.title));
    const meta = el('p', {class:'news-meta'}, item.date);
    const title = el(mode === 'home' ? 'h3' : 'h2', {class:'news-title'}, item.title);
    const excerpt = el('p', {class:'news-excerpt'}, item.excerpt || '');
    const children = [meta, title, excerpt];
    if(mode === 'news'){
      const body = newsBody(item.body);
      const toggle = el('button', {class:'news-toggle', type:'button', 'aria-expanded':'false'}, 'Read more');
      toggle.addEventListener('click', ()=> setExpanded(card, !card.classList.contains('expanded')));
      children.push(body, toggle);
    }

    const right = el('div', {class:'news-right'}, children);
    const card = mode === 'home'
      ? el('a', {class:'news-card', href:'news.html#' + slugify(item.title)}, [thumb, right])
      : el('article', {class:'news-card expandable-card', id:slugify(item.title)}, [thumb, right]);

    if(mode === 'news'){
      card.addEventListener('click', event => {
        if(event.target.closest('a, button, input, select, textarea') || window.getSelection()?.toString().trim()) return;
        setExpanded(card, !card.classList.contains('expanded'));
      });
    }

    return card;
  }

  function setExpanded(card, expanded){
    card.classList.toggle('expanded', expanded);
    const button = card.querySelector('.news-toggle');
    if(button){
      button.setAttribute('aria-expanded', String(expanded));
      button.textContent = expanded ? 'Show less' : 'Read more';
    }
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
        setExpanded(target, true);
        target.scrollIntoView({behavior:'smooth', block:'start'});
      }
    }
  }

  function mountHome(container, items){
    renderList(container, items.slice(0,3), 'home');
  }

  function mountNewsArchive(container, items){
    const yearFilter = document.getElementById('news-year-filter');
    const resultsCount = document.getElementById('news-results-count');
    const loadMore = document.getElementById('news-load-more');
    let visibleCount = PAGE_SIZE;

    if(yearFilter){
      const years = [...new Set(items.map(item => item.date.slice(0,4)))];
      yearFilter.innerHTML = '<option value="">All years</option>' +
        years.map(year => `<option value="${year}">${year}</option>`).join('');
    }

    if(window.location.hash){
      const targetId = window.location.hash.slice(1);
      const targetIndex = items.findIndex(item => slugify(item.title) === targetId);
      if(targetIndex >= visibleCount) visibleCount = targetIndex + 1;
    }

    function update(){
      const selectedYear = yearFilter?.value || '';
      const filtered = selectedYear
        ? items.filter(item => item.date.startsWith(selectedYear + '-'))
        : items;
      const shown = filtered.slice(0, visibleCount);
      renderList(container, shown, 'news');

      if(resultsCount){
        resultsCount.textContent = `Showing ${shown.length} of ${filtered.length} updates`;
      }
      if(loadMore){
        loadMore.hidden = shown.length >= filtered.length;
      }
    }

    yearFilter?.addEventListener('change', () => {
      visibleCount = PAGE_SIZE;
      update();
    });
    loadMore?.addEventListener('click', () => {
      visibleCount += PAGE_SIZE;
      update();
    });

    update();
  }

  function start(items){
    // Normalize and sort
    items = (items||[]).map(it => {
      const date = new Date(it.date);
      return Number.isNaN(date.getTime()) ? null : {...it, date:date.toISOString().slice(0,10)};
    }).filter(Boolean).sort((a,b)=> (a.date < b.date ? 1 : -1));

    const homeMount = document.getElementById('home-news');
    if(homeMount) mountHome(homeMount, items);

    const newsMount = document.getElementById('news-list');
    if(newsMount) mountNewsArchive(newsMount, items);
  }

  if(Array.isArray(window.NEWS_ITEMS)){
    start(window.NEWS_ITEMS);
  } else {
    console.error('News data could not be loaded.');
  }
})();
