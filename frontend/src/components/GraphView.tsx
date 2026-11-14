"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { TypeBadge, TagBadge } from "./ClassificationBadge";
import type { GraphData, GraphNode } from "@/lib/types";
import styles from "./GraphView.module.css";

/**
 * A force-directed map of every claim and connection: the atlas as a graph.
 * Dependency-free: a small simulation runs in requestAnimationFrame and
 * settles within a few seconds. Hover a node to see its title and light up
 * its neighbours; click to open the claim. Edges keep the row language:
 * green supports, red contradicts, thickness by stated strength, a dashed
 * accent stroke where editors have marked the connection contentious.
 */

const W = 1100;
const H = 720;
const STRENGTH_WIDTH: Record<string, number> = { DECISIVE: 2.6, RELEVANT: 1.6, TANGENTIAL: 0.9 };
const REST: Record<string, number> = { DECISIVE: 70, RELEVANT: 90, TANGENTIAL: 110 };

type Pos = { x: number; y: number; vx: number; vy: number };

function radius(n: GraphNode) {
  return 4 + Math.log2(1 + n.raterCount) * 1.4 + (n.isRoot ? 5 : 0) + Math.min(n.arguedByCount, 6) * 0.5;
}

function neighbourhood(data: GraphData, startId: string, depth: number) {
  const keep = new Set<string>([startId]);
  let frontier = new Set<string>([startId]);
  for (let d = 0; d < depth; d++) {
    const next = new Set<string>();
    for (const e of data.edges) {
      if (frontier.has(e.from) && !keep.has(e.to)) next.add(e.to);
      if (frontier.has(e.to) && !keep.has(e.from)) next.add(e.from);
    }
    next.forEach((id) => keep.add(id));
    frontier = next;
  }
  return keep;
}

export function GraphView({ data, focusSlug, initialTag }: { data: GraphData; focusSlug?: string; initialTag?: string }) {
  const router = useRouter();
  const [tag, setTag] = useState<string | null>(initialTag ?? null);
  const [types, setTypes] = useState<Set<string>>(new Set(["FACT", "OPINION", "VALUE", "PROPOSAL"]));
  const [depth, setDepth] = useState(2);
  const [hover, setHover] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const focusNode = useMemo(() => data.nodes.find((n) => n.slug === focusSlug) ?? null, [data, focusSlug]);

  // Which nodes are in play: the focus neighbourhood if focused, else everything.
  const visibleIds = useMemo(() => {
    const base = focusNode ? neighbourhood(data, focusNode.id, depth) : new Set(data.nodes.map((n) => n.id));
    return new Set(data.nodes.filter((n) => base.has(n.id) && types.has(n.type)).map((n) => n.id));
  }, [data, focusNode, depth, types]);

  const nodes = useMemo(() => data.nodes.filter((n) => visibleIds.has(n.id)), [data, visibleIds]);
  const edges = useMemo(() => data.edges.filter((e) => visibleIds.has(e.from) && visibleIds.has(e.to)), [data, visibleIds]);
  const index = useMemo(() => new Map(nodes.map((n, i) => [n.id, i])), [nodes]);
  const allTags = useMemo(() => Array.from(new Set(data.nodes.flatMap((n) => n.tags))).sort(), [data]);

  const pos = useRef<Pos[]>([]);
  const frame = useRef<number>(0);

  // Simulation: restart whenever the visible set changes.
  useEffect(() => {
    const n = nodes.length;
    pos.current = nodes.map((node, i) => {
      const a = (i / Math.max(1, n)) * Math.PI * 2;
      const r = node.isRoot ? 120 : 260;
      return { x: W / 2 + Math.cos(a) * r, y: H / 2 + Math.sin(a) * r, vx: 0, vy: 0 };
    });
    let alpha = 1;
    let steps = 0;
    const run = () => {
      const p = pos.current;
      // repulsion
      for (let i = 0; i < n; i++) {
        for (let j = i + 1; j < n; j++) {
          let dx = p[j].x - p[i].x;
          let dy = p[j].y - p[i].y;
          let d2 = dx * dx + dy * dy;
          if (d2 < 1) {
            dx = (Math.random() - 0.5) * 2;
            dy = (Math.random() - 0.5) * 2;
            d2 = 1;
          }
          const f = (2200 / d2) * alpha;
          const d = Math.sqrt(d2);
          const fx = (dx / d) * f;
          const fy = (dy / d) * f;
          p[i].vx -= fx;
          p[i].vy -= fy;
          p[j].vx += fx;
          p[j].vy += fy;
        }
      }
      // springs
      for (const e of edges) {
        const a = index.get(e.from);
        const b = index.get(e.to);
        if (a === undefined || b === undefined) continue;
        const dx = p[b].x - p[a].x;
        const dy = p[b].y - p[a].y;
        const d = Math.max(1, Math.sqrt(dx * dx + dy * dy));
        const k = 0.045 * alpha;
        const f = (d - REST[e.strength]) * k;
        const fx = (dx / d) * f;
        const fy = (dy / d) * f;
        p[a].vx += fx;
        p[a].vy += fy;
        p[b].vx -= fx;
        p[b].vy -= fy;
      }
      // gravity, damping, bounds
      for (let i = 0; i < n; i++) {
        const g = nodes[i].isRoot ? 0.03 : 0.012;
        p[i].vx += (W / 2 - p[i].x) * g * alpha;
        p[i].vy += (H / 2 - p[i].y) * g * alpha;
        p[i].vx *= 0.82;
        p[i].vy *= 0.82;
        p[i].x = Math.min(W - 20, Math.max(20, p[i].x + p[i].vx));
        p[i].y = Math.min(H - 20, Math.max(20, p[i].y + p[i].vy));
      }
      alpha = Math.max(0.02, alpha * 0.985);
      steps++;
      setTick((t) => t + 1);
      if (steps < 420) frame.current = requestAnimationFrame(run);
    };
    frame.current = requestAnimationFrame(run);
    return () => cancelAnimationFrame(frame.current);
  }, [nodes, edges, index]);

  const hoverNeighbours = useMemo(() => {
    if (!hover) return null;
    const set = new Set<string>([hover]);
    for (const e of edges) {
      if (e.from === hover) set.add(e.to);
      if (e.to === hover) set.add(e.from);
    }
    return set;
  }, [hover, edges]);

  const hovered = hover ? nodes[index.get(hover) ?? -1] : null;
  const hoveredPos = hover ? pos.current[index.get(hover) ?? -1] : null;

  function toggleType(t: string) {
    setTypes((prev) => {
      const next = new Set(prev);
      if (next.has(t)) next.delete(t);
      else next.add(t);
      return next;
    });
  }

  const dimmed = (id: string, nodeTags: string[]) => {
    if (hoverNeighbours && !hoverNeighbours.has(id)) return true;
    if (tag && !nodeTags.includes(tag)) return true;
    return false;
  };

  void tick;

  return (
    <main className={styles.main}>
      <div className={styles.topBar}>
        <div>
          <h1 className={styles.heading}>{focusNode ? "Around one claim" : "The atlas as a graph"}</h1>
          <p className={styles.sub}>
            {focusNode ? (
              <>
                <strong>{focusNode.title}</strong> and everything within {depth} {depth === 1 ? "step" : "steps"} of it.{" "}
                <button type="button" className={styles.linkButton} onClick={() => setDepth(depth === 1 ? 2 : depth === 2 ? 3 : 1)}>
                  Show {depth === 1 ? "two" : depth === 2 ? "three" : "one"} {depth === 3 ? "step" : "steps"}
                </button>{" "}
                · <Link href="/graph">Show the whole atlas</Link>
              </>
            ) : (
              <>
                {nodes.length} claims, {edges.length} connections. Larger circles are debate roots and claims with more raters. Hover to read a
                title and light up its neighbours; click to open the claim.
              </>
            )}
          </p>
        </div>
        <div className={styles.legend}>
          <span className={styles.legendItem}>
            <span className={styles.legendLine} style={{ background: "var(--supports)" }} /> supports
          </span>
          <span className={styles.legendItem}>
            <span className={styles.legendLine} style={{ background: "var(--contradicts)" }} /> contradicts
          </span>
          <span className={styles.legendItem}>
            <span className={`${styles.legendLine} ${styles.legendDashed}`} /> contentious
          </span>
          <span className={styles.legendItem}>thicker = decisive</span>
        </div>
      </div>

      <div className={styles.filters}>
        <span className={styles.filterLabel}>TYPES</span>
        {["FACT", "OPINION", "VALUE", "PROPOSAL"].map((t) => (
          <button
            key={t}
            type="button"
            className={`${styles.chip} ${types.has(t) ? styles.chipOn : ""}`}
            onClick={() => toggleType(t)}
            aria-pressed={types.has(t)}
          >
            <span className={`${styles.swatch} ${styles[`sw${t}`]}`} /> {t}
          </button>
        ))}
        <span className={styles.filterLabel} style={{ marginLeft: 16 }}>
          TOPIC
        </span>
        <button type="button" className={`${styles.chip} ${tag === null ? styles.chipOn : ""}`} onClick={() => setTag(null)}>
          ALL
        </button>
        {allTags.map((t) => (
          <button key={t} type="button" className={`${styles.chip} ${tag === t ? styles.chipOn : ""}`} onClick={() => setTag(tag === t ? null : t)}>
            {t}
          </button>
        ))}
      </div>

      <div className={styles.canvasWrap}>
        <svg viewBox={`0 0 ${W} ${H}`} className={styles.canvas} role="img" aria-label="Graph of claims and their connections">
          {edges.map((e) => {
            const a = pos.current[index.get(e.from) ?? -1];
            const b = pos.current[index.get(e.to) ?? -1];
            if (!a || !b) return null;
            const faded = hoverNeighbours ? !(e.from === hover || e.to === hover) : tag ? dimmed(e.from, nodes[index.get(e.from)!].tags) && dimmed(e.to, nodes[index.get(e.to)!].tags) : false;
            return (
              <line
                key={e.id}
                x1={a.x}
                y1={a.y}
                x2={b.x}
                y2={b.y}
                stroke={e.contentious ? "var(--accent)" : e.relation === "SUPPORTS" ? "var(--supports)" : "var(--contradicts)"}
                strokeWidth={STRENGTH_WIDTH[e.strength]}
                strokeDasharray={e.contentious ? "5 4" : undefined}
                opacity={faded ? 0.08 : 0.6}
              />
            );
          })}
          {nodes.map((n, i) => {
            const p = pos.current[i];
            if (!p) return null;
            const r = radius(n);
            const isDim = dimmed(n.id, n.tags);
            const isFocus = focusNode?.id === n.id;
            return (
              <g
                key={n.id}
                transform={`translate(${p.x} ${p.y})`}
                className={styles.node}
                opacity={isDim ? 0.18 : 1}
                onMouseEnter={() => setHover(n.id)}
                onMouseLeave={() => setHover(null)}
                onFocus={() => setHover(n.id)}
                onBlur={() => setHover(null)}
                onClick={() => router.push(`/claim/${n.slug}`)}
                onKeyDown={(ev) => {
                  if (ev.key === "Enter") router.push(`/claim/${n.slug}`);
                }}
                tabIndex={0}
                role="link"
                aria-label={n.title}
              >
                {isFocus && <circle r={r + 6} fill="none" stroke="var(--primary)" strokeWidth={1.5} strokeDasharray="3 3" />}
                <circle r={r} className={styles[`n${n.type}`]} />
                {(n.isRoot || isFocus || hover === n.id) && (
                  <text y={r + 12} textAnchor="middle" className={styles.label}>
                    {n.title.length > 46 ? n.title.slice(0, 44) + "…" : n.title}
                  </text>
                )}
              </g>
            );
          })}
        </svg>

        {hovered && hoveredPos && (
          <div
            className={styles.tooltip}
            style={{
              left: `${(hoveredPos.x / W) * 100}%`,
              top: `${(hoveredPos.y / H) * 100}%`,
              transform: `translate(${hoveredPos.x > W * 0.6 ? "-104%" : "12px"}, ${hoveredPos.y > H * 0.7 ? "-104%" : "12px"})`,
            }}
          >
            <div className={styles.tooltipBadges}>
              <TypeBadge type={hovered.type} />
              {hovered.tags.slice(0, 2).map((t) => (
                <TagBadge tag={t} key={t} />
              ))}
            </div>
            <div className={styles.tooltipTitle}>{hovered.title}</div>
            <div className={styles.tooltipMeta}>
              {hovered.raterCount} raters · {hovered.arguedByCount} arguments beneath · used in {hovered.usedInCount}
              {hovered.isRoot ? " · debate root" : ""} · click to open
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
