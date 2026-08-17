import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';

export interface ReportPoint {
  label: string;
  value: number;
}

interface ReportLineChartProps {
  data: ReportPoint[];
  color: string;
  formatter?: (value: number) => string;
  isDark: boolean;
  empty?: boolean;
}

const ReportLineChart: React.FC<ReportLineChartProps> = ({
  data,
  color,
  formatter = (v) => String(v),
  isDark,
  empty,
}) => {
  const axis = isDark ? '#94a3b8' : '#64748b';
  const grid = isDark ? '#334155' : '#e2e8f0';
  const text = isDark ? '#cbd5e1' : '#334155';
  const tooltipBg = isDark ? '#0f172a' : '#ffffff';
  const tooltipBorder = isDark ? '#334155' : '#e2e8f0';

  if (empty) {
    return (
      <div className="h-[260px] flex items-center justify-center text-sm text-surface-400">
        Bu davr uchun ma'lumot yo'q
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid stroke={grid} strokeDasharray="3 3" strokeOpacity={0.6} />
        <XAxis
          dataKey="label"
          stroke={axis}
          tick={{ fill: text, fontSize: 11 }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          stroke={axis}
          tick={{ fill: text, fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          width={56}
          tickFormatter={(v: number) => formatter(v)}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: tooltipBg,
            border: `1px solid ${tooltipBorder}`,
            borderRadius: 12,
            fontSize: 12,
            color: text,
            boxShadow: 'none',
          }}
          formatter={(value) => [formatter(Number(value)), '']}
        />
        <Line
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={2.5}
          dot={{ r: 3.5, fill: color, strokeWidth: 0 }}
          activeDot={{ r: 5, fill: color, strokeWidth: 0 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default ReportLineChart;
