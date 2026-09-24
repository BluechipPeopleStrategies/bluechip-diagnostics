// Loads the site-wide lead-capture chat widget on demand (design review recommendation 1: the
// plan page's only CTA pointed at a different product's chat, because the widget was never
// loaded on this app at all). Same-origin /widget.js, so it works in dev, preview and prod
// without a hardcoded prod URL. Idempotent: safe to call from more than one component.
export function loadChatWidget() {
  if (typeof document === 'undefined') return;
  if (window.__bcwLoaded || document.querySelector('script[data-bcw-widget]')) return;
  const script = document.createElement('script');
  script.src = '/widget.js';
  script.defer = true;
  script.setAttribute('data-bcw-widget', '');
  document.body.appendChild(script);
}
