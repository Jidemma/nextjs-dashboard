/**
 * Metric Definitions
 * ==================
 * Definitions for all metrics used in the dashboard
 */

export interface MetricDefinition {
  description: string;
  calculation: string;
  filtered: boolean;
  note?: string;
}

export type MetricKey = 
  // Overview Analytics
  | 'Total Users'
  | 'Active Users'
  | 'Total Journeys'
  | 'Total Comments'
  | 'User Growth Rate'
  | 'Journey Growth Rate'
  | 'Engagement Growth Rate'
  | 'Avg Comments/Journey'
  | 'Avg Friends/User'
  | 'Engagement Rate'
  // User Analytics
  | 'New Users'
  | 'New User Rate'
  | 'Avg Journeys/User'
  | 'Avg Comments/User'
  | 'Avg Friends/User'
  | 'Retention Rate'
  | 'Churn Rate'
  | 'Returning Users';

export const overviewMetrics: Record<string, MetricDefinition> = {
  'Total Users': {
    description: 'The total number of people who have created accounts on the platform',
    calculation: 'All registered users',
    filtered: false,
    note: 'This number stays the same regardless of the time period you select',
  },
  'Active Users': {
    description: 'Users who created at least one journey or made at least one comment during the selected time period',
    calculation: 'Count of unique users who were active',
    filtered: true,
    note: 'A user is considered active if they created a journey OR left a comment',
  },
  'Total Journeys': {
    description: 'How many travel journeys were created during the selected time period',
    calculation: 'Count of journeys created in this period',
    filtered: true,
  },
  'Total Comments': {
    description: 'How many comments were posted during the selected time period',
    calculation: 'Count of comments posted in this period',
    filtered: true,
  },
  'User Growth Rate': {
    description: 'How much the number of active users grew during the selected time period',
    calculation: 'Percentage change from start of period to end of period',
    filtered: true,
    note: 'For specific periods: shows growth within the period itself (totals at start vs totals at end). For "All Time": shows year-over-year growth (current totals vs totals from 1 year ago).',
  },
  'Journey Growth Rate': {
    description: 'How much the number of journeys grew during the selected time period',
    calculation: 'Percentage change from start of period to end of period',
    filtered: true,
    note: 'For specific periods: shows growth within the period itself (totals at start vs totals at end). For "All Time": shows year-over-year growth (current totals vs totals from 1 year ago).',
  },
  'Engagement Growth Rate': {
    description: 'How much overall activity (journeys + comments) grew during the selected time period',
    calculation: 'Percentage change from start of period to end of period',
    filtered: true,
    note: 'For specific periods: shows growth within the period itself (totals at start vs totals at end). For "All Time": shows year-over-year growth (current totals vs totals from 1 year ago).',
  },
  'Avg Comments/Journey': {
    description: 'On average, how many comments each journey receives',
    calculation: 'Total comments ÷ Total journeys',
    filtered: true,
  },
  'Avg Friends/User': {
    description: 'On average, how many friends each user has',
    calculation: 'Total friendships ÷ Total users',
    filtered: false,
    note: 'This includes all friendships, not just ones made in the selected period',
  },
  'Engagement Rate': {
    description: 'What percentage of all users were active during the selected time period',
    calculation: 'Active users ÷ Total users × 100',
    filtered: true,
  },
};

export const userMetrics: Record<string, MetricDefinition> = {
  'Total Users': {
    description: 'The total number of people who have created accounts on the platform',
    calculation: 'All registered users',
    filtered: false,
    note: 'This number stays the same regardless of the time period you select',
  },
  'Active Users': {
    description: 'Users who created at least one journey or made at least one comment during the selected time period',
    calculation: 'Count of unique users who were active',
    filtered: true,
    note: 'A user is considered active if they created a journey OR left a comment',
  },
  'New Users': {
    description: 'How many people signed up for new accounts during the selected time period',
    calculation: 'Count of new registrations',
    filtered: true,
    note: 'If no time period is selected, this shows new users from the last 30 days',
  },
  'New User Rate': {
    description: 'What percentage of all users are new users from the selected period',
    calculation: 'New users ÷ Total users × 100',
    filtered: true,
  },
  'Engagement Rate': {
    description: 'What percentage of all users were active during the selected time period',
    calculation: 'Active users ÷ Total users × 100',
    filtered: true,
  },
  'Avg Journeys/User': {
    description: 'On average, how many journeys each user created during the selected period',
    calculation: 'Total journeys in period ÷ Total users',
    filtered: true,
    note: 'This divides by all users, but only counts journeys from the selected period',
  },
  'Avg Comments/User': {
    description: 'On average, how many comments each user made during the selected period',
    calculation: 'Total comments in period ÷ Total users',
    filtered: true,
  },
  'Avg Friends/User': {
    description: 'On average, how many friends each user has',
    calculation: 'Total friendships ÷ Total users',
    filtered: false,
    note: 'This includes all friendships, not just ones made in the selected period',
  },
  'Retention Rate': {
    description: 'What percentage of users who were active in the previous period came back and were active again',
    calculation: 'Returning users ÷ Previous period active users × 100',
    filtered: true,
    note: 'Shows how well you\'re keeping users engaged over time',
  },
  'Churn Rate': {
    description: 'What percentage of users who were active in the previous period stopped being active',
    calculation: 'Users who left ÷ Previous period active users × 100',
    filtered: true,
    note: 'Retention Rate + Churn Rate = 100%',
  },
  'Returning Users': {
    description: 'How many users were active in both the previous period and the current period',
    calculation: 'Count of users active in both periods',
    filtered: true,
  },
};

export function getMetricDefinition(
  title: string,
  type: 'overview' | 'users'
): MetricDefinition | undefined {
  const metrics = type === 'overview' ? overviewMetrics : userMetrics;
  return metrics[title];
}

