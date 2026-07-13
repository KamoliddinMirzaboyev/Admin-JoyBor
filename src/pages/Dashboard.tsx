import React from 'react';
import { Users, Building2, CreditCard, FileText, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import StatsCard from '../components/UI/StatsCard';
import Skeleton from '../components/UI/Skeleton';
import { useEffect, useState } from 'react';
import { formatCurrency } from '../utils/formatters';
import { get } from '../data/api';
import { useAppStore } from '../stores/useAppStore';

interface RoomStats {
  rooms: number;
  capacity: number;
  occupied: number;
  free: number;
}

interface DashboardData {
  students: { total: number; male: number; female: number; active: number; inactive: number; by_course: Record<string, number> };
  rooms: { total: RoomStats; male: RoomStats; female: RoomStats };
  payments: { total: number; approved: number; cancelled: number; total_amount: number; paid_students: number; debtors: number };
  applications: { total: number; pending: number; approved: number; rejected: number; cancelled: number };
  income: { monthly_chart: { month: string; income: number }[] };
}

const Dashboard: React.FC = () => {
  const isDarkMode = useAppStore((state) => state.isDark);

  // Fetch dashboard data from API
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [dashboardError, setDashboardError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      setDashboardLoading(true);
      setDashboardError(null);
      try {
        const data = await get('/admin/dashboard/');
        setDashboardData(data as DashboardData);
      } catch (err) {
        setDashboardError(err instanceof Error ? err.message : 'Xatolik yuz berdi');
      } finally {
        setDashboardLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  // Use real dashboard data with proper type checking
  const students = dashboardData?.students || { total: 0, male: 0, female: 0, active: 0, inactive: 0, by_course: {} };
  const rooms = dashboardData?.rooms?.total || { rooms: 0, capacity: 0, occupied: 0, free: 0 };
  const roomsMale = dashboardData?.rooms?.male || { rooms: 0, capacity: 0, occupied: 0, free: 0 };
  const roomsFemale = dashboardData?.rooms?.female || { rooms: 0, capacity: 0, occupied: 0, free: 0 };
  const payments = dashboardData?.payments || {
    total: 0,
    approved: 0,
    cancelled: 0,
    total_amount: 0,
    paid_students: 0,
    debtors: 0
  };
  const applications = dashboardData?.applications || { total: 0, pending: 0, approved: 0, rejected: 0, cancelled: 0 };
  const monthlyRevenue = dashboardData?.income?.monthly_chart || [];
  const monthlyRevenueLoading = dashboardLoading;

  // Show skeleton until data is loaded
  if (dashboardLoading) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-9 w-64" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-40 w-full rounded-2xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {[0, 1].map((i) => (
            <Skeleton key={i} className="h-80 w-full rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  // Show error state if dashboard data fails to load
  if (dashboardError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="text-danger-500 mb-4">
          <AlertTriangle className="w-16 h-16 mx-auto mb-2" />
          <h2 className="text-xl font-semibold">Ma'lumotlarni yuklashda xatolik</h2>
          <p className="text-surface-600 dark:text-surface-400 mt-2">
            Iltimos, internetga ulanishingizni tekshiring
          </p>
        </div>
      </div>
    );
  }

  // Add this helper for Uzbek month names:
  const uzMonths = ['Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun', 'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr'];
  function formatMonth(monthStr: string) {
    // monthStr: '2025-07'
    if (!monthStr || !monthStr.includes('-')) return monthStr;
    const [year, month] = monthStr.split('-');
    const m = parseInt(month, 10);
    if (isNaN(m) || m < 1 || m > 12) return monthStr;
    return `${uzMonths[m - 1]} ${year}`;
  }

  // Chart tema ranglari (surface/slate palette)
  const chartTheme = {
    tooltip: {
      backgroundColor: isDarkMode ? '#1e293b' : '#ffffff',
      border: isDarkMode ? '1px solid #475569' : '1px solid #e2e8f0',
      color: isDarkMode ? '#f8fafc' : '#334155',
      boxShadow: isDarkMode
        ? '0 10px 25px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(71, 85, 105, 0.1)'
        : '0 10px 25px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(226, 232, 240, 0.1)'
    },
    axis: {
      stroke: isDarkMode ? '#94a3b8' : '#64748b'
    },
    grid: {
      stroke: isDarkMode ? '#475569' : '#e2e8f0'
    },
    text: {
      fill: isDarkMode ? '#cbd5e1' : '#334155'
    }
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-surface-900 dark:text-white">Dashboard</h1>
          <p className="text-surface-600 dark:text-surface-400 mt-1">
            Yotoqxona boshqaruvi umumiy ko'rinishi
          </p>
        </div>
        <div className="flex items-center space-x-3 mt-4 sm:mt-0">
          <div className="text-sm text-surface-500 dark:text-surface-400">
            Oxirgi yangilanish: {new Date().toLocaleString('uz-UZ')}
          </div>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <div className="w-full flex flex-col items-center">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 w-full max-w-7xl">
          <StatsCard
            title="Talabalar"
            value={students.total}
            change={undefined}
            changeType="neutral"
            icon={Users}
            color="primary"
            trend={undefined}
            subStats={[
              { label: 'Jami', value: students.total },
              { label: 'Erkaklar', value: students.male },
              { label: 'Ayollar', value: students.female },
              { label: 'Faol', value: students.active },
            ]}
          />
          <StatsCard
            title="Xonalar"
            value={rooms.rooms}
            change={`Bo'sh: ${rooms.free}, Band: ${rooms.occupied}`}
            changeType="neutral"
            icon={Building2}
            color="info"
            trend={undefined}
            subStats={[
              { label: "Jami xonalar", value: rooms.rooms },
              { label: "Sig'im", value: rooms.capacity },
              { label: "Band", value: rooms.occupied },
              { label: "Bo'sh", value: rooms.free },
            ]}
          />
          <StatsCard
            title="To'lovlar"
            value={formatCurrency(payments.total_amount)}
            change={`Qarzdor: ${payments.debtors}, To'lagan: ${payments.paid_students}`}
            changeType="increase"
            icon={CreditCard}
            color="success"
            trend={undefined}
            subStats={[
              { label: 'Jami to\'lovlar', value: payments.total },
              { label: 'Tasdiqlangan', value: payments.approved },
              { label: 'Qarzdorlar', value: payments.debtors },
              { label: 'To\'laganlar', value: payments.paid_students },
            ]}
          />
          <StatsCard
            title="Arizalar"
            value={applications.total}
            change={`Kutilmoqda: ${applications.pending}`}
            changeType="neutral"
            icon={FileText}
            color="warning"
            trend={undefined}
            subStats={[
              { label: 'Jami', value: applications.total },
              { label: 'Kutilmoqda', value: applications.pending },
              { label: 'Tasdiqlangan', value: applications.approved },
              { label: 'Rad etilgan', value: applications.rejected },
            ]}
          />
        </div>
      </div>

      {/* Charts and Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Revenue Chart */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white dark:bg-surface-900 rounded-2xl shadow-sm p-6 border border-surface-200 dark:border-surface-800"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-surface-900 dark:text-white">
              Oylik Daromad
            </h3>
          </div>
          {monthlyRevenueLoading ? (
            <Skeleton className="h-[300px] w-full rounded-xl" />
          ) : !monthlyRevenue || monthlyRevenue.length === 0 ? (
            <div className="flex items-center justify-center h-[300px] text-surface-400 dark:text-surface-500">
              Analitik ma'lumotlar mavjud emas
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyRevenue}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid.stroke} strokeOpacity={0.3} />
                <XAxis
                  dataKey="month"
                  stroke={chartTheme.axis.stroke}
                  fontSize={12}
                  tickFormatter={formatMonth}
                  tick={{ fill: chartTheme.text.fill }}
                />
                <YAxis
                  stroke={chartTheme.axis.stroke}
                  fontSize={12}
                  tickFormatter={value => {
                    if (value >= 1000000000000) {
                      return `${(value / 1000000000000).toFixed(0)} TRLN`;
                    } else if (value >= 1000000000) {
                      return `${(value / 1000000000).toFixed(0)} MLRD`;
                    } else if (value >= 1000000) {
                      return `${(value / 1000000).toFixed(0)} MLN`;
                    } else if (value >= 1000) {
                      return `${(value / 1000).toFixed(0)}K`;
                    }
                    return value.toString();
                  }}
                  tick={{ fill: chartTheme.text.fill }}
                />
                <Tooltip
                  formatter={(value: number) => [formatCurrency(value), 'Daromad']}
                  labelFormatter={formatMonth}
                  labelStyle={{
                    color: chartTheme.tooltip.color,
                    fontWeight: '600',
                    marginBottom: '6px',
                    fontSize: '13px'
                  }}
                  contentStyle={{
                    backgroundColor: chartTheme.tooltip.backgroundColor,
                    border: chartTheme.tooltip.border,
                    borderRadius: '12px',
                    color: chartTheme.tooltip.color,
                    boxShadow: chartTheme.tooltip.boxShadow,
                    fontSize: '14px',
                    fontWeight: '500',
                    padding: '12px 16px',
                    minWidth: '160px'
                  }}
                  itemStyle={{
                    color: chartTheme.tooltip.color,
                    fontSize: '14px',
                    fontWeight: '500'
                  }}
                />
                <Bar
                  dataKey="income"
                  fill="url(#barGradient)"
                  radius={[4, 4, 0, 0]}
                />
                <defs>
                  <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#14b8a6" />
                    <stop offset="100%" stopColor="#0f766e" />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          )}
        </motion.div>

        {/* Room Status Pie Chart */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white dark:bg-surface-900 rounded-2xl shadow-sm p-6 border border-surface-200 dark:border-surface-800"
        >
          <h3 className="text-lg font-semibold text-surface-900 dark:text-white mb-6">
            Xonalar Holati
          </h3>
          {dashboardLoading ? (
            <Skeleton className="h-[300px] w-full rounded-xl" />
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={[
                    { name: 'Band joylar', value: rooms.occupied || 0 },
                    { name: "Yigitlar uchun bo'sh joylar", value: roomsMale.free || 0 },
                    { name: "Qizlar uchun bo'sh joylar", value: roomsFemale.free || 0 },
                  ]}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={120}
                  paddingAngle={5}
                  dataKey="value"
                >
                  <Cell key="occupied" fill="#0f766e" />
                  <Cell key="male" fill="#14b8a6" />
                  <Cell key="female" fill="#5eead4" />
                </Pie>
                <Tooltip
                  formatter={(value: number, name: string) => [
                    `${value} ta joy`,
                    name
                  ]}
                  contentStyle={{
                    backgroundColor: chartTheme.tooltip.backgroundColor,
                    border: chartTheme.tooltip.border,
                    borderRadius: '12px',
                    color: chartTheme.tooltip.color,
                    boxShadow: chartTheme.tooltip.boxShadow,
                    fontSize: '14px',
                    fontWeight: '500',
                    padding: '12px 16px',
                    minWidth: '120px'
                  }}
                  labelStyle={{
                    color: chartTheme.tooltip.color,
                    fontWeight: '600',
                    marginBottom: '4px',
                    fontSize: '13px'
                  }}
                  itemStyle={{
                    color: chartTheme.tooltip.color,
                    fontSize: '14px',
                    fontWeight: '500'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
          <div className="flex flex-wrap justify-center gap-6 mt-6">
            <div className="flex items-center space-x-3 bg-brand-50 dark:bg-brand-900/20 px-3 py-2 rounded-xl">
              <span className="inline-block w-3 h-3 rounded-full bg-brand-700"></span>
              <span className="text-sm font-medium text-brand-700 dark:text-brand-300">Band joylar ({rooms.occupied || 0})</span>
            </div>
            <div className="flex items-center space-x-3 bg-brand-50 dark:bg-brand-900/20 px-3 py-2 rounded-xl">
              <span className="inline-block w-3 h-3 rounded-full bg-brand-500"></span>
              <span className="text-sm font-medium text-brand-700 dark:text-brand-300">Yigitlar uchun bo'sh joylar ({roomsMale.free || 0})</span>
            </div>
            <div className="flex items-center space-x-3 bg-brand-50 dark:bg-brand-900/20 px-3 py-2 rounded-xl">
              <span className="inline-block w-3 h-3 rounded-full bg-brand-300"></span>
              <span className="text-sm font-medium text-brand-700 dark:text-brand-300">Qizlar uchun bo'sh joylar ({roomsFemale.free || 0})</span>
            </div>
          </div>
        </motion.div>
      </div>


    </div>
  );
};

export default Dashboard;