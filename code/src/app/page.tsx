// filepath: src/app/page.tsx
import { prisma } from '@/lib/prisma';
import DebateCard from '@/components/DebateCard';
import Header from '@/components/Header';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const debates = await prisma.item.findMany({
    where: { type: "debate" },
    include: {
      _count: {
        select: { children: true }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Header />
      <main className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Public Debates
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Explore thought-provoking debates on persuasion, rhetoric, and public discourse. 
            Vote for arguments you find most compelling.
          </p>
        </div>

        <div className="grid gap-6">
          {debates.map((debate) => (
            <DebateCard
              key={debate.id}
              id={debate.id}
              title={debate.title}
              description={debate.content}
              argumentCount={debate._count.children}
            />
          ))}
        </div>
      </main>
    </div>
  );
}
