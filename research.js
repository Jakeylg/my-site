(function(){
  function toggle(button){
    const details = document.getElementById(button.getAttribute('aria-controls'));
    if(!details) return;
    const expanded = button.getAttribute('aria-expanded') === 'true';
    button.setAttribute('aria-expanded', String(!expanded));
    button.textContent = expanded ? 'Read more' : 'Show less';
    details.hidden = expanded;
  }

  document.addEventListener('click', event => {
    const button = event.target.closest('.res-toggle');
    if(button){
      toggle(button);
      return;
    }

    const card = event.target.closest('.res-card');
    if(!card || event.target.closest('a, input, select, textarea') || window.getSelection()?.toString().trim()) return;
    const cardButton = card.querySelector('.res-toggle');
    if(cardButton) toggle(cardButton);
  });
})();
