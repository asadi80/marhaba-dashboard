// src/utils/avatar.js
//
// Deterministic "identicon-style" avatar coloring: every user gets a
// consistent background/text color pair based on the first letter of
// their name, picked from a small curated palette.

export const AVATAR_PALETTE = [
  { bg: "#EEEDFE", color: "#3C3489" },
  { bg: "#E6F1FB", color: "#0C447C" },
  { bg: "#EAF3DE", color: "#27500A" },
  { bg: "#FAEEDA", color: "#633806" },
  { bg: "#E1F5EE", color: "#085041" },
  { bg: "#FBEAF0", color: "#72243E" },
];

// Picks a palette entry based on the char code of the first letter of `name`.
// Falls back to index 0 if `name` is missing.
export const getAvatarStyle = (name) =>
  AVATAR_PALETTE[(name?.charCodeAt(0) ?? 0) % AVATAR_PALETTE.length];