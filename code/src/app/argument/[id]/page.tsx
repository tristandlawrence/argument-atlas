// filepath: src/app/argument/[id]/page.tsx
import { prisma } from '@/lib/prisma';
import Header from '@/components/Header';
import PageHeader from '@/components/PageHeader';
import VoteButtons from '@/components/VoteButtons';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { auth } from '@/app/api/auth/[...nextauth]/route';

interface PageProps {
  params: Promise<{ id: string }>;
}

export const dynamic = 'force-dynamic';

// Helper to get badge colors
function getArgumentTypeColor(type: string) {
  switch (type) {
    case 'fact': return 'bg-blue-600';
    case 'opinion': return 'bg-purple-600';
    case 'value': return 'bg-orange-600';
    case 'proposal': return 'bg-teal-600';
    default: return 'bg-gray-600';
  }
}

function getEvidenceColor(strength: string) {
  switch (strength) {
    case 'strong': return 'bg-green-600';
    case 'moderate': return 'bg-yellow-600';
    case 'weak': return 'bg-red-500';
    case 'none': return 'bg-gray-500';
    default: return 'bg-gray-600';
  }
}

export default async function ArgumentPage({ params }: PageProps) {
  const { id } = await params;
  const session = await auth();
  
  const argument = await prisma.item.findFirst({
    where: { id, type: "argument" },
    include: {
      parent: true,
      childSupports: {
        include: {
          child: true
        }
      },
      votes: { where: { userId: session?.user?.id ?? '' } }
    }
  });

  if (!argument) {
    notFound();
  }

  const hasVoted = session?.user && argument.votes.length > 0;
  const userVote = hasVoted ? argument.votes[0]?.vote as 'for' | 'against' : null;

  // Get related arguments from the same debate (for/against)
  const relatedArguments = await prisma.item.findMany({
    where: {
      parentId: argument.parentId,
      type: "argument",
      id: { not: argument.id }
    },
    orderBy: { createdAt: 'asc' }
  });

  const argumentsFor = relatedArguments.filter(a => a.relationshipType === 'for');
  const argumentsAgainst = relatedArguments.filter(a => a.relationshipType === 'against');

  const isFor = argument.relationshipType === 'for';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Header />
      <main className="max-w-4xl mx-auto px-4 py-12">
        <PageHeader
          breadcrumbs={[
            { label: 'Debates', href: '/' },
            { label: argument.parent?.title ?? 'Debate', href: `/debate/${argument.parentId}` },
            { label: argument.title }
          ]}
          title={argument.title}
          description={`Argument inside ${argument.parent?.title ?? 'the linked debate'}`}
          sentimentLabel={argument.sentimentLabel}
          sentimentScore={argument.sentimentScore ?? 0}
          evidenceStrength={argument.evidenceStrength}
          sentimentDescription="Sentiment and evidence for this argument."
          evidenceDescription="Evidence strength for this argument."
        />

        {/* Argument Classification */}
        <div className="flex flex-wrap gap-2 mb-4">
          <span className={`${getArgumentTypeColor(argument.argumentType)} text-white text-xs font-semibold px-2 py-1 rounded uppercase`}>
            {argument.argumentType}
          </span>
          <span className={`${getEvidenceColor(argument.evidenceStrength)} text-white text-xs font-semibold px-2 py-1 rounded uppercase`}>
            {argument.evidenceStrength} evidence
          </span>
        </div>

        {/* Main Argument */}
        <div className={`rounded-lg p-6 border-l-4 mb-8 ${
          isFor 
            ? 'bg-green-50 dark:bg-green-900/20 border-green-500' 
            : 'bg-red-50 dark:bg-red-900/20 border-red-500'
        }`}>
          <div className="flex items-center gap-3 mb-4">
            <span className={`${isFor ? 'bg-green-600' : 'bg-red-600'} text-white text-xs font-semibold px-2 py-1 rounded uppercase`}>
              {argument.relationshipType}
            </span>
          </div>
          
          <p className="text-lg text-gray-800 dark:text-gray-200 leading-relaxed">
            {argument.content}
          </p>

          {/* Voting Section */}
          <VoteButtons
            itemId={argument.id}
            votesFor={argument.votesFor}
            votesAgainst={argument.votesAgainst}
            userVote={userVote}
            isSignedIn={!!session?.user}
          />
        </div>

        {/* Supporting Items/Debates */}
        {argument.childSupports && argument.childSupports.length > 0 && (
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-3 h-3 bg-blue-500 rounded-full"></span>
              Supporting Evidence
            </h3>
            <div className="space-y-3">
              {argument.childSupports.map((support) => {
                const supportingItem = support.child;
                return (
                  <div key={support.id} className="bg-white dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-800">
                    <div className="flex items-start gap-3">
                      <span className="bg-blue-600 text-white text-xs font-semibold px-2 py-1 rounded uppercase mt-1">
                        {support.supportType}
                      </span>
                      <div className="flex-1">
                        {supportingItem.type === 'debate' ? (
                          <Link 
                            href={`/debate/${supportingItem.id}`}
                            className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
                          >
                            {supportingItem.title}
                          </Link>
                        ) : (
                          <Link 
                            href={`/argument/${supportingItem.id}`}
                            className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
                          >
                            {supportingItem.title || supportingItem.content.substring(0, 100) + '...'}
                          </Link>
                        )}
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {supportingItem.content}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Related Arguments from same debate */}
        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-3 h-3 bg-green-500 rounded-full"></span>
              Arguments For ({argumentsFor.length})
            </h3>
            <div className="space-y-3">
              {argumentsFor.map(arg => (
                <Link
                  key={arg.id}
                  href={`/argument/${arg.id}`}
                  className="block p-3 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 hover:border-green-500 dark:hover:border-green-500 transition-colors"
                >
                  <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">
                    {arg.title || arg.content}
                  </p>
                </Link>
              ))}
              {argumentsFor.length === 0 && (
                <p className="text-sm text-gray-500">No arguments for yet.</p>
              )}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-3 h-3 bg-red-500 rounded-full"></span>
              Arguments Against ({argumentsAgainst.length})
            </h3>
            <div className="space-y-3">
              {argumentsAgainst.map(arg => (
                <Link
                  key={arg.id}
                  href={`/argument/${arg.id}`}
                  className="block p-3 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 hover:border-red-500 dark:hover:border-red-500 transition-colors"
                >
                  <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">
                    {arg.title || arg.content}
                  </p>
                </Link>
              ))}
              {argumentsAgainst.length === 0 && (
                <p className="text-sm text-gray-500">No arguments against yet.</p>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}