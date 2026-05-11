/**
 * Post the current document height to the parent window.
 * Used by the iframe-embedded app to let the Squarespace parent resize the iframe.
 */
export function postHeightToParent() {
  if (typeof window === 'undefined' || window.parent === window) return;
  const height = document.documentElement.scrollHeight;
  window.parent.postMessage({ type: 'bc-diagnostic-height', height }, '*');
}

export function startHeightObserver() {
  if (typeof window === 'undefined') return () => {};
  postHeightToParent();

  if (typeof ResizeObserver === 'undefined') {
    // Fallback: ping on a timer
    const interval = setInterval(postHeightToParent, 800);
    return () => clearInterval(interval);
  }

  const observer = new ResizeObserver(() => postHeightToParent());
  observer.observe(document.documentElement);
  return () => observer.disconnect();
}
