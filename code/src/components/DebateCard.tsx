// filepath: src/components/DebateCard.tsx
import Link from 'next/link';

interface DebateCardProps {
  id: string;
  title: string;
  description: string;
  argumentCount: number;
}

export default function DebateCard({ id, title, description, argumentCount }: DebateCardProps) {
  return (
    <Link href={`/debate/${id}`}>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer border border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          {title}
        </h2>
        <p className="text-gray-600 dark:text-gray-300 mb-4 line-clamp-2">
          {description}
        </p>
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {argumentCount} arguments
          </span>
          <span className="text-blue-600 dark:text-blue-400 text-sm font-medium">
            View Debate →
          </span>
        </div>
      </div>
    </Link>
  );
}