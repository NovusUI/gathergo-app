/**
 * ExpoFire — animated flame component
 *
 * intensity: 0–100
 *   0–25   → cool flicker (small, blue-tinted, calm sway)
 *   25–55  → building flame (orange, moderate motion)
 *   55–80  → active fire (bright orange/yellow, fast sway)
 *   80–100 → inferno (white-hot core, wide, aggressive)
 *
 * Requires: react-native-svg
 */

import { useEffect, useMemo, useRef } from "react";
import Svg, { Circle, Ellipse, Path } from "react-native-svg";

// ─── types ───────────────────────────────────────────────────────────────────

interface ExpoFireProps {
  intensity: number; // 0–100
  size?: number;     // icon size in px (default 52)
}

interface EmberState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  r: number;
  ph: number;
}

// ─── helpers ─────────────────────────────────────────────────────────────────

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * clamp(t, 0, 1);
}

/** Linearly interpolate between two hex colours, returning `rgb(r,g,b)`. */
function lerpHex(hex1: string, hex2: string, t: number): string {
  const p = (h: string) => [
    parseInt(h.slice(1, 3), 16),
    parseInt(h.slice(3, 5), 16),
    parseInt(h.slice(5, 7), 16),
  ];
  const [r1, g1, b1] = p(hex1);
  const [r2, g2, b2] = p(hex2);
  return `rgb(${Math.round(lerp(r1, r2, t))},${Math.round(lerp(g1, g2, t))},${Math.round(lerp(b1, b2, t))})`;
}

// colour stops keyed to intensity 0 → 0.33 → 0.66 → 1
const STOPS = [
  { outer: "#3355ff", mid: "#6655ee", inner: "#bbccff", core: "#ddeeff" }, // 0   cool flicker
  { outer: "#ff5500", mid: "#ff9900", inner: "#ffdd00", core: "#fffacc" }, // 33  orange flame
  { outer: "#ff3300", mid: "#ff7700", inner: "#ffee00", core: "#ffffff" }, // 66  bright fire
  { outer: "#ff1100", mid: "#ff5500", inner: "#ffff88", core: "#ffffff" }, // 100 inferno
];

function getColors(intensity: number) {
  const t = clamp(intensity, 0, 100) / 100;
  const seg = t * 3;                        // 0–3
  const i = Math.min(Math.floor(seg), 2);   // 0,1,2
  const frac = seg - i;                     // 0–1 within segment
  const a = STOPS[i];
  const b = STOPS[i + 1];
  return {
    outer: lerpHex(a.outer, b.outer, frac),
    mid:   lerpHex(a.mid,   b.mid,   frac),
    inner: lerpHex(a.inner, b.inner, frac),
    core:  lerpHex(a.core,  b.core,  frac),
  };
}

/**
 * Builds a single flame path using overlapping sine waves so the shape
 * continuously morphs without ever snapping between keyframes.
 */
function buildFlamePath(
  t: number,
  cx: number,
  base: number,
  w: number,
  h: number,
  phase: number,
  wobble: number
): string {
  const sw  = Math.sin(t * 0.85 + phase) * wobble;
  const sw2 = Math.sin(t * 1.35 + phase + 1.05) * wobble * 0.55;
  const sw3 = Math.sin(t * 1.10 + phase + 2.20) * wobble * 0.35;

  const bL  = cx - w * 0.42;
  const bR  = cx + w * 0.42;

  const llx = cx - w * 0.60 + Math.sin(t * 1.55 + phase)       * w * 0.08;
  const lly = base - h * 0.27;
  const lrx = cx + w * 0.60 + Math.sin(t * 1.25 + phase + 2.0) * w * 0.08;
  const lry = base - h * 0.27;

  const ulx = cx - w * 0.27 + sw2 + sw3;
  const uly = base - h * 0.67;
  const urx = cx + w * 0.27 + sw2 - sw3;
  const ury = base - h * 0.67;

  const tipX = cx + sw;
  const tipY = base - h;

  return (
    `M${bL} ${base} ` +
    `C${llx} ${lly} ${ulx} ${uly} ${tipX} ${tipY} ` +
    `C${urx} ${ury} ${lrx} ${lry} ${bR} ${base} ` +
    `Q${cx + sw * 0.18} ${base + 5} ${bL} ${base}Z`
  );
}

function spawnEmber(cx: number, base: number, h: number, w: number): EmberState {
  return {
    x:       cx + (Math.random() - 0.5) * w * 0.45,
    y:       base - h * 0.52,
    vx:      (Math.random() - 0.5) * 1.3,
    vy:      -(Math.random() * 1.8 + 0.7),
    life:    Math.random() * 0.3,          // stagger start lives
    maxLife: 0.85 + Math.random() * 0.65,
    r:       1.2 + Math.random() * 1.8,
    ph:      Math.random() * Math.PI * 2,
  };
}

// ─── component ───────────────────────────────────────────────────────────────

export default function ExpoFire({ intensity=10, size = 52 }: ExpoFireProps) {
  const t01   = clamp(intensity, 0, 100) / 100;
  const colors = useMemo(() => getColors(intensity), [intensity]);

  // Flame geometry — normalised to `size`
  const flameH  = lerp(size * 0.48, size * 0.90, t01);
  const flameW  = lerp(size * 0.36, size * 0.76, t01);
  const wobble  = lerp(size * 0.055, size * 0.20, t01 + 5);
  const speed   = lerp(0.75, 1.90, t01);

  const cx   = size * 0.5;
  const base = size * 0.94;

  // Ember count tier (0–5), changes in integer steps to avoid
  // constant ref-array resizing.
  const numEmbers = Math.round(lerp(0, 5, t01));

  // ── refs ──────────────────────────────────────────────────────────────────

  const outerRef = useRef<any>(null);
  const midRef   = useRef<any>(null);
  const innerRef = useRef<any>(null);
  const coreRef  = useRef<any>(null);
  const emberRefs = useRef<any[]>([]);

  // A single ref that the RAF closure reads every frame — no stale values.
  const paramsRef = useRef({ flameH, flameW, wobble, speed, cx, base, numEmbers });
  useEffect(() => {
    paramsRef.current = { flameH, flameW, wobble, speed, cx, base, numEmbers };
  }, [flameH, flameW, wobble, speed, cx, base, numEmbers]);

  // Mutable ember state lives entirely in a ref — no re-renders.
  const embersRef = useRef<EmberState[]>([]);
  useEffect(() => {
    // Re-seed when ember count tier changes
    embersRef.current = Array.from({ length: numEmbers }, () =>
      spawnEmber(cx, base, flameH, flameW)
    );
  }, [numEmbers]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── animation loop ────────────────────────────────────────────────────────

  useEffect(() => {
    let raf: number;

    const tick = () => {
      const { flameH: h, flameW: w, wobble: wb, speed: sp, cx: c, base: b } =
        paramsRef.current;
      const t = (Date.now() / 1000) * sp;

      // Flame layers — each layer is narrower, shorter, and phase-shifted
      outerRef.current?.setNativeProps({
        d: buildFlamePath(t, c, b, w,        h,        0.00, wb),
      });
      midRef.current?.setNativeProps({
        d: buildFlamePath(t, c, b, w * 0.70, h * 0.80, 1.30, wb * 0.72),
      });
      innerRef.current?.setNativeProps({
        d: buildFlamePath(t, c, b, w * 0.43, h * 0.58, 2.65, wb * 0.42),
      });

      // Hot core — floats near the top of the inner flame
      coreRef.current?.setNativeProps({
        cx: c + Math.sin(t * 1.05) * wb * 0.28,
        cy: b - h * 0.62 + Math.sin(t * 1.55) * h * 0.025,
        rx: w * 0.14 + Math.sin(t * 2.05) * w * 0.025,
        ry: w * 0.09 + Math.sin(t * 1.75) * w * 0.018,
      });

      // Embers
      embersRef.current.forEach((e, i) => {
        e.life += 0.011 * sp;
        if (e.life > e.maxLife) {
          Object.assign(e, spawnEmber(c, b, h, w));
        }
        e.x += e.vx * 0.45 + Math.sin(t * 2.1 + e.ph) * 0.35;
        e.y += e.vy * 0.45;
        const p = e.life / e.maxLife;
        emberRefs.current[i]?.setNativeProps({
          cx:      e.x,
          cy:      e.y,
          r:       Math.max(0, e.r * (1 - p * 0.55)),
          opacity: Math.sin(p * Math.PI) * 0.88,
        });
      });

      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []); // runs once; reads live values from paramsRef every frame

  // ── render ────────────────────────────────────────────────────────────────

  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {/* Outer flame */}
      <Path ref={outerRef} fill={colors.outer} />

      {/* Mid flame */}
      <Path ref={midRef} fill={colors.mid} />

      {/* Inner flame */}
      <Path ref={innerRef} fill={colors.inner} />

      {/* White-hot core */}
      <Ellipse ref={coreRef} fill={colors.core} />

      {/* Rising embers */}
      {Array.from({ length: numEmbers }, (_, i) => (
        <Circle
          key={i}
          ref={(el) => { emberRefs.current[i] = el; }}
          fill={i % 2 === 0 ? colors.mid : colors.inner}
          cx={cx}
          cy={base - flameH * 0.5}
          r={1}
          opacity={0}
        />
      ))}
    </Svg>
  );
}