// filepath: src/app/results/[id]/page.tsx
import { prisma } from '@/lib/prisma';
import Header from '@/components/Header';
import Link from 'next/link';
import { notFound } from 'next/navigation';

interface PageProps {
  params: Promise<{ id: string }>;
}

export const dynamic = 'force-dynamic';

export default async function ResultsPage({ params }: PageProps) {
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

  const argumentsFor = debate.children.filter(item => item.type === 'argument' && item.relationshipType === 'for');
  const argumentsAgainst = debate.children.filter(item => item.type === 'argument' && item.relationshipType === 'against');

  const totalVotesFor = argumentsFor.reduce((sum, arg) => sum + arg.votesFor + arg.votesAgainst, 0);
  const totalVotesAgainst = argumentsAgainst.reduce((sum, arg) => sum + arg.votesFor + arg.votesAgainst, 0);
  const totalVotes = totalVotesFor + totalVotesAgainst;

  const forPercentage = totalVotes > 0 ? Math.round((totalVotesFor / totalVotes) * 100) : 50;
  const againstPercentage = totalVotes > 0 ? Math.round((totalVotesAgainst / totalVotes) * 100) : 50;

  // Sort arguments by total votes
  const sortedFor = [...argumentsFor].sort((a, b) => 
    (b.votesFor + b.votesAgainst) - (a.votesFor + a.votesAgainst)
  );
  const sortedAgainst = [...argumentsAgainst].sort((a, b) => 
    (b.votesFor + b.votesAgainst) - (a.votesFor + a.votesAgainst)
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Header />
      <main className="max-w-4xl mx-auto px-4 py-12">
        <div className="mb-8">
          <Link 
            href={`/debate/${id}`}
            className="text-blue-600 dark:text-blue-400 hover:underline mb-4 inline-block"
          >
            ← Back to Debate
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {debate.title}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">Results & Analytics</p>
        </div>

        {/* Overall Results */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 text-center">
            Overall Sentiment
          </h2>
          
          <div className="relative h-8 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mb-4">
            <div 
              className="absolute left-0 top-0 h-full bg-green-500 transition-all duration-500"
              style={{ width: `${forPercentage}%` }}
            />
          </div>
          
          <div className="flex justify-between items-center">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                {forPercentage}%
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">For</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-600 dark:text-gray-400">
                {totalVotes}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Total Votes</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-red-600 dark:text-red-400">
                {againstPercentage}%
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Against</div>
            </div>
          </div>
        </div>

        {/* Top Arguments */}
        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-4 h-4 bg-green-500 rounded-full"></div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Top Arguments For
              </h2>
            </div>
            <div className="space-y-4">
              {sortedFor.map((arg, index) => {
                const argTotal = arg.votesFor + arg.votesAgainst;
                const argPercent = totalVotesFor > 0 ? Math.round((argTotal / totalVotesFor) * 100) : 0;
                return (
                  <div key={arg.id} className="border-b border-gray-100 dark:border-gray-700 pb-4 last:border-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="w-6 h-6 bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center text-xs font-bold">
                        {index + 1}
                      </span>
                      <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        {argPercent}% of &quot;For&quot; votes
                      </span>
                    </div>
                    <p className="text-gray-700 dark:text-gray-300 text-sm line-clamp-3">
                      {arg.content}
                    </p>
                    <div className="mt-2 text-xs text-gray-400 dark:text-gray-500">
                      {argTotal} total votes
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-4 h-4 bg-red-500 rounded-full"></div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Top Arguments Against
              </h2>
            </div>
            <div className="space-y-4">
              {sortedAgainst.map((arg, index) => {
                const argTotal = arg.votesFor + arg.votesAgainst;
                const argPercent = totalVotesAgainst > 0 ? Math.round((argTotal / totalVotesAgainst) * 100) : 0;
                return (
                  <div key={arg.id} className="border-b border-gray-100 dark:border-gray-700 pb-4 last:border-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="w-6 h-6 bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center text-xs font-bold">
                        {index + 1}
                      </span>
                      <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        {argPercent}% of &quot;Against&quot; votes
                      </span>
                    </div>
                    <p className="text-gray-700 dark:text-gray-300 text-sm line-clamp-3">
                      {arg.content}
                    </p>
                    <div className="mt-2 text-xs text-gray-400 dark:text-gray-500">
                      {argTotal} total votes
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}