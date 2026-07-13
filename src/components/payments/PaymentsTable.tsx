import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { Eye, Edit, CreditCard } from "lucide-react";
import DataTable from "../UI/DataTable";
import EmptyState from "../UI/EmptyState";
import { formatCurrency } from "../../utils/formatters";
import type { Payment } from "./types";

interface PaymentsTableProps {
  payments: Payment[];
  hasActiveFilters: boolean;
  onView: (payment: Payment) => void;
  onEdit: (payment: Payment) => void;
  onExport: () => void;
}

const PaymentsTable: React.FC<PaymentsTableProps> = ({ payments, hasActiveFilters, onView, onEdit, onExport }) => {
  const columns = useMemo(() => [
    {
      key: "student",
      title: "Talaba",
      render: (_: unknown, row: Record<string, unknown>): React.ReactNode => {
        if (row.student_info && typeof row.student_info === "object") {
          const studentInfo = row.student_info as { id: number; name?: string; last_name?: string };
          const fullName = [studentInfo.last_name, studentInfo.name].filter(Boolean).join(" ");
          return (
            <Link to={`/studentprofile/${studentInfo.id}`} className="font-medium text-brand-600 hover:underline dark:text-brand-400 transition-colors duration-150">
              {fullName || "-"}
            </Link>
          );
        }
        if (row.student && typeof row.student === "object") {
          const student = row.student as { id: number; name?: string; last_name?: string };
          const fullName = [student.last_name, student.name].filter(Boolean).join(" ");
          return (
            <Link to={`/studentprofile/${student.id}`} className="font-medium text-brand-600 hover:underline dark:text-brand-400 transition-colors duration-150">
              {fullName || "-"}
            </Link>
          );
        }
        return "-";
      },
      sortable: true,
    },
    {
      key: "amount",
      title: "Miqdor",
      render: (amount: unknown): React.ReactNode => (typeof amount === "number" ? formatCurrency(amount) : "-"),
      sortable: true,
    },
    {
      key: "paid_date",
      title: "To'lov sanasi",
      render: (date: unknown): React.ReactNode =>
        typeof date === "string" && date ? new Date(date).toLocaleDateString("uz-UZ") : "-",
      sortable: true,
    },
    {
      key: "method",
      title: "To'lov turi",
      render: (method: unknown): React.ReactNode => {
        if (typeof method === "string") {
          return method.toLowerCase() === "cash" ? "Naqd" : method.toLowerCase() === "card" ? "Karta orqali" : method;
        }
        return "-";
      },
      sortable: true,
    },
    {
      key: "actions",
      title: "Amallar",
      render: (_: unknown, row: Record<string, unknown>): React.ReactNode => {
        const payment = row as Payment;
        return (
          <div className="flex items-center gap-2">
            <button onClick={() => onView(payment)} className="p-2 text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-900/30 rounded-xl transition-colors duration-150" title="Ko'rish">
              <Eye className="w-4 h-4" />
            </button>
            <button onClick={() => onEdit(payment)} className="p-2 text-warning-600 hover:bg-warning-50 dark:hover:bg-warning-900/30 rounded-xl transition-colors duration-150" title="Tahrirlash">
              <Edit className="w-4 h-4" />
            </button>
          </div>
        );
      },
      sortable: false,
    },
  ], [onView, onEdit]);

  if (payments.length === 0) {
    return (
      <div className="bg-white dark:bg-surface-900 rounded-2xl shadow-sm border border-surface-200 dark:border-surface-800">
        <EmptyState
          icon={CreditCard}
          title="To'lovlar topilmadi"
          description={hasActiveFilters ? "Filterlarga mos to'lov yo'q. Filterlarni o'zgartirib ko'ring." : "Hozircha hech qanday to'lov qo'shilmagan."}
        />
      </div>
    );
  }

  return (
    <DataTable
      data={payments}
      columns={columns}
      searchable
      filterable
      pagination
      pageSize={10}
      onExport={onExport}
    />
  );
};

export default PaymentsTable;
