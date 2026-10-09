import { useEffect } from 'react';

// Sets document.title and the meta description for the current route. This is a single-page
// app with one static index.html, so per-page SEO strings have to be applied at runtime.
export function usePageMeta(title, description, canonical) {
  useEffect(() => {
    const prevTitle = document.title;
    if (title) document.title = title;
    if (description) {
      let tag = document.querySelector('meta[name="description"]');
      if (!tag) {
        tag = document.createElement('meta');
        tag.setAttribute('name', 'description');
        document.head.appendChild(tag);
      }
      tag.setAttribute('content', description);
    }
    let link = null;
    if (canonical) {
      // The quizzes also live on the main site (iframe wrapper pages); point search engines at those (Oct 9, 2026).
      link = document.querySelector('link[rel="canonical"]');
      if (!link) { link = document.createElement('link'); link.setAttribute('rel', 'canonical'); document.head.appendChild(link); }
      link.setAttribute('href', canonical);
    }
    return () => { document.title = prevTitle; if (canonical && link) link.remove(); };
  }, [title, description, canonical]);
}
