import { useEffect, useRef } from "react";

/* Interactive water background. Moving the mouse over the parent section
   disturbs a simulated water surface: waves spread, cross, reflect off the
   edges and settle, shaded with light and shadow over the light-blue base.
   Drop it in as the first child of a `position: relative` section; it sits
   behind the content and never blocks clicks.

   How: the classic two-buffer height-field ripple. The surface is a grid
   (one cell per CELL css px); each frame every cell becomes the average of
   its neighbours minus its previous height, damped. Slope → brightness.
   The small grid is drawn to a small canvas and the browser stretches it
   smoothly to full size, so it stays cheap.

   - Mouse: a trail of drops along the path. Touch: one bigger drop per tap.
   - Off entirely for prefers-reduced-motion (the plain colour still shows).
   - Stops animating once the water is calm, so idle costs nothing. */

const BASE = [230, 242, 251]; // #E6F2FB light blue
const CELL = 4; // css px per simulation cell
const DAMPING = 0.975; // closer to 1 = waves last longer
const SPEED = 0.33; // simulation steps per frame: 1 = fast, 0.33 = a third
const DROP_SPACING = 300; // css px of mouse travel between drops
const DROP = 260; // strength of each mouse drop
const TAP_DROP = 700; // strength of a tap
const SHADE = 0.35; // how strongly slope turns into light/shadow
const CALM = 0.5; // below this everywhere, stop the loop

export default function RippleBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const host = canvas?.parentElement;
    if (!canvas || !host) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;

    const ctx = canvas.getContext("2d");
    let cols = 0;
    let rows = 0;
    let cur, prev, image;
    let frame = 0;
    let last = null;
    let pending = 0; // fractional simulation steps owed (for SPEED < 1)
    let energy = Infinity;

    function resize() {
      const { width, height } = host.getBoundingClientRect();
      cols = Math.max(3, Math.ceil(width / CELL));
      rows = Math.max(3, Math.ceil(height / CELL));
      canvas.width = cols;
      canvas.height = rows;
      cur = new Float32Array(cols * rows);
      prev = new Float32Array(cols * rows);
      image = ctx.createImageData(cols, rows);
      paint(); // flat water
    }

    function drop(cx, cy, strength) {
      const r = 2;
      for (let y = cy - r; y <= cy + r; y++) {
        for (let x = cx - r; x <= cx + r; x++) {
          if (x < 1 || y < 1 || x >= cols - 1 || y >= rows - 1) continue;
          const d = Math.hypot(x - cx, y - cy);
          if (d <= r) prev[y * cols + x] += strength * (1 - d / (r + 1));
        }
      }
      energy = Infinity;
      if (!frame) frame = requestAnimationFrame(tick);
    }

    function step() {
      let energy = 0;
      for (let y = 1; y < rows - 1; y++) {
        for (let x = 1; x < cols - 1; x++) {
          const i = y * cols + x;
          const v =
            ((cur[i - 1] + cur[i + 1] + cur[i - cols] + cur[i + cols]) / 2 - prev[i]) * DAMPING;
          prev[i] = v;
          const a = v < 0 ? -v : v;
          if (a > energy) energy = a;
        }
      }
      const t = cur;
      cur = prev;
      prev = t;
      return energy;
    }

    /* frac 0 → the previous step, 1 → the current one. After a step,
       `prev` holds the surface one step back, so blending the two gives
       the in-between frames. */
    function paint(frac = 1) {
      const px = image.data;
      const h = (j) => prev[j] + (cur[j] - prev[j]) * frac;
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const i = y * cols + x;
          // Light from the top-left: slope towards it is bright, away is dark.
          const sx = x > 0 && x < cols - 1 ? h(i - 1) - h(i + 1) : 0;
          const sy = y > 0 && y < rows - 1 ? h(i - cols) - h(i + cols) : 0;
          const s = (sx + sy) * SHADE;
          const o = i * 4;
          // Shadows lean deeper blue, highlights lean white.
          px[o] = clamp(BASE[0] + s * 1.2);
          px[o + 1] = clamp(BASE[1] + s * 0.9);
          px[o + 2] = clamp(BASE[2] + s * 0.5);
          px[o + 3] = 255;
        }
      }
      ctx.putImageData(image, 0, 0);
    }

    function tick() {
      pending += SPEED;
      while (pending >= 1) {
        energy = step();
        pending -= 1;
      }
      // Paint every frame, blending between the last two steps, so a slow
      // simulation still moves smoothly instead of stepping.
      paint(pending);
      frame = energy > CALM ? requestAnimationFrame(tick) : 0;
    }

    function point(e) {
      const rect = host.getBoundingClientRect();
      return { x: e.clientX - rect.left, y: e.clientY - rect.top }; // css px
    }

    function dropAt(p, strength) {
      drop(Math.floor(p.x / CELL), Math.floor(p.y / CELL), strength);
    }

    function onMove(e) {
      if (e.pointerType !== "mouse") return;
      const p = point(e);
      if (!last) {
        dropAt(p, DROP);
        last = p;
        return;
      }
      // One drop every DROP_SPACING px along the path, so the wake is even
      // no matter how fast the mouse moves.
      const dist = Math.hypot(p.x - last.x, p.y - last.y);
      if (dist < DROP_SPACING) return;
      const n = Math.min(60, Math.floor(dist / DROP_SPACING));
      for (let k = 1; k <= n; k++) {
        dropAt(
          { x: last.x + ((p.x - last.x) * k) / n, y: last.y + ((p.y - last.y) * k) / n },
          DROP
        );
      }
      last = p;
    }

    function onDown(e) {
      if (e.pointerType === "mouse") return;
      dropAt(point(e), TAP_DROP);
    }

    function onLeave() {
      last = null;
    }

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(host);
    host.addEventListener("pointermove", onMove);
    host.addEventListener("pointerdown", onDown);
    host.addEventListener("pointerleave", onLeave);

    return () => {
      ro.disconnect();
      host.removeEventListener("pointermove", onMove);
      host.removeEventListener("pointerdown", onDown);
      host.removeEventListener("pointerleave", onLeave);
      cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: 0,
      }}
    />
  );
}

function clamp(v) {
  return v < 0 ? 0 : v > 255 ? 255 : v;
}
