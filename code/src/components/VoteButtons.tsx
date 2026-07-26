'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface VoteButtonsProps {
  itemId: string;
  votesFor: number;
  votesAgainst: number;
  userVote?: 'for' | 'against' | null;
  isSignedIn: boolean;
  voteType?: 'item' | 'support';
  supportRelationshipId?: string;
}

export default function VoteButtons({
  itemId,
  votesFor: initialVotesFor,
  votesAgainst: initialVotesAgainst,
  userVote,
  isSignedIn,
  voteType = 'item',
  supportRelationshipId,
}: VoteButtonsProps) {
  const router = useRouter();
  const [votesFor, setVotesFor] = useState(initialVotesFor);
  const [votesAgainst, setVotesAgainst] = useState(initialVotesAgainst);
  const [hasVoted, setHasVoted] = useState<'for' | 'against' | null>(userVote ?? null);
  const [isVoting, setIsVoting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleVote = async (vote: 'for' | 'against') => {
    if (!isSignedIn) {
      router.push('/login');
      return;
    }

    if (hasVoted || isVoting) return;
    setIsVoting(true);
    setErrorMessage(null);

    const previousVotesFor = votesFor;
    const previousVotesAgainst = votesAgainst;

    setHasVoted(vote);
    if (vote === 'for') {
      setVotesFor((prev) => prev + 1);
    } else {
      setVotesAgainst((prev) => prev + 1);
    }

    try {
      const response = await fetch('/api/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          argumentId: itemId,
          vote,
          voteType,
          argumentSupportId: supportRelationshipId,
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        if (response.status === 401) {
          router.push('/login');
          return;
        }

        setVotesFor(previousVotesFor);
        setVotesAgainst(previousVotesAgainst);
        setHasVoted(null);
        setErrorMessage(result?.error || 'Unable to submit vote');
        return;
      }

      setVotesFor(result.votesFor);
      setVotesAgainst(result.votesAgainst);
    } catch (error) {
      setVotesFor(previousVotesFor);
      setVotesAgainst(previousVotesAgainst);
      setHasVoted(null);
      setErrorMessage(error instanceof Error ? error.message : 'Unable to submit vote');
    } finally {
      setIsVoting(false);
    }
  };

  return (
    <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
        Did you find this persuasive?
      </p>

      {isSignedIn ? (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <button
            type="button"
            onClick={() => handleVote('for')}
            disabled={hasVoted !== null || isVoting}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              hasVoted === 'for'
                ? 'bg-green-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-green-500 hover:text-white'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
            Persuasive ({votesFor})
          </button>

          <button
            type="button"
            onClick={() => handleVote('against')}
            disabled={hasVoted !== null || isVoting}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              hasVoted === 'against'
                ? 'bg-red-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-red-500 hover:text-white'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
            Not Persuasive ({votesAgainst})
          </button>

          {hasVoted && (
            <span className="text-sm text-gray-500 dark:text-gray-400">
              You voted: {hasVoted === 'for' ? 'Persuasive' : 'Not Persuasive'}
            </span>
          )}
        </div>
      ) : (
        <Link
          href="/login"
          className="text-blue-600 dark:text-blue-400 hover:underline text-sm"
        >
          Sign in to vote
        </Link>
      )}

      {errorMessage && (
        <p className="text-sm text-red-600 dark:text-red-400 mt-3">
          {errorMessage}
        </p>
      )}
    </div>
  );
}
