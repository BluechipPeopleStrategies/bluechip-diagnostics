export default function ResultNarrative({ paragraphs }) {
  if (!paragraphs || paragraphs.length === 0) return null;
  return (
    <div className="bc-result-narrative">
      {paragraphs.map((p, i) => (
        <p key={i}>{p}</p>
      ))}
    </div>
  );
}
