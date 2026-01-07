'use client';

/**
 * Bar Chart Component
 * ==================
 * Reusable bar chart using Recharts
 */

import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface BarChartProps {
  data: any[];
  xKey: string;
  yKeys: Array<{ key: string; color: string; name: string }>;
  height?: number;
  title?: string;
  horizontal?: boolean;
}

export function BarChart({ 
  data, 
  xKey, 
  yKeys, 
  height = 300,
  title,
  horizontal = false 
}: BarChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        No data available
      </div>
    );
  }

  return (
    <div className="w-full">
      {title && (
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      )}
      <ResponsiveContainer width="100%" height={height}>
        <RechartsBarChart 
          data={data}
          layout={horizontal ? 'vertical' : 'horizontal'}
          margin={horizontal ? { top: 5, right: 30, left: 20, bottom: 5 } : { top: 5, right: 30, left: 0, bottom: 5 }}
          barCategoryGap={horizontal ? "10%" : "20%"}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          {horizontal ? (
            <>
              <XAxis type="number" stroke="#6b7280" style={{ fontSize: '12px' }} />
              <YAxis 
                type="category" 
                dataKey={xKey} 
                stroke="#6b7280" 
                style={{ fontSize: '12px' }}
                width={200}
                interval={0}
                tick={{ fill: '#374151', fontSize: 11 }}
                tickMargin={10}
                tickFormatter={(value) => {
                  if (!value) return '';
                  // Truncate long labels and add ellipsis
                  const maxLength = 35;
                  if (value.length > maxLength) {
                    return value.substring(0, maxLength) + '...';
                  }
                  return value;
                }}
                angle={0}
              />
            </>
          ) : (
            <>
              <XAxis 
                dataKey={xKey} 
                stroke="#6b7280" 
                style={{ fontSize: '12px' }}
              />
              <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
            </>
          )}
          <Tooltip 
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: '6px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            }}
          />
          <Legend />
          {yKeys.map((yKey) => (
            <Bar
              key={yKey.key}
              dataKey={yKey.key}
              fill={yKey.color}
              name={yKey.name}
              radius={[4, 4, 0, 0]}
            />
          ))}
        </RechartsBarChart>
      </ResponsiveContainer>
    </div>
  );
}

