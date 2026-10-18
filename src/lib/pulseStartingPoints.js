// Keep the chosen idea visible when a returning visitor has explored >3 areas.
// Selection uses only the already qualified opportunity/future lists.
export function pulseStartingPoints(result) {
  const available = [...result.opportunities, ...result.future];
  const chosen = available.find(item => item.id === result.startingPoint?.id);
  return (chosen ? [chosen, ...available.filter(item => item.id !== chosen.id)] : available).slice(0, 3);
}
