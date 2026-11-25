/* Geometry for the intro's liquid morph: a ring of points animated from a
   "covers the whole viewport" radius down to a clean rounded-panel radius,
   drawn as one smooth closed SVG path. Kept separate from IntroGate.jsx
   since it's pure math, easy to reason about (and tweak) on its own. */

const TAU = Math.PI * 2;
export const POINT_COUNT = 16;

/* Comfortably past the ~70.7 a 100x100 viewBox's corner needs from its
   center, so the shape fully covers the screen at every angle once the
   viewBox is non-uniformly stretched to fill it. */
const COVER_RADIUS = 100;

export function makeBlobAngles(count = POINT_COUNT) {
  return Array.from({ length: count }, (_, i) => (i / count) * TAU);
}

/* A superellipse ("squircle") radius at angle `theta` — a clean rounded
   rectangle-ish outline once the morph settles, no sharp corners. */
function squircleRadius(theta, size, power) {
  const c = Math.abs(Math.cos(theta));
  const s = Math.abs(Math.sin(theta));
  return size / Math.pow(c ** power + s ** power, 1 / power);
}

export function panelRadii(angles, size = 32, power = 5) {
  return angles.map((theta) => squircleRadius(theta, size, power));
}

export function coverRadii(angles) {
  return angles.map(() => COVER_RADIUS);
}

/* Blends cover -> panel radii at progress `t` (0..1), with an organic
   wobble layered on top that peaks mid-transition and fades to nothing at
   both ends — so it settles into a clean panel rather than staying blobby. */
export function frameRadii(angles, t, phaseOffsets, wobbleMax = 6) {
  const cover = coverRadii(angles);
  const panel = panelRadii(angles);
  const envelope = Math.sin(t * Math.PI) * wobbleMax;
  return angles.map((theta, i) => {
    const base = cover[i] + (panel[i] - cover[i]) * t;
    const wobble = envelope * Math.sin(phaseOffsets[i] + t * 6);
    return Math.max(10, base + wobble);
  });
}

/* Smooth closed path through points at (cx + r*cos theta, cy + r*sin
   theta): each edge is a quadratic Bezier whose control point is the
   vertex itself, so the curve passes near every point with no corners. */
export function blobPath(angles, radii, cx, cy) {
  const pts = angles.map((theta, i) => ({
    x: cx + radii[i] * Math.cos(theta),
    y: cy + radii[i] * Math.sin(theta),
  }));
  const n = pts.length;
  const mid = (a, b) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
  const start = mid(pts[n - 1], pts[0]);
  let d = `M ${start.x} ${start.y} `;
  for (let i = 0; i < n; i++) {
    const next = pts[(i + 1) % n];
    const m = mid(pts[i], next);
    d += `Q ${pts[i].x} ${pts[i].y} ${m.x} ${m.y} `;
  }
  return `${d}Z`;
}

export function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
}
