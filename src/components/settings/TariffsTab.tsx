import React, { useEffect, useState } from 'react';
import { Sparkles, Upload, Receipt, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import api from '../../data/api';
import { formatCurrencyDetailed } from '../../utils/formatters';
import type { DormitorySettings, DormitoryPayment, TariffPlan } from './types';

interface TariffsTabProps {
  settings: DormitorySettings;
}

const STATUS_LABEL: Record<DormitoryPayment['status'], string> = {
  PENDING: 'Ko’rib chiqilmoqda',
  APPROVED: 'Tasdiqlandi',
  REJECTED: 'Rad etildi',
};

const STATUS_STYLE: Record<DormitoryPayment['status'], string> = {
  PENDING: 'bg-warning-50 dark:bg-warning-950/40 text-warning-700 dark:text-warning-300 border-warning-200 dark:border-warning-800/60',
  APPROVED: 'bg-success-50 dark:bg-success-950/40 text-success-700 dark:text-success-300 border-success-200 dark:border-success-800/60',
  REJECTED: 'bg-danger-50 dark:bg-danger-950/40 text-danger-700 dark:text-danger-300 border-danger-200 dark:border-danger-800/60',
};

const STATUS_ICON: Record<DormitoryPayment['status'], React.ElementType> = {
  PENDING: Clock,
  APPROVED: CheckCircle2,
  REJECTED: XCircle,
};

const emptyPaymentForm = {
  period: 'month' as 'month' | 'year',
  amount: '',
  comment: '',
  receipt: null as File | null,
};

export default function TariffsTab({ settings }: TariffsTabProps) {
  const [payments, setPayments] = useState<DormitoryPayment[]>([]);
  const [paymentsLoading, setPaymentsLoading] = useState(true);
  const [tariffs, setTariffs] = useState<TariffPlan[]>([]);
  const [paymentForm, setPaymentForm] = useState(emptyPaymentForm);
  const [submitting, setSubmitting] = useState(false);

  const currentTariff = tariffs.find((t) => t.id === settings.tariff) || null;

  const loadPayments = () => {
    setPaymentsLoading(true);
    api
      .getDormitoryPayments()
      .then((data) => {
        const list = Array.isArray(data) ? data : (data as { results?: DormitoryPayment[] })?.results || [];
        setPayments(list as DormitoryPayment[]);
      })
      .catch(() => {
        /* to'lovlar tarixini yuklab bo'lmadi */
      })
      .finally(() => setPaymentsLoading(false));
  };

  useEffect(() => {
    loadPayments();
    api
      .getTariffs()
      .then((data) => {
        const list = Array.isArray(data) ? data : (data as { results?: TariffPlan[] })?.results || [];
        setTariffs(list as TariffPlan[]);
      })
      .catch(() => {
        /* tarif ma'lumotini yuklab bo'lmadi */
      });
  }, []);

  useEffect(() => {
    if (!currentTariff || paymentForm.amount) return;
    setPaymentForm((f) => ({ ...f, amount: String(currentTariff.month_price) }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTariff]);

  const handlePeriodChange = (period: 'month' | 'year') => {
    const suggested = currentTariff ? (period === 'year' ? currentTariff.year_price : currentTariff.month_price) : null;
    setPaymentForm((f) => ({ ...f, period, amount: suggested ? String(suggested) : f.amount }));
  };

  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentForm.receipt) {
      toast.error("To'lov chekini yuklang");
      return;
    }
    if (!paymentForm.amount || Number(paymentForm.amount) <= 0) {
      toast.error("To'lov summasini kiriting");
      return;
    }

    const form = new FormData();
    form.append('dormitory', String(settings.id));
    form.append('period', paymentForm.period);
    form.append('amount', String(Math.round(Number(paymentForm.amount))));
    form.append('receipt', paymentForm.receipt);
    if (paymentForm.comment.trim()) form.append('comment', paymentForm.comment.trim());

    setSubmitting(true);
    try {
      await api.createDormitoryPayment(form);
      toast.success("To'lov yuborildi, superadmin tasdiqlashini kuting");
      setPaymentForm(emptyPaymentForm);
      loadPayments();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "To'lovni yuborishda xatolik yuz berdi");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Joriy tarif */}
      <div className="bg-white dark:bg-surface-900 rounded-xl border border-surface-200 dark:border-surface-800 p-6 shadow-sm">
        <div className="flex items-center gap-3 border-b border-surface-100 dark:border-surface-800 pb-4 mb-5">
          <div className="p-2 rounded-lg bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 border border-brand-200/60 dark:border-brand-800/40">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-surface-900 dark:text-white">Joriy tarif</h3>
            <p className="text-xs text-surface-500 dark:text-surface-400">
              Platformadan foydalanish uchun ulangan obuna rejangiz
            </p>
          </div>
        </div>

        {!currentTariff ? (
          <div className="p-6 rounded-xl border border-dashed border-surface-200 dark:border-surface-700 text-center text-sm text-surface-500">
            Sizga hali tarif biriktirilmagan. Superadmin bilan bog'laning.
          </div>
        ) : (
          <div className="rounded-xl border border-brand-200 dark:border-brand-800/50 bg-brand-50/50 dark:bg-brand-950/20 p-5">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-2.5">
                <span className="text-lg font-bold text-surface-900 dark:text-white">{currentTariff.name}</span>
                {currentTariff.badge && (
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-brand-600 text-white">
                    {currentTariff.badge}
                  </span>
                )}
              </div>
              <span className="text-xs font-medium text-surface-500 dark:text-surface-400">{currentTariff.subtitle}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              <div className="p-3.5 rounded-lg bg-white dark:bg-surface-900 border border-surface-100 dark:border-surface-800">
                <p className="text-[11px] font-bold uppercase tracking-wider text-surface-500 mb-1">Oylik</p>
                <p className="text-lg font-bold text-surface-900 dark:text-white">
                  {formatCurrencyDetailed(currentTariff.month_price)}
                </p>
              </div>
              <div className="p-3.5 rounded-lg bg-white dark:bg-surface-900 border border-surface-100 dark:border-surface-800">
                <p className="text-[11px] font-bold uppercase tracking-wider text-surface-500 mb-1">
                  Yillik <span className="text-success-600 dark:text-success-400">(-{currentTariff.yearly_discount_percent}%)</span>
                </p>
                <p className="text-lg font-bold text-surface-900 dark:text-white">
                  {formatCurrencyDetailed(currentTariff.year_price)}
                </p>
              </div>
            </div>

            {currentTariff.features?.length > 0 && (
              <ul className="space-y-2">
                {currentTariff.features.map((f, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-surface-700 dark:text-surface-300">
                    <CheckCircle2 className="w-4 h-4 text-success-600 dark:text-success-400 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      {/* Obuna to'lovini yuborish */}
      <div className="bg-white dark:bg-surface-900 rounded-xl border border-surface-200 dark:border-surface-800 p-6 shadow-sm">
        <div className="flex items-center gap-3 border-b border-surface-100 dark:border-surface-800 pb-4 mb-5">
          <div className="p-2 rounded-lg bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 border border-brand-200/60 dark:border-brand-800/40">
            <Receipt className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-surface-900 dark:text-white">Obuna to'lovini yuborish</h3>
            <p className="text-xs text-surface-500 dark:text-surface-400">
              To'lov chekini yuklang, superadmin tasdiqlagach faollashadi
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmitPayment} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-surface-600 dark:text-surface-400 mb-1.5">
              Davr
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handlePeriodChange('month')}
                className={`flex-1 py-2.5 rounded-lg text-sm font-semibold border transition-colors ${
                  paymentForm.period === 'month'
                    ? 'bg-brand-600 border-brand-600 text-white'
                    : 'bg-surface-50 dark:bg-surface-800/60 border-surface-200 dark:border-surface-700 text-surface-700 dark:text-surface-300'
                }`}
              >
                Oylik
              </button>
              <button
                type="button"
                onClick={() => handlePeriodChange('year')}
                className={`flex-1 py-2.5 rounded-lg text-sm font-semibold border transition-colors ${
                  paymentForm.period === 'year'
                    ? 'bg-brand-600 border-brand-600 text-white'
                    : 'bg-surface-50 dark:bg-surface-800/60 border-surface-200 dark:border-surface-700 text-surface-700 dark:text-surface-300'
                }`}
              >
                Yillik
              </button>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-surface-600 dark:text-surface-400 mb-1.5">
              Summa (so'm) *
            </label>
            <input
              type="number"
              required
              min={1}
              value={paymentForm.amount}
              onChange={(e) => setPaymentForm((f) => ({ ...f, amount: e.target.value }))}
              placeholder="3500000"
              className="w-full px-3.5 py-2.5 bg-surface-50 dark:bg-surface-800/60 border border-surface-200 dark:border-surface-700 rounded-lg text-surface-900 dark:text-white text-sm focus:ring-1 focus:ring-brand-500 focus:border-brand-500 outline-none transition-colors"
            />
            {currentTariff && (
              <p className="mt-1 text-[11px] text-surface-500 dark:text-surface-400">
                {currentTariff.name} tarifi bo'yicha tavsiya etilgan summa avtomatik to'ldirildi
              </p>
            )}
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-surface-600 dark:text-surface-400 mb-1.5">
              To'lov cheki (rasm) *
            </label>
            <label className="flex items-center gap-2 px-3.5 py-2.5 bg-surface-50 dark:bg-surface-800/60 border border-dashed border-surface-300 dark:border-surface-700 rounded-lg text-sm text-surface-600 dark:text-surface-400 cursor-pointer hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors">
              <Upload className="w-4 h-4 shrink-0" />
              <span className="truncate">{paymentForm.receipt ? paymentForm.receipt.name : 'Chek rasmini tanlang'}</span>
              <input
                type="file"
                accept="image/*"
                required
                className="hidden"
                onChange={(e) => setPaymentForm((f) => ({ ...f, receipt: e.target.files?.[0] || null }))}
              />
            </label>
          </div>

          <div className="sm:col-span-2">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-surface-600 dark:text-surface-400 mb-1.5">
              Izoh (ixtiyoriy)
            </label>
            <textarea
              value={paymentForm.comment}
              onChange={(e) => setPaymentForm((f) => ({ ...f, comment: e.target.value }))}
              rows={2}
              placeholder="Masalan: Avgust oyi uchun to'lov"
              className="w-full px-3.5 py-2.5 bg-surface-50 dark:bg-surface-800/60 border border-surface-200 dark:border-surface-700 rounded-lg text-surface-900 dark:text-white text-sm focus:ring-1 focus:ring-brand-500 focus:border-brand-500 outline-none transition-colors resize-none"
            />
          </div>

          <div className="sm:col-span-2 flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold shadow-sm transition-colors disabled:opacity-50 inline-flex items-center gap-2"
            >
              {submitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Yuborilmoqda...</span>
                </>
              ) : (
                <span>To'lovni yuborish</span>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* To'lovlar tarixi */}
      <div className="bg-white dark:bg-surface-900 rounded-xl border border-surface-200 dark:border-surface-800 p-6 shadow-sm">
        <h3 className="text-base font-bold text-surface-900 dark:text-white mb-4">To'lovlar tarixi</h3>

        {paymentsLoading ? (
          <div className="space-y-2">
            {[1, 2].map((i) => (
              <div key={i} className="h-16 rounded-lg bg-surface-100 dark:bg-surface-800 animate-pulse" />
            ))}
          </div>
        ) : payments.length === 0 ? (
          <div className="p-8 rounded-xl border border-dashed border-surface-200 dark:border-surface-700 text-center text-sm text-surface-500">
            Hali to'lov yuborilmagan.
          </div>
        ) : (
          <div className="space-y-2">
            {payments.map((p) => {
              const StatusIcon = STATUS_ICON[p.status];
              return (
                <div
                  key={p.id}
                  className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-lg bg-surface-50 dark:bg-surface-800/40 border border-surface-100 dark:border-surface-800"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {p.receipt && (
                      <a href={p.receipt} target="_blank" rel="noopener noreferrer">
                        <img
                          src={p.receipt}
                          alt="Chek"
                          className="w-10 h-10 rounded-lg object-cover border border-surface-200 dark:border-surface-700"
                        />
                      </a>
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-surface-900 dark:text-white">
                        {formatCurrencyDetailed(p.amount)}
                        <span className="ml-1.5 text-xs font-medium text-surface-400">
                          ({p.period === 'year' ? 'yillik' : 'oylik'})
                        </span>
                      </p>
                      {p.comment && (
                        <p className="text-xs text-surface-500 dark:text-surface-400 truncate">{p.comment}</p>
                      )}
                      {p.status === 'REJECTED' && p.admin_comment && (
                        <p className="text-xs text-danger-600 dark:text-danger-400 mt-0.5">
                          Sabab: {p.admin_comment}
                        </p>
                      )}
                    </div>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border shrink-0 ${STATUS_STYLE[p.status]}`}
                  >
                    <StatusIcon className="w-3.5 h-3.5" />
                    {STATUS_LABEL[p.status]}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
