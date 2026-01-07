'use client';

/**
 * Journey Analytics Page
 * =====================
 * Journey metrics and engagement analytics
 */

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Header } from '@/components/Header';
import { MetricCard } from '@/components/MetricCard';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ErrorMessage } from '@/components/ErrorMessage';
import { DateRangePicker } from '@/components/DateRangePicker';
import { BarChart } from '@/components/charts/BarChart';
import { PieChart } from '@/components/charts/PieChart';
import { LineChart } from '@/components/charts/LineChart';
import { Map, MapPin, MessageCircle, CheckCircle, Clock, Users, DollarSign, TrendingUp, Calendar } from 'lucide-react';
import { downloadJSON, formatNumber } from '@/lib/utils';
import { getApiUrl, fetchWithTimeout } from '@/lib/api';
import type { JourneyAnalytics, ApiResponse } from '@/types/analytics';

export default function JourneysPage() {
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const queryClient = useQueryClient();

  const { data, isLoading, error, refetch } = useQuery<ApiResponse<JourneyAnalytics>>({
    queryKey: ['journeys', startDate, endDate],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      
      const res = await fetchWithTimeout(getApiUrl(`api/analytics/journeys?${params}`));
      if (!res.ok) throw new Error('Failed to fetch journey analytics');
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
      queryClient.invalidateQueries({ queryKey: ['journeys'] });
    }, 0);
  };

  const handleRefresh = () => {
    refetch();
  };

  const handleExport = () => {
    if (data?.data) {
      downloadJSON(data.data, `journey-analytics-${new Date().toISOString()}.json`);
    }
  };

  if (isLoading) {
    return (
      <div>
        <Header title="Journey Analytics" subtitle="Journey metrics and engagement" />
        <div className="p-8">
          <LoadingSpinner text="Loading journey analytics..." />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <Header title="Journey Analytics" subtitle="Journey metrics and engagement" />
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

  // Prepare data for charts
  const destinationsData = analytics?.popular_destinations?.slice(0, 10).map(dest => ({
    name: dest.destination,
    count: dest.count,
  })) || [];

  const mostCommentedData = analytics?.journey_engagement?.most_commented_journeys
    ?.slice(0, 10)
    .map(journey => ({
      name: journey.title || `Journey ${journey.journey_id.slice(-6)}`,
      comments: journey.comments,
    })) || [];

  // Status distribution for pie chart
  const statusDistributionData = analytics?.journey_overview?.status_distribution
    ? Object.entries(analytics.journey_overview.status_distribution)
        .filter(([_, count]) => count > 0)
        .map(([status, count]) => ({
          name: status.charAt(0).toUpperCase() + status.slice(1),
          value: count as number,
        }))
    : [];

  // Journey trends over time
  const journeyTrendsData = analytics?.journey_trends?.map(trend => ({
    month: trend.month,
    journeys: trend.count,
  })) || [];

  // Duration distribution
  const durationDistributionData = analytics?.duration_distribution
    ?.filter(d => d.count > 0)
    .map(d => ({
      name: d.range,
      count: d.count,
    })) || [];

  return (
    <div>
      <Header
        title="Journey Analytics"
        subtitle="Journey metrics and engagement"
        onRefresh={handleRefresh}
        onExport={handleExport}
        isLoading={isLoading}
      />

      <div className="p-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
          <DateRangePicker onDateChange={handleDateChange} />
        </div>

        {/* Summary Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricCard
            title="Total Journeys"
            value={formatNumber(analytics?.journey_overview?.total_journeys || 0)}
            icon={Map}
            color="purple"
          />
          <MetricCard
            title="Active Journeys"
            value={formatNumber(analytics?.journey_overview?.active_journeys || 0)}
            icon={MapPin}
            color="blue"
          />
          <MetricCard
            title="Completed Journeys"
            value={formatNumber(analytics?.journey_overview?.completed_journeys || 0)}
            icon={CheckCircle}
            color="green"
          />
          <MetricCard
            title="Completion Rate"
            value={`${analytics?.journey_overview?.total_journeys > 0 
              ? ((analytics?.journey_overview?.completed_journeys || 0) / analytics?.journey_overview?.total_journeys * 100).toFixed(1)
              : 0}%`}
            icon={TrendingUp}
            color="green"
          />
        </div>

        {/* Secondary Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricCard
            title="Total Comments"
            value={formatNumber(analytics?.journey_engagement?.total_comments || 0)}
            icon={MessageCircle}
            color="yellow"
          />
          <MetricCard
            title="Avg Duration"
            value={`${analytics?.journey_overview?.avg_journey_duration?.toFixed(1) || 0} days`}
            icon={Clock}
            color="blue"
          />
          <MetricCard
            title="Avg Participants"
            value={analytics?.journey_overview?.avg_participants_per_journey?.toFixed(1) || '0'}
            icon={Users}
            color="purple"
          />
          <MetricCard
            title="Engagement Rate"
            value={`${analytics?.journey_overview?.total_journeys > 0
              ? ((analytics?.journey_engagement?.total_comments || 0) / analytics?.journey_overview?.total_journeys).toFixed(1)
              : 0}`}
            icon={TrendingUp}
            color="green"
          />
        </div>

        {/* Journey Performance Breakdown */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">📊 Journey Performance Metrics</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center justify-center mb-2">
                <Clock className="h-5 w-5 text-blue-600 mr-2" />
                <h4 className="text-sm font-medium text-gray-700">Avg Duration</h4>
              </div>
              <p className="text-3xl font-bold text-blue-600">
                {analytics?.journey_overview?.avg_journey_duration?.toFixed(1) || 0}
              </p>
              <p className="text-xs text-gray-500 mt-1">days</p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="flex items-center justify-center mb-2">
                <Users className="h-5 w-5 text-purple-600 mr-2" />
                <h4 className="text-sm font-medium text-gray-700">Avg Participants</h4>
              </div>
              <p className="text-3xl font-bold text-purple-600">
                {analytics?.journey_overview?.avg_participants_per_journey?.toFixed(1) || 0}
              </p>
              <p className="text-xs text-gray-500 mt-1">per journey</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="flex items-center justify-center mb-2">
                <MessageCircle className="h-5 w-5 text-green-600 mr-2" />
                <h4 className="text-sm font-medium text-gray-700">Avg Comments</h4>
              </div>
              <p className="text-3xl font-bold text-green-600">
                {analytics?.journey_engagement?.avg_comments_per_journey?.toFixed(1) || 0}
              </p>
              <p className="text-xs text-gray-500 mt-1">per journey</p>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <div className="flex items-center justify-center mb-2">
                <TrendingUp className="h-5 w-5 text-yellow-600 mr-2" />
                <h4 className="text-sm font-medium text-gray-700">Engagement</h4>
              </div>
              <p className="text-3xl font-bold text-yellow-600">
                {analytics?.journey_overview?.total_journeys > 0
                  ? ((analytics?.journey_engagement?.total_comments || 0) / analytics?.journey_overview?.total_journeys).toFixed(1)
                  : 0}
              </p>
              <p className="text-xs text-gray-500 mt-1">comments/journey</p>
            </div>
          </div>
        </div>

        {/* Journey Status and Trends */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Journey Status Distribution */}
          {statusDistributionData.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <PieChart
                data={statusDistributionData}
                title="📊 Journey Status Distribution"
                height={350}
              />
            </div>
          )}

          {/* Journey Trends Over Time */}
          {journeyTrendsData.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <LineChart
                data={journeyTrendsData}
                xKey="month"
                yKeys={[{ key: 'journeys', color: '#8b5cf6', name: 'Journeys Created' }]}
                title="📈 Journey Creation Trends"
                height={350}
              />
            </div>
          )}
        </div>

        {/* Duration Distribution */}
        {durationDistributionData.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <BarChart
              data={durationDistributionData}
              xKey="name"
              yKeys={[{ key: 'count', color: '#3b82f6', name: 'Journeys' }]}
              title="⏱️ Journey Duration Distribution"
              height={350}
              horizontal={false}
            />
          </div>
        )}

        {/* Popular Destinations Table */}
        {destinationsData.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">🌍 Popular Destinations</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rank
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Destination
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Journey Count
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Popularity
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {destinationsData.map((dest, idx) => {
                    const maxCount = destinationsData[0]?.count || 1;
                    const percentage = (dest.count / maxCount) * 100;
                    return (
                      <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          #{idx + 1}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{dest.name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-semibold text-purple-600">
                            {formatNumber(dest.count)} journeys
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-24 bg-gray-200 rounded-full h-2 mr-2">
                              <div
                                className="bg-purple-600 h-2 rounded-full"
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

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {destinationsData.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <BarChart
                data={destinationsData}
                xKey="name"
                yKeys={[{ key: 'count', color: '#8b5cf6', name: 'Visits' }]}
                title="✈️ Popular Destinations"
                height={400}
                horizontal={true}
              />
            </div>
          )}

          {mostCommentedData.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <BarChart
                data={mostCommentedData}
                xKey="name"
                yKeys={[{ key: 'comments', color: '#f59e0b', name: 'Comments' }]}
                title="💬 Most Commented Journeys"
                height={400}
                horizontal={true}
              />
            </div>
          )}
        </div>

        {/* Most Commented Journeys Table */}
        {mostCommentedData.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">💬 Most Engaged Journeys</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rank
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Journey Title
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Comments
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Engagement
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {mostCommentedData.map((journey, idx) => {
                    const maxComments = mostCommentedData[0]?.comments || 1;
                    const percentage = (journey.comments / maxComments) * 100;
                    return (
                      <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          #{idx + 1}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{journey.name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-semibold text-orange-600">
                            {formatNumber(journey.comments)} comments
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-24 bg-gray-200 rounded-full h-2 mr-2">
                              <div
                                className="bg-orange-600 h-2 rounded-full"
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
      </div>
    </div>
  );
}

