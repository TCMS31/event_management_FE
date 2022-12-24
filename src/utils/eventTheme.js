/**
 * A deterministic colour wash per event.
 *
 * The project ships exactly one stock photograph, so a list of cards was a wall
 * of the same image. Tinting each card from a fixed palette, keyed on the
 * event's id, gives the grid visual variety without inventing content or adding
 * megabytes of imagery — and because it is derived from the id it is stable
 * across reloads and identical in every screenshot.
 */
const PALETTE = [
  { from: '#1d4ed8', to: '#0ea5a4' },
  { from: '#7c3aed', to: '#2563eb' },
  { from: '#0f766e', to: '#65a30d' },
  { from: '#b45309', to: '#dc2626' },
  { from: '#0891b2', to: '#1e3a8a' },
  { from: '#be185d', to: '#7c3aed' },
];

export const eventTint = (id) => {
  const { from, to } = PALETTE[Math.abs(Number(id) || 0) % PALETTE.length];
  return `linear-gradient(140deg, ${from}cc 0%, ${to}b3 100%)`;
};
