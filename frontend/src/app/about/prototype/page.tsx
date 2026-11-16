import Link from "next/link";
import { loadSnapshotMeta } from "@/lib/data.server";
import styles from "../about.module.css";

const DISCUSSION_URL = "https://github.com/tristandlawrence/argument-atlas/discussions/19";
const REPO_URL = "https://github.com/tristandlawrence/argument-atlas";

const QUESTIONS = [
  "Is there a user group that would find this useful that we have missed?",
  "Is there a mechanism for engaging with this kind of data that we have missed?",
  "Would you engage with this site, or not? Why?",
  "What would make it more likely to be useful to you?",
  "Would you be willing to help with the experiment? What we need is listed below.",
];

const HELP: { role: string; ask: string }[] = [
  { role: "Editors", ask: "Adopt one debate and run its research pass: what moved, what to reframe, which voices to swap." },
  { role: "A pollster or survey researcher", ask: "Check the demographic option sets and the cross-tab design before any real data exists." },
  { role: "A journalist", ask: "Curate the voices for one debate you already follow." },
  { role: "A developer", ask: "Phase 1 hardening: identity on every write, request validation, rate limiting." },
  { role: "A designer", ask: "The mobile pass." },
  { role: "A facilitator", ask: "Trial the social play mode with a small group in a room." },
  { role: "Someone with privacy-law experience", ask: "The privacy policy, before anyone real signs up." },
  { role: "An analyst", ask: "The persuasion and mind-change data, once it exists." },
];

const TOURS: { title: string; href: string; steps: string[] }[] = [
  {
    title: "Find where the nuclear debate turns",
    href: "/claim/australia-should-repeal-its-federal-ban-on-nuclear-power-generation",
    steps: ["Read the context and the timeline.", "Find the row marked CONTENTIOUS in the right-hand column.", "Hover it to see the claim’s own arguments; click to open it."],
  },
  {
    title: "Find the best argument you disagree with",
    href: "/claims?quadrant=steelman",
    steps: ["These are claims most raters judge well made but do not agree with.", "Open one and read what supports it.", "Ask whether the rating would move you."],
  },
  {
    title: "See what one claim holds up",
    href: "/claims?status=cross",
    steps: ["These claims are used in more than one debate.", "Open one and read “Where this claim is used”.", "That is the exposure the atlas makes visible."],
  },
];

export default async function PrototypePage() {
  const meta = await loadSnapshotMeta();
  const taken = meta ? new Date(meta.takenAt).toLocaleDateString("en-AU", { day: "numeric", month: "long", year: "numeric" }) : null;

  return (
    <main className={styles.main}>
      <div className={styles.crumb}>
        <Link href="/">HOME</Link> / <Link href="/about">ABOUT</Link> / THIS PROTOTYPE
      </div>
      <h1 className={styles.heading}>About this prototype</h1>
      <p className={styles.lede}>
        What you are looking at is an experiment, and we would like your help deciding whether it works. This page says where we are, what we are testing, and what
        we are asking for.
      </p>

      <section className={styles.section}>
        <h2 className={styles.sectionHeading}>WHERE WE ARE</h2>
        <p>
          Phase zero. A working prototype runs on one laptop; this site is a read-only copy of it{taken ? `, taken on ${taken}` : ""}. It is seeded with six
          debates, checked against the public record in November 2026, built as a graph of {meta?.claimCount ?? "about ninety"} claims. Nothing is hardened,
          nobody can sign up, and votes here do not persist. That is deliberate: the point of this copy is to be looked at.
        </p>
        <p>
          The things that would make it safe to open to real users, identity on every action, rate limiting, a privacy policy, are the next phase. The things
          that would make it useful at scale, duplicate detection, merging, discussion, a moderator role, are the phase after. The full plan is in the{" "}
          <a href={`${REPO_URL}/blob/main/requirements.md`} target="_blank" rel="noopener noreferrer">
            requirements document
          </a>
          .
        </p>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionHeading}>WHAT WE ARE TESTING</h2>
        <p>
          This approach depends on judgement: shaping arguments, naming where a debate turns, retiring what has gone stale. Our hypothesis is that a volunteer
          editor community and a contributing public can sustain that judgement at scale, and that readers find the result more useful than what they have now.
        </p>
        <p>
          If that is false, no amount of polish rescues it. So the questions below are about the model, not the interface. We know that whether this works is a
          question about people, not software, and we will call the experiment a success when it tells us clearly either that an editor community can be formed
          and kept, or that it cannot and why.
        </p>
        <p className={styles.sideNote}>
          How we intend to grow it, in order: an editor core first, then contributing readers on a few debates, then pollsters and researchers as consumers,
          then journalists as curators, then parties as named proposers. The engagement plan itself is written after this round, from what you tell us.
        </p>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionHeading}>A TWO-MINUTE TOUR</h2>
        <div className={styles.threeUp}>
          {TOURS.map((t) => (
            <div className={styles.cell} key={t.title}>
              <h3>
                <Link href={t.href}>{t.title} →</Link>
              </h3>
              <ol className={styles.steps}>
                {t.steps.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ol>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionHeading}>WHAT WE ARE ASKING</h2>
        <p className={styles.sectionSub}>This round is friends and colleagues. Unfiltered is fine. Reply to whoever sent you the link, or use the public thread.</p>
        <ol className={styles.questions}>
          {QUESTIONS.map((q) => (
            <li key={q}>{q}</li>
          ))}
        </ol>
        <p>
          <a className={styles.button} href={`${DISCUSSION_URL}`} target="_blank" rel="noopener noreferrer">
            Answer in the public thread on GitHub →
          </a>
        </p>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionHeading}>WHAT WOULD TELL US IT WORKS</h2>
        <ul className={styles.plain}>
          <li>At least a handful of people say they would edit, not only read.</li>
          <li>At least one pollster, researcher or journalist says the data would be useful to them.</li>
          <li>No group tells us the model is unintelligible after the two-minute tour.</li>
        </ul>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionHeading}>WHAT WE NEED</h2>
        <div className={styles.help}>
          {HELP.map((h) => (
            <div className={styles.helpRow} key={h.role}>
              <div className={styles.helpRole}>{h.role}</div>
              <div>{h.ask}</div>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionHeading}>IDEAS WE HAVE PARKED</h2>
        <p>
          <strong>Social play.</strong> Suggested by Ryan: a &ldquo;party game&rdquo; for debate, a room, a shared screen and phones, where everyone writes one argument
          for and one against and the room rates them live, with the results landing in the atlas afterwards for editors to shape. It fits the model well as a
          way to start arguments from nothing and to teach the two-signal rating by feel. Unscheduled, and in the requirements.
        </p>
      </section>

      <p className={styles.sideNote}>
        Argument Atlas is the technology project of Engage for Australia. The code and the requirements are public at{" "}
        <a href={REPO_URL} target="_blank" rel="noopener noreferrer">
          github.com/tristandlawrence/argument-atlas
        </a>
        .
      </p>
    </main>
  );
}
