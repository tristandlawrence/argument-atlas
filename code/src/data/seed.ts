import crypto from 'crypto';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const users = [
  { email: 'alice@example.com',   name: 'Alice Johnson',     password: 'password123' },
  { email: 'bob@example.com',     name: 'Bob Smith',         password: 'password123' },
  { email: 'charlie@example.com', name: 'Charlie Brown',     password: 'password123' },
  { email: 'diana@example.com',   name: 'Diana Prince',      password: 'password123' },
  { email: 'edward@example.com',  name: 'Edward Norton',     password: 'password123' },
  { email: 'fiona@example.com',   name: 'Fiona Apple',       password: 'password123' },
  { email: 'george@example.com',  name: 'George Washington', password: 'password123' },
  { email: 'hannah@example.com',  name: 'Hannah Montana',    password: 'password123' },
  { email: 'ivan@example.com',    name: 'Ivan Drago',        password: 'password123' },
  { email: 'julia@example.com',   name: 'Julia Roberts',     password: 'password123' },
];

async function main() {
  console.log('Seeding database...');

  // Clear in dependency order
  await prisma.supportVote.deleteMany();
  await prisma.vote.deleteMany();
  await prisma.argumentSupport.deleteMany();
  await prisma.item.deleteMany();
  await prisma.account.deleteMany();
  await prisma.session.deleteMany();
  await prisma.verificationToken.deleteMany();
  await prisma.user.deleteMany();

  // ── Users ──────────────────────────────────────────────────────────────────

  const createdUsers: { id: string }[] = [];
  for (const u of users) {
    const hashed = await bcrypt.hash(u.password, 10);
    const created = await prisma.user.create({
      data: {
        email: u.email,
        name: u.name,
        password: hashed,
        image: `https://www.gravatar.com/avatar/${crypto.createHash('md5').update(u.email.trim().toLowerCase()).digest('hex')}?d=identicon`,
      },
    });
    createdUsers.push(created);
  }
  console.log(`Created ${createdUsers.length} users`);

  // ── Debate 1: Social Media Liability ───────────────────────────────────────

  const debate1 = await prisma.item.create({
    data: {
      type: 'debate',
      title: 'Should social media platforms be held legally responsible for content posted by users?',
      content: 'Debate on whether platforms like Facebook, Twitter, and YouTube should face liability for user-generated content, or whether Section 230 protections should remain intact.',
      children: {
        create: [
          // FOR arguments
          {
            type: 'argument',
            title: 'Platforms profit from harmful content and should share liability',
            content: 'Social media platforms design their products to maximise engagement, knowing that outrage and conflict drive more interaction than measured discourse. They profit directly from this dynamic through advertising revenue. An entity that profits from harm has a compelling obligation to bear some liability for it.',
            relationshipType: 'for',
            argumentType: 'fact',
            evidenceStrength: 'moderate',
            sentimentScore: -0.3,
            sentimentLabel: 'negative',
            votesFor: 0,
            votesAgainst: 0,
          },
          {
            type: 'argument',
            title: 'Moderation technology exists — liability would create the missing financial incentive',
            content: 'Platforms already deploy sophisticated machine learning to detect spam, copyright violations, and advertiser-unfriendly content. The technology to identify and remove harmful content exists. What is absent is financial incentive. Liability would align commercial interests with social good.',
            relationshipType: 'for',
            argumentType: 'fact',
            evidenceStrength: 'strong',
            sentimentScore: 0.1,
            sentimentLabel: 'neutral',
            votesFor: 0,
            votesAgainst: 0,
          },
          {
            type: 'argument',
            title: 'Algorithmic amplification of harmful content is a deliberate product decision',
            content: 'Platforms do not passively host content — their algorithms actively select and amplify it. When a recommendation engine surfaces outrage-inducing content because it maximises watch time, the platform is making an active editorial decision. Passive hosting and active amplification are not equivalent, and liability frameworks should reflect this.',
            relationshipType: 'for',
            argumentType: 'fact',
            evidenceStrength: 'strong',
            sentimentScore: -0.4,
            sentimentLabel: 'negative',
            votesFor: 0,
            votesAgainst: 0,
          },
          // AGAINST arguments
          {
            type: 'argument',
            title: 'Section 230 created the conditions for the modern internet — removing it risks all of it',
            content: "Section 230 of the Communications Decency Act gave platforms the legal certainty they needed to host user content without reviewing every post in advance. Without it, Wikipedia, Reddit, YouTube, and most social media could not exist in their current form. Undermining it risks collapsing the legal foundation of the participatory web.",
            relationshipType: 'against',
            argumentType: 'fact',
            evidenceStrength: 'strong',
            sentimentScore: 0.4,
            sentimentLabel: 'positive',
            votesFor: 0,
            votesAgainst: 0,
          },
          {
            type: 'argument',
            title: 'Liability would entrench large platforms by making compliance costs prohibitive for competitors',
            content: 'Meta and Google can afford large legal and compliance teams. A startup or a cooperative social network cannot. Imposing platform liability would paradoxically cement the dominance of the very companies most critics want to constrain, by making it impossible for smaller challengers to bear the legal risk.',
            relationshipType: 'against',
            argumentType: 'fact',
            evidenceStrength: 'moderate',
            sentimentScore: -0.2,
            sentimentLabel: 'negative',
            votesFor: 0,
            votesAgainst: 0,
          },
          {
            type: 'argument',
            title: 'Content creators, not hosts, should bear liability for what they publish',
            content: 'A postal service is not liable for a defamatory letter it carries. A telephone company is not liable for a threat made on its network. The principle that hosts are not responsible for user-generated content is well-established and reflects the correct allocation of moral responsibility to the person who chose to publish the content.',
            relationshipType: 'against',
            argumentType: 'proposal',
            evidenceStrength: 'moderate',
            sentimentScore: 0.0,
            sentimentLabel: 'neutral',
            votesFor: 0,
            votesAgainst: 0,
          },
        ],
      },
    },
    include: { children: true },
  });

  // Map debate 1 arguments by key phrases for readability
  const sm = {
    profitFromHarm:       debate1.children.find(a => a.title.includes('profit from harmful'))!,
    techExists:           debate1.children.find(a => a.title.includes('Moderation technology'))!,
    algorithmicAmplify:   debate1.children.find(a => a.title.includes('Algorithmic amplification'))!,
    section230:           debate1.children.find(a => a.title.includes('Section 230'))!,
    entrenches:           debate1.children.find(a => a.title.includes('entrench'))!,
    contentCreators:      debate1.children.find(a => a.title.includes('Content creators'))!,
  };

  // ── Debate 2: Emotional Appeals ─────────────────────────────────────────────

  const debate2 = await prisma.item.create({
    data: {
      type: 'debate',
      title: 'Is persuasion through emotional appeals inherently manipulative?',
      content: 'Discussion on whether emotional argumentation is a legitimate form of persuasion or a manipulative tactic that undermines rational discourse.',
      children: {
        create: [
          // FOR (emotional appeals are NOT manipulative)
          {
            type: 'argument',
            title: 'Neuroscience shows emotions are integral to rational decision-making, not opposed to it',
            content: "Antonio Damasio's research on patients with damage to emotional processing centres showed they became incapable of making decisions despite having intact reasoning faculties. Emotions are not the opposite of reason — they are part of it. An appeal to emotion is not an appeal away from reason; it is an appeal to a component of it.",
            relationshipType: 'for',
            argumentType: 'fact',
            evidenceStrength: 'strong',
            sentimentScore: 0.5,
            sentimentLabel: 'positive',
            votesFor: 0,
            votesAgainst: 0,
          },
          {
            type: 'argument',
            title: 'The line between manipulation and persuasion is intent and accuracy, not method',
            content: 'Calling something "emotional manipulation" based solely on its method conflates technique with intent. A fundraiser who uses a photograph of a suffering child to raise money for an effective charity is not manipulating — they are helping people connect emotionally to a real situation. The photograph accurately represents a real problem. Intent and accuracy, not emotional content, are the correct tests.',
            relationshipType: 'for',
            argumentType: 'opinion',
            evidenceStrength: 'moderate',
            sentimentScore: 0.2,
            sentimentLabel: 'positive',
            votesFor: 0,
            votesAgainst: 0,
          },
          {
            type: 'argument',
            title: 'Emotional appeals have always been the primary tool of legitimate civic rhetoric',
            content: "From Lincoln's Gettysburg Address to Churchill's wartime speeches, emotional appeals have been central to the most admired and historically consequential rhetoric in democratic history. If emotional appeals are inherently manipulative, then most of the canon of legitimate political speech is manipulative.",
            relationshipType: 'for',
            argumentType: 'fact',
            evidenceStrength: 'moderate',
            sentimentScore: 0.3,
            sentimentLabel: 'positive',
            votesFor: 0,
            votesAgainst: 0,
          },
          // AGAINST (emotional appeals ARE manipulative)
          {
            type: 'argument',
            title: 'Emotional appeals work precisely by bypassing deliberative reasoning',
            content: 'The effectiveness of emotional appeals in persuasion is well-documented — and much of the research shows they work not by adding information to a decision but by short-circuiting deliberation. Advertising, propaganda, and demagoguery all rely on inducing an emotional state that makes critical evaluation less likely. The mechanism of effect is the bypass.',
            relationshipType: 'against',
            argumentType: 'fact',
            evidenceStrength: 'strong',
            sentimentScore: -0.4,
            sentimentLabel: 'negative',
            votesFor: 0,
            votesAgainst: 0,
          },
          {
            type: 'argument',
            title: 'When emotions override evidence, persuasion has become manipulation regardless of intent',
            content: "Whether a speaker intends to manipulate is less important than the effect. If an emotional appeal produces a belief change that wouldn't survive exposure to the full evidence, the audience has been misled even if the speaker was sincere. Intent is relevant to moral culpability, but not to whether manipulation has occurred.",
            relationshipType: 'against',
            argumentType: 'opinion',
            evidenceStrength: 'moderate',
            sentimentScore: -0.2,
            sentimentLabel: 'negative',
            votesFor: 0,
            votesAgainst: 0,
          },
          {
            type: 'argument',
            title: 'Inflammatory rhetoric targeting fear and in-group/out-group dynamics is manipulation by design',
            content: 'Not all emotional appeals are equivalent. Rhetoric that deliberately activates fear responses, dehumanises out-groups, or exploits grief is not simply "appealing to the emotional side of rational actors." It is targeting known psychological vulnerabilities to produce beliefs that the audience would not endorse if calm and fully informed. This is manipulation by any reasonable definition.',
            relationshipType: 'against',
            argumentType: 'fact',
            evidenceStrength: 'strong',
            sentimentScore: -0.6,
            sentimentLabel: 'negative',
            votesFor: 0,
            votesAgainst: 0,
          },
        ],
      },
    },
    include: { children: true },
  });

  const ea = {
    neuroscienceIntegral: debate2.children.find(a => a.title.includes('Neuroscience'))!,
    intentNotMethod:      debate2.children.find(a => a.title.includes('intent and accuracy'))!,
    historicRhetoric:     debate2.children.find(a => a.title.includes('legitimate civic'))!,
    bypassesDeliberation: debate2.children.find(a => a.title.includes('bypassing deliberative'))!,
    overridesEvidence:    debate2.children.find(a => a.title.includes('override evidence'))!,
    inflammatoryRhetoric: debate2.children.find(a => a.title.includes('Inflammatory rhetoric'))!,
  };

  // ── Evidence items (standalone, linked via ArgumentSupport) ────────────────
  // These represent external sources. URL stored in content; no URL field in schema yet.

  const evidenceFacebook = await prisma.item.create({
    data: {
      type: 'evidence',
      title: "The Facebook Files: Internal research on algorithmic amplification of outrage (WSJ, 2021)",
      content: "https://www.wsj.com/articles/facebook-algorithm-change-zuckerberg-11631654215 — The Wall Street Journal's investigation into Facebook's internal research, which found the platform's own scientists had documented that its algorithm amplified divisive and outrage-inducing content and that leadership chose not to act on the findings.",
      argumentType: 'fact',
      evidenceStrength: 'strong',
      sentimentScore: -0.5,
      sentimentLabel: 'negative',
    },
  });

  const evidenceDamasio = await prisma.item.create({
    data: {
      type: 'evidence',
      title: "Damasio, A. (1994). Descartes' Error: Emotion, Reason, and the Human Brain",
      content: "https://en.wikipedia.org/wiki/Descartes%27_Error — Neurological research demonstrating that patients with damage to emotional processing centres of the brain (particularly the ventromedial prefrontal cortex) lose the ability to make practical decisions, despite retaining full reasoning capacity. Foundational evidence that emotion is constitutive of, not opposed to, rational decision-making.",
      argumentType: 'fact',
      evidenceStrength: 'strong',
      sentimentScore: 0.3,
      sentimentLabel: 'positive',
    },
  });

  const evidenceSection230 = await prisma.item.create({
    data: {
      type: 'evidence',
      title: "Section 230 of the Communications Decency Act (1996) — Legislative text and history",
      content: "https://www.law.cornell.edu/uscode/text/47/230 — The statutory text of Section 230, which grants platforms immunity from liability for third-party content. The legislative history establishes that the intent was to allow platforms to host user content at scale without editorial pre-review, enabling the participatory web.",
      argumentType: 'fact',
      evidenceStrength: 'strong',
      sentimentScore: 0.1,
      sentimentLabel: 'neutral',
    },
  });

  console.log('Created evidence items');

  // ── ArgumentSupport relationships ──────────────────────────────────────────

  await prisma.argumentSupport.createMany({
    data: [
      // WITHIN debate 1 (Social Media)
      // "Algorithmic amplification" substantiates "Platforms profit from harm" — the algorithm is the mechanism of profit
      { parentItemId: sm.profitFromHarm.id,     childItemId: sm.algorithmicAmplify.id,    supportType: 'supporting' },
      // "Tech exists" also supports "Platforms profit from harm" — they could fix it but won't
      { parentItemId: sm.profitFromHarm.id,     childItemId: sm.techExists.id,            supportType: 'supporting' },
      // "Entrench large platforms" supports "Section 230" — extra reason not to remove it
      { parentItemId: sm.section230.id,         childItemId: sm.entrenches.id,            supportType: 'supporting' },
      // "Content creators liable" directly opposes "Platforms profit from harm" — challenges who should bear liability
      { parentItemId: sm.profitFromHarm.id,     childItemId: sm.contentCreators.id,       supportType: 'opposing' },

      // WITHIN debate 2 (Emotional Appeals)
      // "Bypasses deliberation" provides the mechanism for "Overrides evidence" — supports it
      { parentItemId: ea.overridesEvidence.id,  childItemId: ea.bypassesDeliberation.id,  supportType: 'supporting' },
      // "Intent not method" directly challenges "Overrides evidence" (the "regardless of intent" claim)
      { parentItemId: ea.overridesEvidence.id,  childItemId: ea.intentNotMethod.id,       supportType: 'opposing' },
      // "Neuroscience integral" challenges "Bypasses deliberation" — if emotions ARE reasoning, bypassing them isn't bypassing reason
      { parentItemId: ea.bypassesDeliberation.id, childItemId: ea.neuroscienceIntegral.id, supportType: 'opposing' },

      // CROSS-DEBATE: Social media amplification connects to emotional manipulation
      // "Bypasses deliberation" supports "Algorithmic amplification" — the algorithm exploits emotional bypassing to maximise engagement
      { parentItemId: sm.algorithmicAmplify.id, childItemId: ea.bypassesDeliberation.id, supportType: 'supporting' },
      // "Inflammatory rhetoric" supports "Platforms profit from harm" — platforms profit specifically from inflammatory content
      { parentItemId: sm.profitFromHarm.id,     childItemId: ea.inflammatoryRhetoric.id,  supportType: 'supporting' },

      // EVIDENCE links
      // Facebook Files → supports "Algorithmic amplification"
      { parentItemId: sm.algorithmicAmplify.id, childItemId: evidenceFacebook.id,         supportType: 'supporting' },
      // Facebook Files → also supports "Tech exists" (internal research = internal knowledge)
      { parentItemId: sm.techExists.id,         childItemId: evidenceFacebook.id,         supportType: 'supporting' },
      // Damasio → supports "Neuroscience integral"
      { parentItemId: ea.neuroscienceIntegral.id, childItemId: evidenceDamasio.id,        supportType: 'supporting' },
      // Section 230 text → supports "Section 230" argument
      { parentItemId: sm.section230.id,         childItemId: evidenceSection230.id,       supportType: 'supporting' },
    ],
  });

  console.log('Created ArgumentSupport relationships');

  // ── Votes ──────────────────────────────────────────────────────────────────
  // Distribute votes across users to give non-zero counts.
  // Structured to produce a plausible distribution for the eventual scatterplot.
  // Each entry: [userIndex, argumentId, vote]

  const voteData: Array<[number, string, 'for' | 'against']> = [
    // sm.profitFromHarm — contested
    [0, sm.profitFromHarm.id, 'for'],
    [1, sm.profitFromHarm.id, 'for'],
    [2, sm.profitFromHarm.id, 'for'],
    [3, sm.profitFromHarm.id, 'against'],
    [4, sm.profitFromHarm.id, 'against'],

    // sm.techExists — broadly persuasive
    [0, sm.techExists.id, 'for'],
    [1, sm.techExists.id, 'for'],
    [5, sm.techExists.id, 'for'],
    [6, sm.techExists.id, 'for'],
    [7, sm.techExists.id, 'against'],

    // sm.algorithmicAmplify — highly persuasive
    [0, sm.algorithmicAmplify.id, 'for'],
    [2, sm.algorithmicAmplify.id, 'for'],
    [3, sm.algorithmicAmplify.id, 'for'],
    [4, sm.algorithmicAmplify.id, 'for'],
    [8, sm.algorithmicAmplify.id, 'for'],
    [5, sm.algorithmicAmplify.id, 'against'],

    // sm.section230 — broadly persuasive
    [1, sm.section230.id, 'for'],
    [2, sm.section230.id, 'for'],
    [6, sm.section230.id, 'for'],
    [7, sm.section230.id, 'against'],
    [8, sm.section230.id, 'against'],

    // sm.entrenches — moderate engagement
    [3, sm.entrenches.id, 'for'],
    [7, sm.entrenches.id, 'for'],
    [9, sm.entrenches.id, 'against'],

    // sm.contentCreators — contested
    [4, sm.contentCreators.id, 'for'],
    [8, sm.contentCreators.id, 'for'],
    [9, sm.contentCreators.id, 'for'],
    [0, sm.contentCreators.id, 'against'],
    [1, sm.contentCreators.id, 'against'],

    // ea.neuroscienceIntegral — highly persuasive
    [0, ea.neuroscienceIntegral.id, 'for'],
    [2, ea.neuroscienceIntegral.id, 'for'],
    [5, ea.neuroscienceIntegral.id, 'for'],
    [6, ea.neuroscienceIntegral.id, 'for'],
    [7, ea.neuroscienceIntegral.id, 'against'],

    // ea.intentNotMethod — moderate
    [1, ea.intentNotMethod.id, 'for'],
    [3, ea.intentNotMethod.id, 'for'],
    [4, ea.intentNotMethod.id, 'against'],
    [8, ea.intentNotMethod.id, 'against'],

    // ea.historicRhetoric — light engagement
    [2, ea.historicRhetoric.id, 'for'],
    [6, ea.historicRhetoric.id, 'for'],

    // ea.bypassesDeliberation — highly persuasive
    [5, ea.bypassesDeliberation.id, 'for'],
    [6, ea.bypassesDeliberation.id, 'for'],
    [7, ea.bypassesDeliberation.id, 'for'],
    [8, ea.bypassesDeliberation.id, 'for'],
    [9, ea.bypassesDeliberation.id, 'for'],
    [0, ea.bypassesDeliberation.id, 'against'],

    // ea.overridesEvidence — contested
    [7, ea.overridesEvidence.id, 'for'],
    [8, ea.overridesEvidence.id, 'for'],
    [1, ea.overridesEvidence.id, 'against'],
    [2, ea.overridesEvidence.id, 'against'],

    // ea.inflammatoryRhetoric — broadly persuasive
    [3, ea.inflammatoryRhetoric.id, 'for'],
    [4, ea.inflammatoryRhetoric.id, 'for'],
    [5, ea.inflammatoryRhetoric.id, 'for'],
    [6, ea.inflammatoryRhetoric.id, 'for'],
    [9, ea.inflammatoryRhetoric.id, 'for'],
    [0, ea.inflammatoryRhetoric.id, 'against'],
  ];

  for (const [userIdx, itemId, vote] of voteData) {
    const userId = createdUsers[userIdx].id;
    await prisma.vote.create({ data: { userId, itemId, vote } });
    // Keep votesFor/votesAgainst in sync on the Item
    await prisma.item.update({
      where: { id: itemId },
      data: vote === 'for'
        ? { votesFor: { increment: 1 } }
        : { votesAgainst: { increment: 1 } },
    });
  }

  console.log('Created votes');
  console.log('Seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
