import { useEffect } from 'react';

// Sets document.title and the meta description for the current route. This is a single-page
// app with one static index.html, so per-page SEO strings have to be applied at runtime.
export function usePageMeta(title, description) {
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
    return () => { document.title = prevTitle; };
  }, [title, description]);
}
