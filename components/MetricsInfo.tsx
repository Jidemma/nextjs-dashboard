'use client';

/**
 * Metrics Info Component
 * ======================
 * Collapsible component showing how metrics are calculated
 */

import { useState } from 'react';
import { Info, X } from 'lucide-react';

interface MetricsInfoProps {
  type: 'overview' | 'users';
}

export function MetricsInfo({ type }: MetricsInfoProps) {
  const [isOpen, setIsOpen] = useState(false);

  const overviewMetrics = {
    total: {
      title: 'Total Metrics',
      items: [
        {
          name: 'Total Users',
          description: 'Total number of user accounts in the system',
          calculation: 'COUNT(pandas_users)',
          filtered: false,
          note: 'Not filtered by time period - shows all users',
        },
        {
          name: 'Active Users',
          description: 'Users with at least one journey OR comment in the selected period',
          calculation: 'DISTINCT users from journeys + comments in period',
          filtered: true,
          note: 'Follows DAU/MAU standard metric',
        },
        {
          name: 'Total Journeys',
          description: 'Number of journeys created in the selected time period',
          calculation: 'COUNT(journeys WHERE start_date IN [period])',
          filtered: true,
        },
        {
          name: 'Total Comments',
          description: 'Number of comments created in the selected time period',
          calculation: 'COUNT(comments WHERE created_at IN [period])',
          filtered: true,
        },
        {
          name: 'Total Friendships',
          description: 'Total number of friend connections',
          calculation: 'COUNT(pandas_friends)',
          filtered: false,
          note: 'Not filtered by time period',
        },
      ],
    },
    growth: {
      title: 'Growth Metrics',
      items: [
        {
          name: 'User Growth Rate',
          description: 'Percentage change in active users vs previous period',
          calculation: '((current - previous) / previous) × 100',
          filtered: true,
          note: 'Compares with previous period of equal duration',
        },
        {
          name: 'Journey Growth Rate',
          description: 'Percentage change in journeys vs previous period',
          calculation: '((current - previous) / previous) × 100',
          filtered: true,
        },
        {
          name: 'Engagement Growth Rate',
          description: 'Percentage change in total engagement (journeys + comments)',
          calculation: '((current_engagement - previous_engagement) / previous_engagement) × 100',
          filtered: true,
        },
      ],
    },
    engagement: {
      title: 'Engagement Metrics',
      items: [
        {
          name: 'Avg Comments/Journey',
          description: 'Average number of comments per journey',
          calculation: 'total_comments / total_journeys',
          filtered: true,
        },
        {
          name: 'Avg Friends/User',
          description: 'Average number of friends per user',
          calculation: 'total_friendships / total_users',
          filtered: false,
        },
        {
          name: 'Engagement Rate',
          description: 'Percentage of total users who are active',
          calculation: '(active_users / total_users) × 100',
          filtered: true,
        },
      ],
    },
  };

  const userMetrics = {
    demographics: {
      title: 'User Demographics',
      items: [
        {
          name: 'Total Users',
          description: 'Total number of user accounts',
          calculation: 'COUNT(pandas_users)',
          filtered: false,
          note: 'Not filtered by time period',
        },
        {
          name: 'Active Users',
          description: 'Users with journeys OR comments in the period',
          calculation: 'DISTINCT users from journeys + comments in period',
          filtered: true,
        },
        {
          name: 'New Users',
          description: 'Users registered in the selected period',
          calculation: 'COUNT(users WHERE createdAt IN [period])',
          filtered: true,
          note: 'Defaults to last 30 days if no period selected',
        },
      ],
    },
    activity: {
      title: 'User Activity',
      items: [
        {
          name: 'Avg Journeys/User',
          description: 'Average journeys created per user',
          calculation: 'total_journeys_in_period / total_users',
          filtered: true,
          note: 'Uses all users, but journeys are filtered',
        },
        {
          name: 'Avg Comments/User',
          description: 'Average comments made per user',
          calculation: 'total_comments_in_period / total_users',
          filtered: true,
        },
        {
          name: 'Most Active Users',
          description: 'Top users ranked by activity score',
          calculation: 'Activity Score = (journeys × 1.0) + (comments × 0.5)',
          filtered: true,
          note: 'Journeys weighted more than comments',
        },
      ],
    },
    retention: {
      title: 'User Retention',
      items: [
        {
          name: 'Retention Rate',
          description: '% of previous period active users who returned',
          calculation: '(returning_users / previous_period_active_users) × 100',
          filtered: true,
          note: 'Requires both start and end dates',
        },
        {
          name: 'Churn Rate',
          description: '% of previous period active users who left',
          calculation: '((previous_active - returning) / previous_active) × 100',
          filtered: true,
          note: 'Retention + Churn = 100%',
        },
        {
          name: 'Returning Users',
          description: 'Users active in both previous and current period',
          calculation: 'COUNT(users active in both periods)',
          filtered: true,
        },
      ],
    },
    distribution: {
      title: 'Activity Distribution',
      items: [
        {
          name: 'Activity Categories',
          description: 'Users categorized by weekly activity rate',
          calculation: 'activities_per_week = (journeys + comments) / weeks_in_period',
          filtered: true,
          note: 'Inactive: <1/week, Medium: 1-3/week, Active: ≥3/week',
        },
      ],
    },
  };

  const metrics = type === 'overview' ? overviewMetrics : userMetrics;
  const sections = Object.values(metrics);

  return (
    <>
      {/* Info Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-lg transition-all hover:scale-110"
        title="How metrics are calculated"
        aria-label="Show metrics calculation guide"
      >
        <Info className="h-6 w-6" />
      </button>

      {/* Modal Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-blue-600 text-white p-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Metrics Calculation Guide</h2>
                <p className="text-blue-100 text-sm mt-1">
                  Understanding how {type === 'overview' ? 'Overview' : 'User'} Analytics metrics are calculated
                </p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-white hover:text-blue-200 transition-colors"
                aria-label="Close"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Content */}
            <div className="overflow-y-auto flex-1 p-6">
              <div className="space-y-6">
                {sections.map((section, sectionIdx) => (
                  <div key={sectionIdx} className="border-b border-gray-200 pb-6 last:border-0">
                    <h3 className="text-xl font-semibold text-gray-900 mb-4">{section.title}</h3>
                    <div className="space-y-4">
                      {section.items.map((item, itemIdx) => (
                        <div
                          key={itemIdx}
                          className="bg-gray-50 rounded-lg p-4 border border-gray-200"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-semibold text-gray-900">{item.name}</h4>
                            <span
                              className={`text-xs px-2 py-1 rounded-full ${
                                item.filtered
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-gray-200 text-gray-700'
                              }`}
                            >
                              {item.filtered ? 'Time Filtered' : 'Not Filtered'}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{item.description}</p>
                          <div className="bg-white rounded p-3 mb-2">
                            <p className="text-xs font-mono text-gray-800">{item.calculation}</p>
                          </div>
                          {'note' in item && item.note && (
                            <p className="text-xs text-gray-500 italic">ℹ️ {item.note}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Key Concepts */}
              <div className="mt-8 bg-blue-50 rounded-lg p-6 border border-blue-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Key Concepts</h3>
                <ul className="space-y-3 text-sm text-gray-700">
                  <li className="flex items-start">
                    <span className="text-blue-600 mr-2">•</span>
                    <span>
                      <strong>Time Filtered:</strong> Metric is calculated using only data from the selected time period
                    </span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-blue-600 mr-2">•</span>
                    <span>
                      <strong>Not Filtered:</strong> Metric shows all-time totals regardless of selected period
                    </span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-blue-600 mr-2">•</span>
                    <span>
                      <strong>Active Users:</strong> Users with at least one journey OR comment in the period (DAU/MAU standard)
                    </span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-blue-600 mr-2">•</span>
                    <span>
                      <strong>Growth Rates:</strong> Compare current period with previous period of equal duration
                    </span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
              <p className="text-xs text-gray-500 text-center">
                For detailed documentation, see{' '}
                <a
                  href="https://github.com/your-repo/docs"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  METRICS_CALCULATION_GUIDE.md
                </a>
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

