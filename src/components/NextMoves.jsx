export default function NextMoves({ moves }) {
  if (!moves || moves.length === 0) return null;
  return (
    <>
      <h3>What to do this week.</h3>
      <ul className="bc-next-moves-list">
        {moves.map((m, i) => (
          <li key={i}>{m}</li>
        ))}
      </ul>
    </>
  );
}
