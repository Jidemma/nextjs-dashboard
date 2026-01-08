'use client';

/**
 * Pie Chart Component
 * ==================
 * Reusable pie chart using Recharts
 */

import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { generateChartColors } from '@/lib/utils';

interface PieChartProps {
  data: Array<{ name: string; value: number }>;
  height?: number;
  title?: string;
  colors?: string[];
}

export function PieChart({ 
  data, 
  height = 300,
  title,
  colors 
}: PieChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        No data available
      </div>
    );
  }

  const chartColors = colors || generateChartColors(data.length);

  return (
    <div className="w-full">
      {title && (
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      )}
      <ResponsiveContainer width="100%" height={height}>
        <RechartsPieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) => {
              // Only show label if slice is large enough (>= 3%) to avoid overlap
              if (percent >= 0.03) {
                return `${name}: ${(percent * 100).toFixed(0)}%`;
              }
              return '';
            }}
            outerRadius={height >= 400 ? 140 : height >= 350 ? 120 : 100}
            innerRadius={0}
            fill="#8884d8"
            dataKey="value"
            paddingAngle={2}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
            ))}
          </Pie>
          <Tooltip 
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: '6px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            }}
          />
          <Legend 
            wrapperStyle={{ paddingTop: '20px' }}
            iconType="circle"
          />
        </RechartsPieChart>
      </ResponsiveContainer>
    </div>
  );
}

