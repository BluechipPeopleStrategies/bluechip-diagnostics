// First name for anything BlueChip sends to the address or number a visitor typed (result emails,
// the contact auto-reply, the confirmation text). Letters, marks, apostrophes and hyphens only,
// first word, 40 characters: enough for any real first name, too little to carry a link, markup or
// someone else's message to a stranger under BlueChip's name.
export function safeFirstName(name) {
  const first = String(name ?? '').trim().slice(0, 120).split(/\s+/)[0] || '';
  return first.replace(/[^\p{L}\p{M}'’-]/gu, '').slice(0, 40);
}
