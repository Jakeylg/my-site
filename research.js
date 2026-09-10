(function(){
  document.addEventListener('click', event => {
    const button = event.target.closest('.res-toggle');
    if(!button) return;
    const details = document.getElementById(button.getAttribute('aria-controls'));
    if(!details) return;
    const expanded = button.getAttribute('aria-expanded') === 'true';
    button.setAttribute('aria-expanded', String(!expanded));
    button.textContent = expanded ? 'Read more' : 'Show less';
    details.hidden = expanded;
  });
})();
