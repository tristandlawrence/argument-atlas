import Link from "next/link";
import styles from "./about.module.css";

/**
 * About the product: the public statement of principles and who it is for.
 * Written for the released site; the prototype page sits beside it.
 * Source of truth: requirements.md → Principles, Who this is for.
 */

const PRINCIPLES: { title: string; body: string }[] = [
  { title: "Structure over time.", body: "A debate here is not a feed that scrolls away. It is something that lasts, that people return to, and that gets better each time someone improves it." },
  { title: "Community over individual.", body: "Arguments are looked after together. What matters is whether a point is well made, not who made it first." },
  { title: "Weak arguments fade on their own.", body: "Nobody here stamps a claim \u201cdebunked\u201d. If an argument is weak, people can see that for themselves, and the community\u2019s view is the verdict." },
  { title: "Your views are counted, never exposed.", body: "We ask a little about who you are so the overall picture means something. Your own opinions are never shown, shared or used about you." },
  { title: "This is for the public good.", body: "The aim is a country that argues better: debates that are easier to follow, closer to the facts, and closer to what communities actually need." },
  { title: "Facts matter.", body: "Claims should carry their evidence, and where evidence is missing we say so, as an invitation to find it." },
  { title: "Taking part is valued.", body: "Reading carefully, giving an honest rating, and improving someone else\u2019s argument are all real contributions, and the site treats them that way." },
  { title: "Changing your mind is honourable.", body: "Being moved by a good argument is the point, not a weakness. It is the thing this site most wants to see." },
];

const PUBLIC_LADDER: { level: string; situation: string; does: string; gives: string }[] = [
  { level: "Reader", situation: "Ten minutes and a debate you half-understand.", does: "Read one debate: the context, where it turns, the strongest claim on each side.", gives: "Fewer people arguing past each other." },
  { level: "Rater", situation: "An opinion you want to count.", does: "Rate claims on agreement and on quality, separately.", gives: "Opinion data that tells persuasion from popularity." },
  { level: "Contributor", situation: "Something the debate is missing.", does: "Add a claim, a source, or a voice; challenge a misplaced connection.", gives: "A more complete, better-sourced atlas." },
  { level: "Editor", situation: "A debate you care about and can hold both sides of.", does: "Split claims, roll up arguments, mark where the debate turns, retire the stale.", gives: "Debates that keep their shape as they move." },
  { level: "Steward", situation: "An afternoon a quarter.", does: "Run the research pass on one debate: what moved, what to reframe, which voices to swap.", gives: "Debates that do not go stale between elections." },
];

const INSTITUTIONS: { who: string; wants: string; does: string; caveat: string }[] = [
  { who: "Pollsters and researchers", wants: "Not just what people think, but which arguments move them.", does: "Read the aggregate cross-tabs and the quadrant distribution; later, the persuasion and mind-change data.", caveat: "The sample is self-selected. This supplements polling; it is not a poll, and the site says so." },
  { who: "Political parties and campaigns", wants: "Their proposal argued well, and to know what lands.", does: "Enter a proposal as a named, dated option under the generic question, and read the best case against it.", caveat: "Welcome as named proposers, not as raters. Provenance is visible; votes count like anyone else’s, in aggregate." },
  { who: "News outlets and journalists", wants: "The state of a debate fast, with sources, without a partisan frame.", does: "Use the context, timeline and voices; curate the voices for a debate they cover.", caveat: "The quadrants are always shown together, so no one side can be lifted out of context." },
  { who: "Civic educators and facilitators", wants: "Material that is structured for discussion.", does: "Use a debate as the reading; run a session whose claims and ratings feed back in.", caveat: "Sessions can flood the atlas with bundled claims; the authoring standard is enforced at input." },
];

export default function AboutPage() {
  return (
    <main className={styles.main}>
      <div className={styles.crumb}>
        <Link href="/">HOME</Link> / ABOUT
      </div>
      <h1 className={styles.heading}>Arguments worth having</h1>
      <p className={styles.lede}>
        Argument Atlas takes public debates apart into claims you can read, rate and improve. Each claim says one thing. Each debate shows what supports it,
        what contradicts it, and where it currently turns. The aim is a public that argues better, and over time a record of which arguments actually move
        people.
      </p>
      <p className={styles.lede}>
        It is the technology project of <strong>Engage for Australia</strong>, a movement to make public discourse more informed by facts and more relevant to
        the needs of communities. The site is closer to an encyclopedia than a social network: the argument is the unit, not the person or the post.
      </p>
      <p className={styles.sideNote}>
        This is a prototype. <Link href="/about/prototype">Read where we are and what we are asking for →</Link>
      </p>

      <section className={styles.section}>
        <h2 className={styles.sectionHeading}>WHAT WE BELIEVE</h2>
        <ol className={styles.principles}>
          {PRINCIPLES.map((p) => (
            <li key={p.title}>
              <strong>{p.title}</strong> {p.body}
            </li>
          ))}
        </ol>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionHeading}>HOW IT IMPROVES DEBATE</h2>
        <div className={styles.threeUp}>
          <div className={styles.cell}>
            <h3>For a reader</h3>
            <p>A map of the argument instead of a feed of takes. The context, the timeline, the claim the debate turns on, and the strongest case on each side, with its sources.</p>
          </div>
          <div className={styles.cell}>
            <h3>For a debate</h3>
            <p>Claims are shaped, not shouted. Duplicates merge, bundles split, the live question is named and dated, and what has been overtaken is retired with its history intact.</p>
          </div>
          <div className={styles.cell}>
            <h3>For the public record</h3>
            <p>Two signals, agreement and quality, kept apart. The result is data about persuasion, not only popularity, with the same cross-tab shape polls use and none of the individual exposure.</p>
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionHeading}>WHO IT IS FOR</h2>
        <p className={styles.sectionSub}>Most people start as readers. The site is built so that each step up is small, and so that the people who shape debates are the people who care about them.</p>
        <div className={styles.ladder}>
          {PUBLIC_LADDER.map((r) => (
            <div className={styles.rung} key={r.level}>
              <div className={styles.rungLevel}>{r.level.toUpperCase()}</div>
              <div className={styles.rungBody}>
                <p className={styles.rungSituation}>{r.situation}</p>
                <p>{r.does}</p>
                <p className={styles.rungGives}>{r.gives}</p>
              </div>
            </div>
          ))}
        </div>
        <h3 className={styles.subHeading}>Institutions</h3>
        <div className={styles.institutions}>
          {INSTITUTIONS.map((i) => (
            <div className={styles.institution} key={i.who}>
              <h4>{i.who}</h4>
              <p>
                <span className={styles.label}>WANTS</span> {i.wants}
              </p>
              <p>
                <span className={styles.label}>DOES</span> {i.does}
              </p>
              <p className={styles.caveat}>
                <span className={styles.label}>CAVEAT</span> {i.caveat}
              </p>
            </div>
          ))}
        </div>
        <p className={styles.sectionSub}>
          The engaged public comes first, because every institution&rsquo;s use depends on an atlas that is already shaped and rated by people who care.
        </p>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionHeading}>START SOMEWHERE</h2>
        <div className={styles.links}>
          <Link href="/claims?status=root,contentious&view=cards">The debates and where they turn →</Link>
          <Link href="/claims?quadrant=steelman">The best arguments you may disagree with →</Link>
          <Link href="/graph">The whole atlas as a graph →</Link>
          <Link href="/about/prototype">About this prototype and how to help →</Link>
        </div>
      </section>
    </main>
  );
}
