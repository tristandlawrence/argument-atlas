import type { ReactNode } from "react";
import styles from "./Markdown.module.css";

/**
 * A deliberately small markdown subset, rendered to React elements with no
 * HTML pass-through, so community-edited prose cannot inject markup.
 *
 * Supported: paragraphs (blank-line separated), `## headings`, `- bullets`,
 * `[text](https://…)` links (http/https only), **bold**, *italic*, `code`.
 * Full CommonMark is scheduled for Phase 1 (requirements.md → Roadmap).
 */

const LINK = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/;
const BOLD = /\*\*([^*]+)\*\*/;
const ITALIC = /\*([^*]+)\*/;
const CODE = /`([^`]+)`/;

function inline(text: string, keyPrefix: string): ReactNode[] {
  const out: ReactNode[] = [];
  let rest = text;
  let i = 0;
  while (rest.length) {
    const candidates = [
      { m: LINK.exec(rest), kind: "link" },
      { m: BOLD.exec(rest), kind: "bold" },
      { m: ITALIC.exec(rest), kind: "italic" },
      { m: CODE.exec(rest), kind: "code" },
    ].filter((c) => c.m) as { m: RegExpExecArray; kind: string }[];
    if (!candidates.length) {
      out.push(rest);
      break;
    }
    const first = candidates.reduce((a, b) => (b.m.index < a.m.index ? b : a));
    const { m, kind } = first;
    if (m.index > 0) out.push(rest.slice(0, m.index));
    const key = `${keyPrefix}-${i++}`;
    if (kind === "link") {
      out.push(
        <a key={key} href={m[2]} target="_blank" rel="noopener noreferrer" className={styles.link}>
          {inline(m[1], key)}
        </a>
      );
    } else if (kind === "bold") {
      out.push(<strong key={key}>{inline(m[1], key)}</strong>);
    } else if (kind === "italic") {
      out.push(<em key={key}>{inline(m[1], key)}</em>);
    } else {
      out.push(<code key={key} className={styles.code}>{m[1]}</code>);
    }
    rest = rest.slice(m.index + m[0].length);
  }
  return out;
}

export function Markdown({ source, className }: { source: string; className?: string }) {
  const blocks = source.replace(/\r\n/g, "\n").split(/\n{2,}/).map((b) => b.trim()).filter(Boolean);
  return (
    <div className={`${styles.markdown} ${className ?? ""}`}>
      {blocks.map((block, bi) => {
        const lines = block.split("\n");
        if (lines.every((l) => /^[-*] /.test(l))) {
          return (
            <ul key={bi} className={styles.list}>
              {lines.map((l, li) => (
                <li key={li}>{inline(l.replace(/^[-*] /, ""), `${bi}-${li}`)}</li>
              ))}
            </ul>
          );
        }
        const heading = /^(#{2,3}) (.+)$/.exec(block);
        if (heading && lines.length === 1) {
          return heading[1].length === 2 ? (
            <h3 key={bi} className={styles.heading}>{inline(heading[2], `${bi}`)}</h3>
          ) : (
            <h4 key={bi} className={styles.subheading}>{inline(heading[2], `${bi}`)}</h4>
          );
        }
        return (
          <p key={bi} className={styles.paragraph}>
            {lines.map((l, li) => (
              <span key={li}>
                {inline(l, `${bi}-${li}`)}
                {li < lines.length - 1 ? <br /> : null}
              </span>
            ))}
          </p>
        );
      })}
    </div>
  );
}
