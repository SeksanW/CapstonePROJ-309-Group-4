import { useEffect, useRef, useState } from "react";

/* Full-screen transition into "Design": a white screen where a koi swims
   one loop, lighting up five points as it passes them, then the white
   fades away to reveal whatever was opened underneath.

     onReveal  called as the fade starts — open the Design view here so it
               is already there as the white fades off it
     onDone    called once the fade has finished — unmount this

   Visitors with prefers-reduced-motion skip straight to the reveal. */

const POINTS = ["Evolution", "Ambition", "Balance", "Good fortune", "Prosperity"];

const SWIM_MS = 5200; // one full loop
const HOLD_MS = 500; // pause on the finished circle before fading
const FADE_MS = 700;

// SVG coordinate space (scaled to fit the screen).
const SIZE = 440;
const C = SIZE / 2;
const R = 130; // the koi's loop
const LABEL_R = 178; // where the words sit, outside the loop

// Points evenly round the circle, the first at the top. Angles in degrees,
// 0 = pointing right, increasing clockwise (screen y points down).
const pointAngles = POINTS.map((_, i) => -90 + (360 / POINTS.length) * i);
// The koi starts a little before the first point and finishes just past
// where it began, so every point gets a clear "pass".
const START = -90 - 40;
const END = START + 360 + 30;

const rad = (deg) => (deg * Math.PI) / 180;
const easeInOut = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

function Koi() {
  // Drawn facing right (+x), centred on 0,0, ~76 units long.
  return (
    <g>
      <defs>
        <linearGradient id="koi-body" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#E93E3A" />
          <stop offset="1" stopColor="#FBB040" />
        </linearGradient>
      </defs>
      {/* tail — wiggles on its own (CSS: .koi-tail) */}
      <g className="koi-tail">
        <path d="M-30 0 C -40 -6, -46 -16, -50 -18 C -46 -6, -46 6, -50 18 C -46 16, -40 6, -30 0 Z" fill="#E93E3A" opacity="0.9" />
      </g>
      {/* side fins */}
      <path d="M8 -9 C 2 -20, -8 -22, -10 -20 C -4 -16, 0 -12, 2 -8 Z" fill="#FBB040" opacity="0.85" />
      <path d="M8 9 C 2 20, -8 22, -10 20 C -4 16, 0 12, 2 8 Z" fill="#FBB040" opacity="0.85" />
      {/* body */}
      <path d="M38 0 C 34 -10, 18 -13, 2 -11 C -12 -9, -24 -5, -32 0 C -24 5, -12 9, 2 11 C 18 13, 34 10, 38 0 Z" fill="url(#koi-body)" />
      {/* white patches, like the koi on the shorts */}
      <ellipse cx="10" cy="-3" rx="8" ry="4" fill="#fff" opacity="0.9" />
      <ellipse cx="-12" cy="3" rx="6" ry="3" fill="#fff" opacity="0.85" />
      {/* eye */}
      <circle cx="30" cy="-3.5" r="1.8" fill="#000" />
    </g>
  );
}

export default function KoiTransition({ onReveal, onDone }) {
  const [angle, setAngle] = useState(START);
  const [fading, setFading] = useState(false);
  const revealed = useRef(false);

  useEffect(() => {
    const reveal = () => {
      if (revealed.current) return;
      revealed.current = true;
      onReveal?.();
      setFading(true);
    };

    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      reveal();
      const t = setTimeout(() => onDone?.(), 50);
      return () => clearTimeout(t);
    }

    let frame;
    let holdTimer;
    const start = performance.now();
    const tick = (now) => {
      const t = Math.min(1, (now - start) / SWIM_MS);
      setAngle(START + (END - START) * easeInOut(t));
      if (t < 1) frame = requestAnimationFrame(tick);
      else holdTimer = setTimeout(reveal, HOLD_MS);
    };
    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(holdTimer);
    };
    // Runs once per mount; the callbacks are only read when they fire.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!fading) return;
    const t = setTimeout(() => onDone?.(), FADE_MS);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fading]);

  const x = C + R * Math.cos(rad(angle));
  const y = C + R * Math.sin(rad(angle));
  const heading = angle + 90; // clockwise travel: tangent is 90° ahead

  return (
    <div
      className={`koi-transition${fading ? " koi-transition--fading" : ""}`}
      style={{ "--koi-fade": `${FADE_MS}ms` }}
      aria-hidden="true"
    >
      <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="koi-transition__svg">
        {/* the path it swims */}
        <circle cx={C} cy={C} r={R} fill="none" stroke="#E6E6E6" strokeWidth="1.5" strokeDasharray="3 7" />

        {POINTS.map((label, i) => {
          const a = pointAngles[i];
          // Lit once the koi has swum past it (angles only ever increase).
          const lit = angle >= a + (a < START ? 360 : 0);
          const px = C + R * Math.cos(rad(a));
          const py = C + R * Math.sin(rad(a));
          const lx = C + LABEL_R * Math.cos(rad(a));
          const ly = C + LABEL_R * Math.sin(rad(a));
          const anchor = Math.abs(lx - C) < 8 ? "middle" : lx > C ? "start" : "end";
          return (
            <g key={label} className={`koi-point${lit ? " koi-point--lit" : ""}`}>
              <circle cx={px} cy={py} r="6" className="koi-point__dot" />
              <text x={lx} y={ly} textAnchor={anchor} dominantBaseline="middle" className="koi-point__label">
                {label}
              </text>
            </g>
          );
        })}

        <g transform={`translate(${x} ${y}) rotate(${heading})`}>
          <Koi />
        </g>
      </svg>
    </div>
  );
}
