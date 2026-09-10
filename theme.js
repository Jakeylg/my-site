(() => {
  try {
    const saved = localStorage.getItem('gg_theme');
    const systemDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches;
    document.documentElement.setAttribute('data-theme', saved || (systemDark ? 'dark' : 'light'));
  } catch (error) {
    document.documentElement.setAttribute('data-theme', 'light');
  }
})();
