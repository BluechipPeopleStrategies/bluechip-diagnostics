// Renders one of the small line-icon paths from src/data/lunchSession.js. The path strings are
// our own fixed content (never user input), so dangerouslySetInnerHTML is safe here -- it's the
// only practical way to reuse a raw <path>/<circle>/<rect> fragment as JSX without hand-writing
// a React element tree for every icon.
export default function Icon({ paths, className = 'ico', viewBox = '0 0 24 24' }) {
  return (
    <svg className={className} viewBox={viewBox} aria-hidden="true" dangerouslySetInnerHTML={{ __html: paths }} />
  );
}
