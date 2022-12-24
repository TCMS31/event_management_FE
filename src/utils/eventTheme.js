/**
 * A deterministic colour wash per event.
 *
 * The project ships exactly one stock photograph, so a list of cards was a wall
 * of the same image. Tinting each card from a fixed palette, keyed on the
 * event's id, gives the grid visual variety without inventing content or adding
 * megabytes of imagery, and because it is derived from the id it is stable
 * across reloads and identical in every screenshot. The colours are the
 * noticeboard palette in index.css, applied with `mix-blend-mode: multiply`.
 */
const PALETTE = ['#1f5c45', '#c8462c', '#d9a331', '#2f5f6b', '#8a3b2f', '#5d6b2e'];

export const eventTint = (id) => PALETTE[Math.abs(Number(id) || 0) % PALETTE.length];
