'use client';

/**
 * Collections Page
 * ===============
 * Browse and explore MongoDB collections
 */

import { useQuery } from '@tanstack/react-query';
import { Header } from '@/components/Header';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ErrorMessage } from '@/components/ErrorMessage';
import { Database, FileText, HardDrive } from 'lucide-react';
import { formatNumber, formatCompactNumber } from '@/lib/utils';
import { getApiUrl, fetchWithTimeout } from '@/lib/api';

interface CollectionInfo {
  name: string;
  count: number;
  size: number;
  avgObjSize: number;
  lastUpdated?: string;
}

interface CollectionsResponse {
  success: boolean;
  data: {
    all: CollectionInfo[];
    categorized: {
      analytics: CollectionInfo[];
      source: CollectionInfo[];
      other: CollectionInfo[];
    };
    total: number;
  };
}

export default function CollectionsPage() {
  const { data, isLoading, error, refetch } = useQuery<CollectionsResponse>({
    queryKey: ['collections'],
    queryFn: async () => {
      const res = await fetchWithTimeout(getApiUrl('api/collections'));
      if (!res.ok) throw new Error('Failed to fetch collections');
      return res.json();
    },
  });

  if (isLoading) {
    return (
      <div>
        <Header title="Collections" subtitle="Browse MongoDB collections" />
        <div className="p-8">
          <LoadingSpinner text="Loading collections..." />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <Header title="Collections" subtitle="Browse MongoDB collections" />
        <div className="p-8">
          <ErrorMessage
            message={error instanceof Error ? error.message : 'An error occurred'}
            onRetry={() => refetch()}
          />
        </div>
      </div>
    );
  }

  const collections = data?.data;

  const renderCollectionCard = (collection: CollectionInfo) => (
    <div key={collection.name} className="bg-white rounded-lg shadow p-6 hover-lift">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center">
          <Database className="h-8 w-8 text-blue-500 mr-3" />
          <div>
            <h3 className="font-semibold text-gray-900">{collection.name}</h3>
            {collection.lastUpdated && (
              <p className="text-xs text-gray-500 mt-1">
                Updated: {new Date(collection.lastUpdated).toLocaleString()}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <div className="flex items-center text-gray-500 mb-1">
            <FileText className="h-4 w-4 mr-1" />
            <span className="text-xs">Documents</span>
          </div>
          <p className="text-lg font-bold text-gray-900">
            {formatNumber(collection.count)}
          </p>
        </div>

        <div>
          <div className="flex items-center text-gray-500 mb-1">
            <HardDrive className="h-4 w-4 mr-1" />
            <span className="text-xs">Size</span>
          </div>
          <p className="text-lg font-bold text-gray-900">
            {formatCompactNumber(collection.size)}B
          </p>
        </div>

        <div>
          <div className="flex items-center text-gray-500 mb-1">
            <FileText className="h-4 w-4 mr-1" />
            <span className="text-xs">Avg Size</span>
          </div>
          <p className="text-lg font-bold text-gray-900">
            {formatCompactNumber(collection.avgObjSize)}B
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <div>
      <Header
        title="Collections"
        subtitle={`${collections?.total || 0} collections in database`}
        onRefresh={() => refetch()}
        isLoading={isLoading}
      />

      <div className="p-8">
        {/* Analytics Collections */}
        {collections?.categorized.analytics && collections.categorized.analytics.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Analytics Collections ({collections.categorized.analytics.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {collections.categorized.analytics.map(renderCollectionCard)}
            </div>
          </div>
        )}

        {/* Source Collections */}
        {collections?.categorized.source && collections.categorized.source.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Source Collections ({collections.categorized.source.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {collections.categorized.source.map(renderCollectionCard)}
            </div>
          </div>
        )}

        {/* Other Collections */}
        {collections?.categorized.other && collections.categorized.other.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Other Collections ({collections.categorized.other.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {collections.categorized.other.map(renderCollectionCard)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

