import React from 'react';
import { Link } from 'react-router-dom';
import { Users } from 'lucide-react';
import DataTable from '../UI/DataTable';
import EmptyState from '../UI/EmptyState';

export interface PaymentSummary {
  is_debtor?: boolean;
  total_amount?: number | string;
}

export interface Student {
  id: number | string;
  name?: string;
  last_name?: string;
  direction?: string;
  room_name?: string;
  floor_name?: string;
  payment_summary?: PaymentSummary;
  gender?: string;
  room?: number | string;
  floor?: number | string;
  is_active?: boolean;
  [key: string]: unknown;
}

interface StudentsTableProps {
  students: Student[];
  onExport: () => void;
}

const columns = [
  {
    key: 'index',
    title: '№',
    render: (_: unknown, row: Record<string, unknown>) => (
      <span className="text-surface-500 dark:text-surface-400 font-semibold">{(row._idx as number) + 1}</span>
    ),
  },
  {
    key: 'fullName',
    title: 'Familiya Ism',
    sortable: true,
    render: (_: unknown, row: Record<string, unknown>) => (
      <Link to={`/studentprofile/${row.id}`} className="font-medium text-brand-600 hover:underline dark:text-brand-400">
        {String(row.last_name ?? '')} {String(row.name ?? '')}
      </Link>
    ),
  },
  {
    key: 'direction',
    title: "Yo'nalish",
    render: (value: unknown) => <span className="text-sm text-surface-700 dark:text-surface-300">{value ? String(value) : '-'}</span>,
  },
  {
    key: 'room_name',
    title: 'Xona',
    render: (value: unknown) => (
      <span className="px-2 py-1 bg-brand-100 dark:bg-brand-900/20 text-brand-800 dark:text-brand-300 rounded-full text-sm font-medium">
        {value ? String(value) : '-'}
      </span>
    ),
  },
  {
    key: 'floor_name',
    title: 'Qavat',
    render: (value: unknown) => <span className="text-sm text-surface-700 dark:text-surface-300">{value ? String(value) : '-'}</span>,
  },
  {
    key: 'payment_summary',
    title: "To'lov holati",
    render: (value: unknown) => {
      const isDebtor = (value as PaymentSummary | undefined)?.is_debtor;
      return (
        <span
          className={`px-2.5 py-1 rounded-full text-xs font-bold ${
            !isDebtor
              ? 'bg-success-100 text-success-700 dark:bg-success-900/30 dark:text-success-400'
              : 'bg-danger-100 text-danger-700 dark:bg-danger-900/30 dark:text-danger-400'
          }`}
        >
          {!isDebtor ? 'Haqdor' : 'Qarzdor'}
        </span>
      );
    },
  },
  {
    key: 'payment_total',
    title: "Jami to'lov",
    render: (_: unknown, row: Record<string, unknown>) => {
      const summary = row.payment_summary as PaymentSummary | undefined;
      return (
        <div className="flex flex-col">
          <span className="text-sm font-bold text-surface-900 dark:text-white">
            {summary?.total_amount ? Number(summary.total_amount).toLocaleString() : '0'}
          </span>
          <span className="text-[10px] text-surface-400 font-bold uppercase">UZS</span>
        </div>
      );
    },
  },
];

const StudentsTable: React.FC<StudentsTableProps> = ({ students, onExport }) => {
  const rows: Record<string, unknown>[] = students.map((s, idx) => ({ ...s, _idx: idx }));

  return (
    <div className="rounded-2xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 shadow-sm overflow-hidden">
      {students.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Talabalar topilmadi"
          description="Filtrlarni o'zgartirib ko'ring yoki yangi talaba qo'shing."
        />
      ) : (
        <DataTable
          data={rows}
          columns={columns}
          actions={null}
          searchable
          filterable={false}
          pagination
          pageSize={10}
          onExport={onExport}
        />
      )}
    </div>
  );
};

export default StudentsTable;
