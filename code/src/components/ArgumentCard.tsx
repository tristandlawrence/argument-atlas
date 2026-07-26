// filepath: src/components/ArgumentCard.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';

interface ArgumentCardProps {
  id: string;
  content: string;
  summary: string;
  relationshipType: 'for' | 'against' | 'supporting' | 'opposing';
  argumentType: string;
  evidenceStrength: string;
  votesFor: number;
  votesAgainst: number;
  showContent?: boolean;
}

export default function ArgumentCard({ 
  id, 
  content, 
  summary,
  relationshipType, 
  argumentType,
  evidenceStrength,
  votesFor: initialVotesFor,
  votesAgainst: initialVotesAgainst,
  showContent,
}: ArgumentCardProps) {
  const [votesFor] = useState(initialVotesFor);
  const [votesAgainst] = useState(initialVotesAgainst);
  const [showPopup, setShowPopup] = useState(false);

  const isFor = relationshipType === 'for';
  
  // Calculate strength score for color intensity
  const totalVotes = votesFor + votesAgainst;
  const voteScore = totalVotes > 0 ? (votesFor - votesAgainst) / totalVotes : 0;
  const evidenceScore = evidenceStrength === 'strong' ? 1 : evidenceStrength === 'moderate' ? 0.5 : 0;
  const strength = Math.max(0.2, Math.min(1, (voteScore + evidenceScore + totalVotes * 0.1) / 2)); // Normalize to 0.2-1
  
  // Stronger colors for stronger arguments
  const getBgColor = () => {
    if (isFor) {
      return strength > 0.8 ? 'bg-green-500' : strength > 0.6 ? 'bg-green-400' : strength > 0.4 ? 'bg-green-300' : strength > 0.2 ? 'bg-green-200' : 'bg-green-100';
    } else {
      return strength > 0.8 ? 'bg-red-500' : strength > 0.6 ? 'bg-red-400' : strength > 0.4 ? 'bg-red-300' : strength > 0.2 ? 'bg-red-200' : 'bg-red-100';
    }
  };
  
  const getBorderColor = () => {
    if (isFor) {
      return strength > 0.8 ? 'border-green-500' : strength > 0.6 ? 'border-green-400' : strength > 0.4 ? 'border-green-300' : strength > 0.2 ? 'border-green-200' : 'border-green-100';
    } else {
      return strength > 0.8 ? 'border-red-500' : strength > 0.6 ? 'border-red-400' : strength > 0.4 ? 'border-red-300' : strength > 0.2 ? 'border-red-200' : 'border-red-100';
    }
  };
  
  const getBadgeColor = () => {
    if (isFor) {
      return strength > 0.8 ? 'bg-green-600' : strength > 0.6 ? 'bg-green-500' : strength > 0.4 ? 'bg-green-400' : strength > 0.2 ? 'bg-green-300' : 'bg-green-200';
    } else {
      return strength > 0.8 ? 'bg-red-600' : strength > 0.6 ? 'bg-red-500' : strength > 0.4 ? 'bg-red-400' : strength > 0.2 ? 'bg-red-300' : 'bg-red-200';
    }
  };

  const bgColor = getBgColor();
  const borderColor = getBorderColor();
  const badgeColor = getBadgeColor();
  const previewText = showContent ? content : summary || content;

  // Get colors for argument type
  const getArgumentTypeColor = (type: string) => {
    switch (type) {
      case 'fact': return 'bg-blue-600';
      case 'opinion': return 'bg-purple-600';
      case 'value': return 'bg-orange-600';
      case 'proposal': return 'bg-teal-600';
      default: return 'bg-gray-600';
    }
  };

  const getEvidenceColor = (strength: string) => {
    switch (strength) {
      case 'strong': return 'bg-green-600';
      case 'moderate': return 'bg-yellow-600';
      case 'weak': return 'bg-red-500';
      case 'none': return 'bg-gray-500';
      default: return 'bg-gray-600';
    }
  };

  return (
    <div 
      className="relative"
      onMouseEnter={() => setShowPopup(true)}
      onMouseLeave={() => setShowPopup(false)}
    >
      {/* Compact Card - Text at top, details on hover */}
      <Link
        href={`/argument/${id}`}
        className={`block ${bgColor} rounded-lg p-3 border-l-4 ${borderColor} hover:shadow-md transition-shadow cursor-pointer`}
      >
        {/* Argument text at the top */}
        {showContent && summary && (
          <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-2 line-clamp-2">
            {summary}
          </p>
        )}
        <p className="text-sm text-gray-700 dark:text-gray-300 mb-2 line-clamp-3">
          {previewText}
        </p>
        
        {/* Badges only visible on hover */}
        <div className="opacity-0 hover:opacity-100 transition-opacity duration-200">
          <div className="flex items-center gap-2 mb-1">
            <span className={`${badgeColor} text-white text-xs font-semibold px-1.5 py-0.5 rounded uppercase`}>
              {relationshipType}
            </span>
            <span className={`${getArgumentTypeColor(argumentType)} text-white text-xs font-semibold px-1.5 py-0.5 rounded`}>
              {argumentType}
            </span>
            <span className={`${getEvidenceColor(evidenceStrength)} text-white text-xs font-semibold px-1.5 py-0.5 rounded`}>
              {evidenceStrength}
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-2 mt-1 text-xs text-gray-500 dark:text-gray-400">
          <span>{votesFor} for</span>
          <span>•</span>
          <span>{votesAgainst} against</span>
        </div>
      </Link>

      {/* Hover Popup */}
      {showPopup && (
        <div className="absolute z-50 left-0 right-0 top-full mt-2 bg-white dark:bg-gray-900 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-4 w-80">
          {/* Full Argument Content */}
          <p className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed">
            {content}
          </p>
        </div>
      )}
    </div>
  );
}