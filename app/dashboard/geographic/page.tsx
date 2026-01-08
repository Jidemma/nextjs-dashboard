'use client';

/**
 * Geographic Analytics Page - Enhanced
 * ====================================
 * Comprehensive geographic distribution and travel patterns
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
import { DestinationMap } from '@/components/DestinationMap';
import { MapPin, Globe, Users, TrendingUp } from 'lucide-react';
import { downloadJSON, formatNumber } from '@/lib/utils';
import { getApiUrl, fetchWithTimeout } from '@/lib/api';
import type { ApiResponse } from '@/types/analytics';

export default function GeographicPage() {
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [mapView, setMapView] = useState<'destinations' | 'user_locations'>('destinations');
  const queryClient = useQueryClient();

  const { data, isLoading, error, refetch } = useQuery<ApiResponse<any>>({
    queryKey: ['geographic', startDate, endDate],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      
      const res = await fetchWithTimeout(getApiUrl(`api/analytics/geographic?${params}`));
      if (!res.ok) throw new Error('Failed to fetch geographic analytics');
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
      queryClient.invalidateQueries({ queryKey: ['geographic'] });
    }, 0);
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  const handleExport = () => {
    if (data?.data) {
      downloadJSON(data.data, `geographic-analytics-${new Date().toISOString()}.json`);
    }
  };

  if (isLoading) {
    return (
      <div>
        <Header title="Geographic Analytics" subtitle="Geographic distribution and travel patterns" />
        <div className="p-8">
          <LoadingSpinner text="Loading geographic analytics..." />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <Header title="Geographic Analytics" subtitle="Geographic distribution and travel patterns" />
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
  const summaryMetrics = analytics?.summary_metrics || {};
  const userLocations = analytics?.user_locations || {};
  const regionalEngagement = analytics?.regional_engagement || {};
  const destinationCoords = analytics?.destination_coordinates || [];
  const userLocationCoords = userLocations?.location_coordinates || [];
  const allDestinations = analytics?.all_destinations || [];
  
  // Determine which map data to show based on toggle
  const mapData = mapView === 'destinations' ? destinationCoords : userLocationCoords;
  const mapTitle = mapView === 'destinations' 
    ? '🗺️ Interactive Destination Map' 
    : '👥 User Locations Map';
  const mapDescription = mapView === 'destinations'
    ? 'Where users travel to • Click markers for details'
    : 'Where users are from • Click markers for details';
  const mapCount = mapView === 'destinations' 
    ? destinationCoords.length 
    : userLocationCoords.length;

  // Prepare data for charts - use top 20 for bar chart readability
  const destinationsData = allDestinations.slice(0, 20).map((d: any) => ({
    name: d.destination,
    visits: d.visits,
    hasCoords: d.has_coordinates,
  })) || [];

  const userLocationsData = userLocations?.top_locations?.slice(0, 10).map((loc: any) => ({
    name: loc.location,
    users: loc.user_count,
  })) || [];

  const regionalData = regionalEngagement?.regions?.map((r: any) => ({
    name: r.region,
    users: r.user_count,
    destinations: r.destination_count,
    popularity: r.popularity_score,
  })) || [];

  const regionalPieData = regionalEngagement?.regions
    ?.filter((r: any) => r.user_count > 0)
    .map((r: any) => ({
      name: r.region,
      value: r.user_count,
    })) || [];

  return (
    <div>
      <Header
        title="Geographic Analytics"
        subtitle="Geographic distribution and travel patterns"
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
            title="Total Destinations"
            value={summaryMetrics.unique_destinations || 0}
            icon={Globe}
            color="blue"
          />
          <MetricCard
            title="On Map (with coords)"
            value={summaryMetrics.destinations_with_coordinates || 0}
            icon={MapPin}
            color="green"
          />
          <MetricCard
            title="Names Only"
            value={summaryMetrics.destinations_without_coordinates || 0}
            icon={TrendingUp}
            color="yellow"
          />
          <MetricCard
            title="User Locations"
            value={summaryMetrics.unique_user_locations || 0}
            icon={Users}
            color="purple"
          />
        </div>

        {/* Interactive Map with Toggle */}
        {(destinationCoords.length > 0 || userLocationCoords.length > 0) && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2 flex-wrap">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {mapTitle}
                  </h3>
                  {/* Toggle Switch */}
                  <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
                    <button
                      onClick={() => setMapView('destinations')}
                      className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${
                        mapView === 'destinations'
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                      disabled={destinationCoords.length === 0}
                    >
                      🌍 Destinations
                      {destinationCoords.length > 0 && (
                        <span className="ml-1 text-xs opacity-75">
                          ({destinationCoords.length})
                        </span>
                      )}
                    </button>
                    <button
                      onClick={() => setMapView('user_locations')}
                      className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${
                        mapView === 'user_locations'
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                      disabled={userLocationCoords.length === 0}
                    >
                      👥 User Locations
                      {userLocationCoords.length > 0 && (
                        <span className="ml-1 text-xs opacity-75">
                          ({userLocationCoords.length})
                        </span>
                      )}
                    </button>
                  </div>
                </div>
                <p className="text-sm text-gray-500">
                  {mapDescription} • Scroll to zoom • Drag to pan
                </p>
              </div>
              <div className="flex gap-2 ml-4">
                {mapData.length > 0 ? (
                  <>
                    <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">
                      {mapCount} on map
                    </span>
                    {mapView === 'destinations' && (
                      <span className="px-3 py-1 bg-gray-100 text-gray-800 text-xs font-semibold rounded-full">
                        {allDestinations.length} total
                      </span>
                    )}
                    {mapView === 'user_locations' && (
                      <span className="px-3 py-1 bg-gray-100 text-gray-800 text-xs font-semibold rounded-full">
                        {userLocations.top_locations?.length || 0} locations
                      </span>
                    )}
                  </>
                ) : (
                  <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-xs font-semibold rounded-full">
                    No coordinates available
                  </span>
                )}
              </div>
            </div>
            {mapData.length > 0 ? (
              <DestinationMap 
                destinations={mapData} 
                label={mapView === 'destinations' ? 'visits' : 'users'}
                icon={mapView === 'destinations' ? '✈️' : '👥'}
              />
            ) : (
              <div className="w-full h-96 bg-gray-50 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300">
                <div className="text-center">
                  <p className="text-gray-500 font-medium mb-1">
                    No map data available for {mapView === 'destinations' ? 'destinations' : 'user locations'}
                  </p>
                  <p className="text-sm text-gray-400">
                    Try switching to the other view or check your data
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* All Destinations Table */}
        {allDestinations.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  ✈️ Complete Destinations List
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  All {allDestinations.length} unique travel destinations •{' '}
                  <span className="text-green-600 font-medium">
                    {destinationCoords.length} visible on map
                  </span>
                  {' • '}
                  <span className="text-gray-600 font-medium">
                    {allDestinations.length - destinationCoords.length} without coordinates
                  </span>
                </p>
              </div>
            </div>
            <div className="overflow-x-auto max-h-96 overflow-y-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rank
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Destination
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Visits
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Map Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {allDestinations.map((dest: any, idx: number) => (
                    <tr
                      key={idx}
                      className={`${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50 transition-colors`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        #{idx + 1}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className="text-sm font-medium text-gray-900">
                            {dest.destination}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className="text-sm font-semibold text-blue-600">
                            {dest.visits}
                          </span>
                          <span className="text-xs text-gray-500 ml-1">trips</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {dest.has_coordinates ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <svg className="mr-1 h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            On Map
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                            <svg className="mr-1 h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                            Name Only
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* User Locations & Regional Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* User Locations */}
          {userLocationsData.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <BarChart
                data={userLocationsData}
                xKey="name"
                yKeys={[{ key: 'users', color: '#10b981', name: 'Users' }]}
                title="👥 Where Our Users Are From"
                height={350}
                horizontal={true}
              />
            </div>
          )}

          {/* Regional Pie Chart */}
          {regionalPieData.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <PieChart
                data={regionalPieData}
                title="🌍 Users by Region"
                height={350}
              />
            </div>
          )}
        </div>

        {/* Regional Engagement Details */}
        {regionalData.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              📊 Regional Engagement Breakdown
            </h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Region
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Users
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Destinations
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Popularity Score
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {regionalData
                    .sort((a: any, b: any) => b.popularity - a.popularity)
                    .map((region: any, idx: number) => (
                      <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {region.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatNumber(region.users)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatNumber(region.destinations)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-24 bg-gray-200 rounded-full h-2 mr-2">
                              <div
                                className="bg-blue-600 h-2 rounded-full"
                                style={{ width: `${Math.min(region.popularity, 100)}%` }}
                              />
                            </div>
                            <span className="text-sm text-gray-700">
                              {region.popularity.toFixed(1)}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Popular Destinations */}
        {destinationsData.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <BarChart
              data={destinationsData}
              xKey="name"
              yKeys={[{ key: 'visits', color: '#f59e0b', name: 'Visits' }]}
              title="✈️ Popular Travel Destinations"
              height={Math.max(500, destinationsData.length * 35)}
              horizontal={true}
            />
          </div>
        )}
      </div>
    </div>
  );
}
