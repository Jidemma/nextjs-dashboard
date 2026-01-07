'use client';

/**
 * Social Network Analytics Page
 * =============================
 * Social network metrics and influential users
 */

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Header } from '@/components/Header';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ErrorMessage } from '@/components/ErrorMessage';
import { DateRangePicker } from '@/components/DateRangePicker';
import { BarChart } from '@/components/charts/BarChart';
import { PieChart } from '@/components/charts/PieChart';
import { NetworkGraph } from '@/components/charts/NetworkGraph';
import { Users, UserCheck, TrendingUp } from 'lucide-react';
import { downloadJSON, formatNumber } from '@/lib/utils';
import { getApiUrl, fetchWithTimeout } from '@/lib/api';
import type { SocialNetworkAnalytics, ApiResponse } from '@/types/analytics';

export default function SocialPage() {
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const queryClient = useQueryClient();

  const { data, isLoading, error, refetch } = useQuery<ApiResponse<SocialNetworkAnalytics>>({
    queryKey: ['social', startDate, endDate],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      
      const res = await fetchWithTimeout(getApiUrl(`api/analytics/social?${params}`));
      if (!res.ok) throw new Error('Failed to fetch social analytics');
      return res.json();
    },
    refetchOnWindowFocus: false,
    staleTime: 0,
    enabled: true,
  });

  const handleDateChange = (start: string, end: string) => {
    setStartDate(start);
    setEndDate(end);
    setTimeout(() => {
      queryClient.invalidateQueries({ queryKey: ['social'] });
    }, 0);
  };

  const handleRefresh = () => {
    refetch();
  };

  const handleExport = () => {
    if (data?.data) {
      downloadJSON(data.data, `social-analytics-${new Date().toISOString()}.json`);
    }
  };

  if (isLoading) {
    return (
      <div>
        <Header title="Social Network Analytics" subtitle="Social connections and influence" />
        <div className="p-8">
          <LoadingSpinner text="Loading social analytics..." />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <Header title="Social Network Analytics" subtitle="Social connections and influence" />
        <div className="p-8">
          <ErrorMessage
            message={error instanceof Error ? error.message : 'An error occurred'}
            onRetry={() => refetch()}
          />
        </div>
      </div>
    );
  }

  const analytics = data?.data;

  // Prepare influential users data
  const influentialUsersData = analytics?.influential_users?.slice(0, 15).map(user => ({
    name: user.name || user.username || `User ${user.user_id?.slice(-6) || 'Unknown'}`,
    friends: user.friend_count,
  })) || [];

  return (
    <div>
      <Header
        title="Social Network Analytics"
        subtitle="Social connections and influence"
        onRefresh={handleRefresh}
        onExport={handleExport}
        isLoading={isLoading}
      />

      <div className="p-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
          <DateRangePicker onDateChange={handleDateChange} />
        </div>

        {/* Network Performance Metrics */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">📊 Network Performance Metrics</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center justify-center mb-2">
                <Users className="h-5 w-5 text-blue-600 mr-2" />
                <h4 className="text-sm font-medium text-gray-700">Total Connections</h4>
              </div>
              <p className="text-3xl font-bold text-blue-600">
                {formatNumber(analytics?.network_overview?.total_friendships || 0)}
              </p>
              <p className="text-xs text-gray-500 mt-1">Friendships</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="flex items-center justify-center mb-2">
                <TrendingUp className="h-5 w-5 text-green-600 mr-2" />
                <h4 className="text-sm font-medium text-gray-700">Acceptance Rate</h4>
              </div>
              <p className="text-3xl font-bold text-green-600">
                {analytics?.social_activity?.acceptance_rate?.toFixed(1) || 0}%
              </p>
              <p className="text-xs text-gray-500 mt-1">Requests accepted</p>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <div className="flex items-center justify-center mb-2">
                <UserCheck className="h-5 w-5 text-yellow-600 mr-2" />
                <h4 className="text-sm font-medium text-gray-700">Avg Connections</h4>
              </div>
              <p className="text-3xl font-bold text-yellow-600">
                {analytics?.network_overview?.avg_friends_per_user?.toFixed(1) || 0}
              </p>
              <p className="text-xs text-gray-500 mt-1">Per user</p>
            </div>
          </div>
        </div>

        {/* Friend Request Activity */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">🤝 Friend Request Activity</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">Total Requests</p>
              <p className="text-3xl font-bold text-gray-900">
                {formatNumber(analytics?.social_activity?.total_friend_requests || 0)}
              </p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">Accepted</p>
              <p className="text-3xl font-bold text-green-600">
                {formatNumber(analytics?.social_activity?.accepted_requests || 0)}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {analytics?.social_activity?.total_friend_requests > 0
                  ? `${((analytics?.social_activity?.accepted_requests || 0) / analytics?.social_activity?.total_friend_requests * 100).toFixed(1)}%`
                  : '0%'} of total
              </p>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">Pending</p>
              <p className="text-3xl font-bold text-yellow-600">
                {formatNumber(analytics?.social_activity?.pending_requests || 0)}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {analytics?.social_activity?.total_friend_requests > 0
                  ? `${((analytics?.social_activity?.pending_requests || 0) / analytics?.social_activity?.total_friend_requests * 100).toFixed(1)}%`
                  : '0%'} of total
              </p>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">Acceptance Rate</p>
              <p className="text-3xl font-bold text-blue-600">
                {analytics?.social_activity?.acceptance_rate?.toFixed(1) || 0}%
              </p>
              <p className="text-xs text-gray-500 mt-1">Success rate</p>
            </div>
          </div>
        </div>

        {/* Interactive Network Graph */}
        {analytics?.network_graph && analytics.network_graph.nodes.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <NetworkGraph
              nodes={analytics.network_graph.nodes}
              links={analytics.network_graph.links}
              height={500}
              title="🕸️ Interactive Social Network Graph"
            />
          </div>
        )}

        {/* Influential Users Table */}
        {influentialUsersData.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">⭐ Users with Most Connections</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rank
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Friend Count
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Network Impact
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {influentialUsersData.map((user, idx) => {
                    const maxFriends = influentialUsersData[0]?.friends || 1;
                    const percentage = (user.friends / maxFriends) * 100;
                    return (
                      <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          #{idx + 1}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{user.name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-semibold text-blue-600">
                            {formatNumber(user.friends)} friends
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-24 bg-gray-200 rounded-full h-2 mr-2">
                              <div
                                className="bg-blue-600 h-2 rounded-full"
                                style={{ width: `${Math.min(percentage, 100)}%` }}
                              />
                            </div>
                            <span className="text-sm text-gray-700">
                              {percentage.toFixed(0)}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Users with Most Connections Chart */}
        {influentialUsersData.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <BarChart
              data={influentialUsersData}
              xKey="name"
              yKeys={[
                { key: 'friends', color: '#3b82f6', name: 'Friend Count' },
              ]}
              title="⭐ Users with Most Connections"
              height={Math.max(400, influentialUsersData.length * 40)}
              horizontal={true}
            />
          </div>
        )}
      </div>
    </div>
  );
}

