import Link from "next/link";
import { loadSnapshotMeta } from "@/lib/data.server";
import styles from "../about.module.css";

const DISCUSSION_URL = "https://github.com/tristandlawrence/argument-atlas/discussions/19";
const REPO_URL = "https://github.com/tristandlawrence/argument-atlas";

const QUESTIONS = [
  "Is there a group of people who would find this useful that we have missed?",
  "Is there a way of engaging with debates like these that we have missed?",
  "Would you use this site, or not? Why?",
  "What would make it more likely to be useful to you?",
  "Would you be willing to help? What we need is listed under “The solution”.",
];

const HELP: { role: string; ask: string }[] = [
  { role: "Editors", ask: "Adopt one debate and keep it in shape: notice what has changed, what has gone stale, and where the argument now turns." },
  { role: "A pollster or survey researcher", ask: "Tell us whether the opinion data would be useful, and how to collect it properly." },
  { role: "A journalist", ask: "Point us to the best writing on one side or the other of a debate you already follow." },
  { role: "A facilitator or teacher", ask: "Try a debate with a group and tell us what worked." },
  { role: "A developer or designer", ask: "Help get it ready for real people to sign up and take part, on any device." },
  { role: "Someone with privacy experience", ask: "Help us write a privacy policy people can trust." },
];

const TOURS: { title: string; href: string; steps: string[] }[] = [
  {
    title: "Find where the nuclear debate turns",
    href: "/claim/australia-should-repeal-its-federal-ban-on-nuclear-power-generation",
    steps: ["Read the background.", "Find the argument marked CONTENTIOUS.", "Open it to see what supports and contradicts it."],
  },
  {
    title: "Find the best argument you disagree with",
    href: "/claims?quadrant=steelman",
    steps: ["These are arguments most people found well made but did not agree with.", "Open one and read it properly.", "Ask whether it moves you."],
  },
  {
    title: "See what one argument holds up",
    href: "/claims?status=cross",
    steps: ["These arguments are used in more than one debate.", "Open one and look at “Where this claim is used”.", "If it fell, several debates would move."],
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
        What you are looking at is an early experiment, and we would like your help deciding whether it is worth building. This page says what we are trying to
        do, why, and what we are asking of you.
      </p>

      <section className={styles.section}>
        <h2 className={styles.sectionHeading}>THE AMBITION</h2>
        <p>
          A country that argues better. Where anyone can see the shape of a public debate in a few minutes: what is actually being argued, the best case on each
          side, what the evidence says, and where people genuinely disagree. And where, over time, we learn which arguments actually change people&rsquo;s minds,
          not just which ones are loudest.
        </p>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionHeading}>THE PROBLEM</h2>
        <p>
          Public debate mostly happens in feeds, where the newest and angriest post wins and yesterday&rsquo;s argument disappears. People talk past each other
          because nobody can see the whole argument at once. Polls tell us what people think, but not why, or what would move them. And good arguments made by
          the other side are rarely seen by the people who most need to hear them.
        </p>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionHeading}>THE SOLUTION</h2>
        <p>
          Take each debate apart into its arguments, and look after them together, the way an encyclopedia looks after its articles. Each argument says one thing
          and carries its evidence. People rate whether they agree, and separately whether it is well made. Each debate names the point it currently turns on,
          and that is checked again as the world moves.
        </p>
        <p>
          None of that works without people. The arguments need shaping, the debates need keeping up to date, and the judgement involved can&rsquo;t be
          automated. So the solution is really a community: readers who become raters, raters who add what is missing, and a core of editors who care about a
          debate enough to look after it. That is what we need help with.
        </p>
        <h3 className={styles.subHeading}>Who we need</h3>
        <div className={styles.help}>
          {HELP.map((h) => (
            <div className={styles.helpRow} key={h.role}>
              <div className={styles.helpRole}>{h.role}</div>
              <div>{h.ask}</div>
            </div>
          ))}
        </div>
        <h3 className={styles.subHeading}>How we would grow it</h3>
        <p>
          In order: a small group of editors first, then readers and raters on a few well-kept debates, then pollsters and researchers who can tell us whether the
          data is useful, then journalists, and only then political parties, as named proposers of their own policies. We will write that plan properly once we
          have heard from you.
        </p>
        <h3 className={styles.subHeading}>Ideas we have parked</h3>
        <p>
          <strong>Social play.</strong> Suggested by Ryan: a party game for debate. A room, a shared screen and everyone&rsquo;s phones. Someone picks a debate,
          everyone writes one argument for and one against, and the room rates them live. Afterwards the arguments join the site for editors to shape. It could be
          a great way to start new debates and to show people what &ldquo;well made, but I disagree&rdquo; feels like.
        </p>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionHeading}>WHAT WE ARE TESTING TODAY</h2>
        <p>
          Whether this approach can work at all. It depends on people making careful judgements about how arguments fit together, and on enough people being
          willing to do that well. We want to know whether you can see the value, whether you would take part, and who else should be involved.
        </p>
        <p className={styles.sideNote}>
          This is a read-only copy of the prototype{taken ? `, taken on ${taken}` : ""}, with six debates from November 2026. You can explore everything, but votes
          and edits won&rsquo;t be saved. Please judge the idea, not the polish.
        </p>
        <h3 className={styles.subHeading}>A two-minute tour</h3>
        <div className={styles.threeUp}>
          {TOURS.map((t) => (
            <div className={styles.cell} key={t.title}>
              <h3>
                <Link href={t.href}>{t.title} →</Link>
              </h3>
              <ol className={styles.steps}>
                {t.steps.map((st) => (
                  <li key={st}>{st}</li>
                ))}
              </ol>
            </div>
          ))}
        </div>
        <h3 className={styles.subHeading}>What we are asking you</h3>
        <ol className={styles.questions}>
          {QUESTIONS.map((q) => (
            <li key={q}>{q}</li>
          ))}
        </ol>
        <p className={styles.sectionSub}>Any answer is useful, including &ldquo;no&rdquo;. Reply to whoever sent you the link, or use the public thread.</p>
        <p>
          <a className={styles.button} href={DISCUSSION_URL} target="_blank" rel="noopener noreferrer">
            Answer in the public thread →
          </a>
        </p>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionHeading}>HOW WE WILL KNOW IF IT WORKS</h2>
        <ul className={styles.plain}>
          <li>Some people say they would help shape debates, not only read them.</li>
          <li>At least one pollster, researcher or journalist says this would be useful to them.</li>
          <li>Nobody tells us they couldn&rsquo;t understand it after the two-minute tour.</li>
        </ul>
        <p>
          Whether this works is a question about people, not technology. We will count the experiment a success if it tells us clearly either that a community
          like this can be built and kept going, or that it can&rsquo;t, and why.
        </p>
      </section>

      <p className={styles.sideNote}>
        Argument Atlas is the technology project of Engage for Australia. Everything, including the plans, is public at{" "}
        <a href={REPO_URL} target="_blank" rel="noopener noreferrer">
          github.com/tristandlawrence/argument-atlas
        </a>
        .
      </p>
    </main>
  );
}
