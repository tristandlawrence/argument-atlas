// filepath: src/app/debate/[id]/page.tsx
import { prisma } from '@/lib/prisma';
import ArgumentCard from '@/components/ArgumentCard';
import Header from '@/components/Header';
import PageHeader from '@/components/PageHeader';
import { notFound } from 'next/navigation';
import Link from 'next/link';

interface PageProps {
  params: Promise<{ id: string }>;
}

export const dynamic = 'force-dynamic';

export default async function DebatePage({ params }: PageProps) {
  const { id } = await params;
  
  const debate = await prisma.item.findFirst({
    where: { id, type: "debate" },
    include: {
      children: true
    }
  });

  if (!debate) {
    notFound();
  }

  const debateArguments = debate.children.filter((item) => item.type === 'argument');
  const sentimentTotal = debateArguments.reduce(
    (sum, arg) => sum + (arg.sentimentScore ?? 0),
    0
  );
  const debateSentimentScore = debateArguments.length > 0 ? sentimentTotal / debateArguments.length : 0;
  const debateSentimentLabel = debateSentimentScore > 0.2
    ? 'positive'
    : debateSentimentScore < -0.2
      ? 'negative'
      : 'neutral';
  const debateEvidenceStrength = debateArguments.some((arg) => arg.evidenceStrength === 'strong')
    ? 'strong'
    : debateArguments.some((arg) => arg.evidenceStrength === 'moderate')
      ? 'moderate'
      : debateArguments.some((arg) => arg.evidenceStrength === 'weak')
        ? 'weak'
        : 'none';

  // Calculate strength score for sorting (higher is stronger)
  const calculateStrength = (item: typeof debate.children[0]) => {
    const totalVotes = item.votesFor + item.votesAgainst;
    const voteScore = totalVotes > 0 ? (item.votesFor - item.votesAgainst) / totalVotes : 0;
    const evidenceScore = item.evidenceStrength === 'strong' ? 1 : item.evidenceStrength === 'moderate' ? 0.5 : 0;
    return voteScore + evidenceScore + totalVotes * 0.1; // Boost by total engagement
  };

  const argumentsFor = debate.children
    .filter(item => item.type === 'argument' && item.relationshipType === 'for')
    .sort((a, b) => calculateStrength(b) - calculateStrength(a));
  
  const argumentsAgainst = debate.children
    .filter(item => item.type === 'argument' && item.relationshipType === 'against')
    .sort((a, b) => calculateStrength(b) - calculateStrength(a));

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Header />
      <main className="max-w-4xl mx-auto px-4 py-12">
        <PageHeader
          breadcrumbs={[
            { label: 'Debates', href: '/' },
            { label: debate.title }
          ]}
          title={debate.title}
          description={debate.content}
          sentimentLabel={debateSentimentLabel}
          sentimentScore={debateSentimentScore}
          evidenceStrength={debateEvidenceStrength}
          sentimentDescription="Average sentiment for arguments in this debate."
          evidenceDescription="Debate-level evidence strength from its arguments."
        />

        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-4 h-4 bg-green-500 rounded-full"></div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Arguments For
              </h2>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                ({argumentsFor.length})
              </span>
            </div>
            <div className="space-y-4">
              {argumentsFor.map((arg) => (
                <ArgumentCard
                  key={arg.id}
                  id={arg.id}
                  content={arg.content}
                  summary={arg.title}
                  relationshipType={arg.relationshipType as 'for' | 'against'}
                  argumentType={arg.argumentType}
                  evidenceStrength={arg.evidenceStrength}
                  votesFor={arg.votesFor}
                  votesAgainst={arg.votesAgainst}
                  showContent
                />
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-4 h-4 bg-red-500 rounded-full"></div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Arguments Against
              </h2>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                ({argumentsAgainst.length})
              </span>
            </div>
            <div className="space-y-4">
              {argumentsAgainst.map((arg) => (
                <ArgumentCard
                  key={arg.id}
                  id={arg.id}
                  content={arg.content}
                  summary={arg.title}
                  relationshipType={arg.relationshipType as 'for' | 'against'}
                  argumentType={arg.argumentType}
                  evidenceStrength={arg.evidenceStrength}
                  votesFor={arg.votesFor}
                  votesAgainst={arg.votesAgainst}
                  showContent
                />
              ))}
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-800">
          <Link 
            href={`/results/${debate.id}`}
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            View Results & Analytics
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </Link>
        </div>
      </main>
    </div>
  );
}