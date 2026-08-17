import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { BarChart3, CreditCard, Users, UserCheck, RefreshCw } from 'lucide-react';
import { api } from '../data/api';
import { formatCurrency, formatCurrencyDetailed } from '../utils/formatters';
import { useAppStore } from '../stores/useAppStore';
import useSEO from '../hooks/useSEO';
import Skeleton from '../components/UI/Skeleton';
import EmptyState from '../components/UI/EmptyState';
import ReportLineChart from '../components/reports/ReportLineChart';
import {
  asList,
  cumulativeByBucket,
  isPresent,
  makeBuckets,
  percentChange,
  sumByBucket,
  type Period,
} from '../components/reports/buildSeries';

interface DashboardSlice {
  students?: { total?: number };
  payments?: { total_amount?: number; debtors?: number; paid_students?: number };
  income?: { monthly_chart?: { month: string; income: number }[] };
}

const fade = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.2 } };

const Reports: React.FC = () => {
  useSEO('reports');
  const isDark = useAppStore((s) => s.isDark);
  const [period, setPeriod] = useState<Period>('monthly');

  const dashboardQuery = useQuery({
    queryKey: ['reports', 'dashboard'],
    queryFn: () => api.getDashboard() as Promise<DashboardSlice>,
  });

  const paymentsQuery = useQuery({
    queryKey: ['reports', 'payments'],
    queryFn: () => api.getPayments(),
  });

  const studentsQuery = useQuery({
    queryKey: ['reports', 'students'],
    queryFn: () => api.getStudents({ is_active: true }),
  });

  const attendanceQuery = useQuery({
    queryKey: ['reports', 'attendance'],
    queryFn: () => api.getAttendanceRecords(),
  });

  const loading =
    dashboardQuery.isLoading ||
    paymentsQuery.isLoading ||
    studentsQuery.isLoading ||
    attendanceQuery.isLoading;

  const error =
    dashboardQuery.error || paymentsQuery.error || studentsQuery.error || attendanceQuery.error;

  const buckets = useMemo(() => makeBuckets(period), [period]);

  const payments = useMemo(() => asList(paymentsQuery.data), [paymentsQuery.data]);
  const students = useMemo(() => asList(studentsQuery.data), [studentsQuery.data]);
  const records = useMemo(() => asList(attendanceQuery.data), [attendanceQuery.data]);

  const paymentValues = useMemo(() => {
    const fromList = sumByBucket(
      payments,
      ['paid_date', 'created_at', 'createdAt'],
      period,
      buckets,
      (row) => Number(row.amount) || 0
    );
    if (fromList.some((v) => v > 0) || period === 'weekly') return fromList;

    const chart = dashboardQuery.data?.income?.monthly_chart || [];
    return buckets.map((b) => {
      const hit = chart.find((c) => c.month === b.key || c.month?.startsWith(b.key));
      return Number(hit?.income) || 0;
    });
  }, [payments, period, buckets, dashboardQuery.data]);

  const attendanceValues = useMemo(
    () =>
      sumByBucket(
        records.filter((r) => isPresent(r.status)),
        ['session_date', 'date', 'created_at'],
        period,
        buckets,
        () => 1
      ),
    [records, period, buckets]
  );

  const attendanceTotal = useMemo(
    () =>
      sumByBucket(
        records,
        ['session_date', 'date', 'created_at'],
        period,
        buckets,
        () => 1
      ),
    [records, period, buckets]
  );

  const studentValues = useMemo(() => {
    const cumulative = cumulativeByBucket(
      students,
      ['created_at', 'createdAt', 'joined_at', 'joinedAt'],
      period,
      buckets
    );
    if (cumulative.some((v) => v > 0)) return cumulative;
    const total = Number(dashboardQuery.data?.students?.total) || students.length;
    return buckets.map((_, i) => (i === buckets.length - 1 ? total : 0));
  }, [students, period, buckets, dashboardQuery.data]);

  const paymentPoints = buckets.map((b, i) => ({ label: b.label, value: paymentValues[i] }));
  const attendancePoints = buckets.map((b, i) => ({ label: b.label, value: attendanceValues[i] }));
  const studentPoints = buckets.map((b, i) => ({ label: b.label, value: studentValues[i] }));

  const paySum = paymentValues.reduce((a, b) => a + b, 0);
  const attSum = attendanceValues.reduce((a, b) => a + b, 0);
  const attAll = attendanceTotal.reduce((a, b) => a + b, 0);
  const attRate = attAll > 0 ? Math.round((attSum / attAll) * 100) : 0;
  const studentNow =
    studentValues[studentValues.length - 1] ||
    Number(dashboardQuery.data?.students?.total) ||
    students.length;

  const lastPay = paymentValues[paymentValues.length - 1] || 0;
  const prevPay = paymentValues[paymentValues.length - 2] || 0;
  const payDelta = percentChange(lastPay, prevPay);

  const dashPay = Number(dashboardQuery.data?.payments?.total_amount) || 0;
  const debtors = Number(dashboardQuery.data?.payments?.debtors) || 0;

  const refetch = () => {
    void dashboardQuery.refetch();
    void paymentsQuery.refetch();
    void studentsQuery.refetch();
    void attendanceQuery.refetch();
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-9 w-56" />
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-80 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <EmptyState
        icon={BarChart3}
        title="Hisobot yuklanmadi"
        description={error instanceof Error ? error.message : 'Qayta urinib ko‘ring'}
        action={{ label: 'Qayta yuklash', onClick: refetch }}
      />
    );
  }

  const kpis = [
    {
      title: 'Talabalar',
      value: studentNow,
      hint: period === 'weekly' ? 'Joriy son' : 'Davr oxiri',
      icon: Users,
      tone: 'brand' as const,
    },
    {
      title: period === 'weekly' ? 'Haftalik to‘lov' : '12 oylik to‘lov',
      value: formatCurrency(paySum || dashPay),
      hint: payDelta == null ? 'Taqqoslash yo‘q' : `${payDelta > 0 ? '+' : ''}${payDelta}% oxirgi davr`,
      icon: CreditCard,
      tone: 'success' as const,
    },
    {
      title: 'Davomat',
      value: `${attRate}%`,
      hint: `${attSum} / ${attAll} yozuv`,
      icon: UserCheck,
      tone: 'info' as const,
    },
    {
      title: 'Qarzdorlar',
      value: debtors,
      hint: `${dashboardQuery.data?.payments?.paid_students ?? 0} ta to‘lagan`,
      icon: BarChart3,
      tone: 'warning' as const,
    },
  ];

  const toneClass = {
    brand: 'bg-brand-50 text-brand-600 dark:bg-brand-900/20 dark:text-brand-400',
    success: 'bg-success-50 text-success-600 dark:bg-success-900/20 dark:text-success-400',
    info: 'bg-info-50 text-info-600 dark:bg-info-900/20 dark:text-info-400',
    warning: 'bg-warning-50 text-warning-600 dark:bg-warning-900/20 dark:text-warning-400',
  };

  const charts = [
    {
      title: 'To‘lovlar',
      subtitle: period === 'weekly' ? 'So‘nggi 7 kun' : 'So‘nggi 12 oy',
      data: paymentPoints,
      color: '#2563eb',
      formatter: (v: number) => formatCurrency(v),
      empty: paymentPoints.every((p) => p.value === 0),
    },
    {
      title: 'Davomat',
      subtitle: 'Bor deb belgilangan yozuvlar',
      data: attendancePoints,
      color: '#059669',
      formatter: (v: number) => String(v),
      empty: attendancePoints.every((p) => p.value === 0),
    },
    {
      title: 'Talabalar soni',
      subtitle: 'Yig‘ma (shu kungacha)',
      data: studentPoints,
      color: '#0284c7',
      formatter: (v: number) => String(v),
      empty: studentPoints.every((p) => p.value === 0),
    },
  ];

  return (
    <motion.div {...fade} className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-surface-900 dark:text-white">Hisobotlar</h1>
          <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">
            To‘lov, davomat va talabalar dinamikasi
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="inline-flex p-1 rounded-xl bg-surface-100 dark:bg-surface-800 border border-surface-200 dark:border-surface-700">
            {(['weekly', 'monthly'] as Period[]).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-brand-500/40 ${
                  period === p
                    ? 'bg-white dark:bg-surface-900 text-brand-700 dark:text-brand-400 shadow-sm'
                    : 'text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-white'
                }`}
              >
                {p === 'weekly' ? 'Haftalik' : 'Oylik'}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={refetch}
            className="p-2 rounded-xl border border-surface-200 dark:border-surface-700 text-surface-600 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-brand-500/40"
            title="Yangilash"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div
              key={kpi.title}
              className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 shadow-sm p-5"
            >
              <div className="flex items-start justify-between">
                <p className="text-sm font-medium text-surface-500 dark:text-surface-400">{kpi.title}</p>
                <span className={`inline-flex p-2 rounded-xl ${toneClass[kpi.tone]}`}>
                  <Icon className="w-4 h-4" />
                </span>
              </div>
              <p className="mt-3 text-2xl font-semibold text-surface-900 dark:text-white">{kpi.value}</p>
              <p className="mt-1 text-xs text-surface-500 dark:text-surface-400">{kpi.hint}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {charts.map((chart) => (
          <div
            key={chart.title}
            className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 shadow-sm p-5"
          >
            <div className="mb-4">
              <h2 className="text-base font-semibold text-surface-900 dark:text-white">{chart.title}</h2>
              <p className="text-xs text-surface-500 dark:text-surface-400 mt-0.5">{chart.subtitle}</p>
            </div>
            <ReportLineChart
              data={chart.data}
              color={chart.color}
              formatter={chart.formatter}
              isDark={isDark}
              empty={chart.empty}
            />
          </div>
        ))}
      </div>

      <div className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-surface-200 dark:border-surface-800">
          <h2 className="text-base font-semibold text-surface-900 dark:text-white">Davr kesimi</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-surface-500 dark:text-surface-400">
                <th className="px-5 py-3 font-medium">Davr</th>
                <th className="px-5 py-3 font-medium">To‘lov</th>
                <th className="px-5 py-3 font-medium">Davomat</th>
                <th className="px-5 py-3 font-medium">Talabalar</th>
              </tr>
            </thead>
            <tbody>
              {buckets.map((b, i) => (
                <tr
                  key={b.key}
                  className="border-t border-surface-100 dark:border-surface-800 text-surface-800 dark:text-surface-200"
                >
                  <td className="px-5 py-3">{b.label}</td>
                  <td className="px-5 py-3">{formatCurrencyDetailed(paymentValues[i])}</td>
                  <td className="px-5 py-3">{attendanceValues[i]}</td>
                  <td className="px-5 py-3">{studentValues[i]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
};

export default Reports;
