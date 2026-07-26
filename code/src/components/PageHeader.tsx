import Link from 'next/link';

type Breadcrumb = {
  label: string;
  href?: string;
};

interface PageHeaderProps {
  breadcrumbs: Breadcrumb[];
  title: string;
  description?: string;
  sentimentLabel?: string | null;
  sentimentScore?: number;
  evidenceStrength?: string;
  sentimentDescription?: string;
  evidenceDescription?: string;
}

export default function PageHeader({
  breadcrumbs,
  title,
  description,
  sentimentLabel,
  sentimentScore,
  evidenceStrength,
  sentimentDescription,
  evidenceDescription,
}: PageHeaderProps) {
  const getSentimentColor = (label: string | null) => {
    switch (label) {
      case 'positive':
        return 'text-green-600 dark:text-green-400';
      case 'negative':
        return 'text-red-600 dark:text-red-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  const getEvidenceBadge = (strength: string | undefined) => {
    switch (strength) {
      case 'strong':
        return 'bg-green-600';
      case 'moderate':
        return 'bg-yellow-500';
      case 'weak':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="mb-8">
      <nav className="mb-4 text-sm text-gray-500 dark:text-gray-400 flex flex-wrap gap-2">
        {breadcrumbs.map((crumb, index) => (
          <span key={`${crumb.label}-${index}`} className="inline-flex items-center gap-2">
            {crumb.href ? (
              <Link href={crumb.href} className="text-blue-600 dark:text-blue-400 hover:underline">
                {crumb.label}
              </Link>
            ) : (
              <span className="font-medium text-gray-900 dark:text-white">{crumb.label}</span>
            )}
            {index < breadcrumbs.length - 1 && (
              <span className="text-gray-400 dark:text-gray-500">/</span>
            )}
          </span>
        ))}
      </nav>

      <div className="rounded-3xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6 shadow-sm">
        <div className="mb-4">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
            {title}
          </h1>
          {description && (
            <p className="mt-3 text-gray-600 dark:text-gray-400 max-w-3xl">
              {description}
            </p>
          )}
        </div>

        {(sentimentLabel || evidenceStrength) && (
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 p-4">
              <p className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-3">Sentiment Analysis</p>
              <div className="flex items-center gap-4">
                <span className={`text-2xl font-bold ${getSentimentColor(sentimentLabel ?? null)}`}>
                  {sentimentLabel ? sentimentLabel.charAt(0).toUpperCase() + sentimentLabel.slice(1) : 'Neutral'}
                </span>
                {typeof sentimentScore === 'number' && (
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    Score: {sentimentScore.toFixed(2)}
                  </span>
                )}
              </div>
              {sentimentDescription && (
                <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
                  {sentimentDescription}
                </p>
              )}
            </div>

            <div className="rounded-2xl bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 p-4">
              <p className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-3">Evidence Strength</p>
              <div className="flex flex-wrap items-center gap-3">
                <span className={`${getEvidenceBadge(evidenceStrength)} text-white text-xs font-semibold uppercase px-3 py-1 rounded-full`}>
                  {evidenceStrength ?? 'none'}
                </span>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {evidenceDescription ?? 'Evidence strength based on supporting content.'}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
