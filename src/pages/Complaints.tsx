import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Select, { StylesConfig } from 'react-select';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Inbox,
  Send,
  PlusCircle,
  Search,
  Clock,
  Loader2,
  CheckCircle2,
  XCircle,
  Upload,
  User,
  Users,
} from 'lucide-react';
import api from '../data/api';
import Skeleton from '../components/UI/Skeleton';
import EmptyState from '../components/UI/EmptyState';
import { formatDate } from '../utils/formatters';
import { useSEO } from '../hooks/useSEO';

type ComplaintType = 'complaint' | 'suggestion';
type ComplaintStatus = 'pending' | 'in_progress' | 'resolved' | 'rejected';

interface Complaint {
  id: number;
  type: ComplaintType;
  type_display: string;
  sender_role?: string;
  sender_role_display?: string;
  user_username?: string;
  student_name?: string;
  floor_name?: string;
  category: string;
  category_display: string;
  title: string;
  description: string;
  image?: string | null;
  status: ComplaintStatus;
  status_display: string;
  admin_response?: string | null;
  responded_by_username?: string | null;
  responded_at?: string | null;
  created_at: string;
}

interface ComplaintsResponse {
  count: number;
  results: Complaint[];
}

const TYPE_OPTIONS = [
  { value: '', label: 'Barchasi' },
  { value: 'complaint', label: 'Shikoyat' },
  { value: 'suggestion', label: 'Taklif' },
];

const CATEGORY_OPTIONS = [
  { value: '', label: 'Barcha kategoriya' },
  { value: 'room', label: 'Xona' },
  { value: 'food', label: 'Ovqat' },
  { value: 'staff', label: 'Xodim' },
  { value: 'noise', label: 'Shovqin' },
  { value: 'cleanliness', label: 'Tozalik' },
  { value: 'wifi', label: 'Wi-Fi' },
  { value: 'equipment', label: 'Jihoz' },
  { value: 'security', label: 'Xavfsizlik' },
  { value: 'tariff', label: 'Tarif' },
  { value: 'system', label: 'Tizim' },
  { value: 'other', label: 'Boshqa' },
];

const STATUS_OPTIONS = [
  { value: '', label: 'Barcha holat' },
  { value: 'pending', label: 'Kutilmoqda' },
  { value: 'in_progress', label: 'Ko\'rib chiqilmoqda' },
  { value: 'resolved', label: 'Hal qilindi' },
  { value: 'rejected', label: 'Rad etildi' },
];

const RESPOND_STATUS_OPTIONS = STATUS_OPTIONS.filter((o) => o.value && o.value !== 'pending');

const STATUS_STYLE: Record<ComplaintStatus, string> = {
  pending: 'bg-warning-50 dark:bg-warning-950/40 text-warning-700 dark:text-warning-300 border-warning-200 dark:border-warning-800/60',
  in_progress: 'bg-info-50 dark:bg-info-950/40 text-info-700 dark:text-info-300 border-info-200 dark:border-info-800/60',
  resolved: 'bg-success-50 dark:bg-success-950/40 text-success-700 dark:text-success-300 border-success-200 dark:border-success-800/60',
  rejected: 'bg-danger-50 dark:bg-danger-950/40 text-danger-700 dark:text-danger-300 border-danger-200 dark:border-danger-800/60',
};

const STATUS_ICON: Record<ComplaintStatus, React.ElementType> = {
  pending: Clock,
  in_progress: Loader2,
  resolved: CheckCircle2,
  rejected: XCircle,
};

const isDark = () => document.documentElement.classList.contains('dark');

const selectStyles: StylesConfig<{ value: string; label: string }, false> = {
  control: (base, state) => ({
    ...base,
    backgroundColor: isDark() ? '#1e293b' : '#f8fafc',
    borderColor: state.isFocused ? '#2563eb' : (isDark() ? '#334155' : '#e2e8f0'),
    boxShadow: state.isFocused ? '0 0 0 1px #2563eb' : 'none',
    borderRadius: '0.5rem',
    minHeight: '40px',
    fontSize: '0.875rem',
    cursor: 'pointer',
  }),
  menu: (base) => ({
    ...base,
    backgroundColor: isDark() ? '#1e293b' : '#ffffff',
    borderRadius: '0.75rem',
    overflow: 'hidden',
    border: '1px solid ' + (isDark() ? '#334155' : '#e2e8f0'),
    zIndex: 9999,
  }),
  option: (base, state) => ({
    ...base,
    backgroundColor: state.isSelected ? '#2563eb' : state.isFocused ? (isDark() ? '#334155' : '#eff6ff') : 'transparent',
    color: state.isSelected ? '#ffffff' : isDark() ? '#f1f5f9' : '#1e293b',
    padding: '8px 14px',
    fontSize: '0.875rem',
    cursor: 'pointer',
  }),
  singleValue: (base) => ({ ...base, color: isDark() ? '#f1f5f9' : '#1e293b', fontSize: '0.875rem' }),
  placeholder: (base) => ({ ...base, color: '#94a3b8', fontSize: '0.875rem' }),
};

const TABS = [
  { id: 'received', label: 'Kelgan murojaatlar', icon: Inbox },
  { id: 'sent', label: 'Superadminga yuborilgan', icon: Send },
  { id: 'new', label: 'Yangi murojaat', icon: PlusCircle },
] as const;
type TabId = typeof TABS[number]['id'];

const emptyNewForm = {
  type: 'complaint' as ComplaintType,
  category: '',
  title: '',
  description: '',
  image: null as File | null,
};

const Complaints: React.FC = () => {
  useSEO(undefined, {
    title: "Shikoyat va Takliflar - JoyBor Admin",
    description: "Talabalar va sardorlardan kelgan murojaatlarni ko'rib chiqish, javob berish va superadminga murojaat yuborish",
  });

  const [activeTab, setActiveTab] = useState<TabId>('received');
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [respondingId, setRespondingId] = useState<number | null>(null);
  const [responseText, setResponseText] = useState('');
  const [responseStatus, setResponseStatus] = useState('resolved');
  const [newForm, setNewForm] = useState(emptyNewForm);
  const [submittingNew, setSubmittingNew] = useState(false);

  const queryClient = useQueryClient();

  const filters = {
    search: search || undefined,
    type: typeFilter || undefined,
    category: categoryFilter || undefined,
    status: statusFilter || undefined,
  };

  const { data: receivedData, isLoading: receivedLoading } = useQuery({
    queryKey: ['complaints-received', filters],
    queryFn: () => api.getReceivedComplaints(filters) as Promise<ComplaintsResponse>,
    enabled: activeTab === 'received',
  });

  const { data: sentData, isLoading: sentLoading } = useQuery({
    queryKey: ['complaints-sent', filters],
    queryFn: () => api.getSentComplaints(filters) as Promise<ComplaintsResponse>,
    enabled: activeTab === 'sent',
  });

  const received = receivedData?.results || [];
  const sent = sentData?.results || [];

  const respondMutation = useMutation({
    mutationFn: (vars: { id: number; admin_response: string; status: string }) =>
      api.respondComplaint(vars.id, { admin_response: vars.admin_response, status: vars.status }),
    onSuccess: () => {
      toast.success('Javob yuborildi');
      setRespondingId(null);
      setResponseText('');
      queryClient.invalidateQueries({ queryKey: ['complaints-received'] });
    },
    onError: (err: unknown) => {
      toast.error(err instanceof Error ? err.message : 'Javob yuborishda xatolik yuz berdi');
    },
  });

  const handleSubmitNew = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newForm.category || !newForm.title.trim() || !newForm.description.trim()) {
      toast.error("Barcha majburiy maydonlarni to'ldiring");
      return;
    }
    const form = new FormData();
    form.append('type', newForm.type);
    form.append('category', newForm.category);
    form.append('title', newForm.title.trim());
    form.append('description', newForm.description.trim());
    if (newForm.image) form.append('image', newForm.image);

    setSubmittingNew(true);
    try {
      await api.createComplaintToSuperadmin(form);
      toast.success('Murojaatingiz superadminga yuborildi');
      setNewForm(emptyNewForm);
      queryClient.invalidateQueries({ queryKey: ['complaints-sent'] });
      setActiveTab('sent');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Murojaat yuborishda xatolik yuz berdi');
    } finally {
      setSubmittingNew(false);
    }
  };

  return (
    <div className="space-y-6 w-full">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-surface-900 dark:text-white">
          Shikoyat va Takliflar
        </h1>
        <p className="text-surface-500 dark:text-surface-400 text-xs sm:text-sm mt-0.5">
          Talaba va sardorlardan kelgan murojaatlar, superadminga yuborilgan murojaatlar
        </p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-surface-200 dark:border-surface-800 pb-3">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold border transition-colors ${
                isActive
                  ? 'bg-brand-600 border-brand-600 text-white'
                  : 'bg-white dark:bg-surface-900 border-surface-200 dark:border-surface-800 text-surface-600 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab !== 'new' && (
        <div className="bg-white dark:bg-surface-900 rounded-xl shadow-sm border border-surface-200 dark:border-surface-800 p-4 sm:p-5">
          <div className="flex flex-col lg:flex-row gap-3">
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-surface-400" />
              </div>
              <input
                type="text"
                placeholder="Sarlavha yoki tavsif bo'yicha qidirish..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-lg text-sm text-surface-900 dark:text-white placeholder-surface-400 outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-500 transition-colors"
              />
            </div>
            <div className="lg:w-44">
              <Select
                options={TYPE_OPTIONS}
                value={TYPE_OPTIONS.find((o) => o.value === typeFilter)}
                onChange={(opt) => setTypeFilter(opt?.value || '')}
                styles={selectStyles}
                placeholder="Turi"
              />
            </div>
            <div className="lg:w-48">
              <Select
                options={CATEGORY_OPTIONS}
                value={CATEGORY_OPTIONS.find((o) => o.value === categoryFilter)}
                onChange={(opt) => setCategoryFilter(opt?.value || '')}
                styles={selectStyles}
                placeholder="Kategoriya"
              />
            </div>
            <div className="lg:w-48">
              <Select
                options={STATUS_OPTIONS}
                value={STATUS_OPTIONS.find((o) => o.value === statusFilter)}
                onChange={(opt) => setStatusFilter(opt?.value || '')}
                styles={selectStyles}
                placeholder="Holat"
              />
            </div>
          </div>
        </div>
      )}

      {/* Kelgan murojaatlar */}
      {activeTab === 'received' && (
        <div className="space-y-3">
          {receivedLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-28 w-full" />
              ))}
            </div>
          ) : received.length === 0 ? (
            <div className="bg-white dark:bg-surface-900 rounded-xl border border-surface-200 dark:border-surface-800 shadow-sm">
              <EmptyState icon={Inbox} title="Murojaatlar topilmadi" description="Hozircha talaba yoki sardorlardan murojaat kelmagan" />
            </div>
          ) : (
            received.map((c, i) => {
              const StatusIcon = STATUS_ICON[c.status];
              const isResponding = respondingId === c.id;
              return (
                <motion.div
                  key={c.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.02 }}
                  className="bg-white dark:bg-surface-900 rounded-xl border border-surface-200 dark:border-surface-800 shadow-sm p-5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3 mb-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3 className="text-sm font-bold text-surface-900 dark:text-white">{c.title}</h3>
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-brand-50 dark:bg-brand-950/40 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-800/60">
                          {c.type_display}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-300">
                          {c.category_display}
                        </span>
                      </div>
                      <p className="text-sm text-surface-600 dark:text-surface-400">{c.description}</p>
                    </div>
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border shrink-0 ${STATUS_STYLE[c.status]}`}>
                      <StatusIcon className={`w-3.5 h-3.5 ${c.status === 'in_progress' ? 'animate-spin' : ''}`} />
                      {c.status_display}
                    </span>
                  </div>

                  {c.image && (
                    <a href={c.image} target="_blank" rel="noopener noreferrer" className="inline-block mb-3">
                      <img src={c.image} alt="" className="w-16 h-16 rounded-lg object-cover border border-surface-200 dark:border-surface-700" />
                    </a>
                  )}

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-surface-500 dark:text-surface-400 mb-3">
                    <span className="inline-flex items-center gap-1">
                      {c.sender_role === 'student' ? <User className="w-3.5 h-3.5" /> : <Users className="w-3.5 h-3.5" />}
                      {c.student_name || c.user_username || 'Noma\'lum'}
                      {c.sender_role_display ? ` · ${c.sender_role_display}` : ''}
                    </span>
                    {c.floor_name && <span>{c.floor_name}</span>}
                    <span>{formatDate(c.created_at)}</span>
                  </div>

                  {c.admin_response && (
                    <div className="rounded-lg bg-surface-50 dark:bg-surface-800/40 border border-surface-100 dark:border-surface-800 p-3 text-sm text-surface-700 dark:text-surface-300 mb-2">
                      <span className="font-semibold text-surface-900 dark:text-white">Sizning javobingiz: </span>
                      {c.admin_response}
                    </div>
                  )}

                  {!isResponding ? (
                    <button
                      onClick={() => {
                        setRespondingId(c.id);
                        setResponseText(c.admin_response || '');
                        setResponseStatus(c.status === 'pending' ? 'resolved' : c.status);
                      }}
                      className="text-sm font-semibold text-brand-600 dark:text-brand-400 hover:underline"
                    >
                      {c.admin_response ? 'Javobni tahrirlash' : 'Javob berish'}
                    </button>
                  ) : (
                    <div className="space-y-2.5 pt-2 border-t border-surface-100 dark:border-surface-800">
                      <textarea
                        value={responseText}
                        onChange={(e) => setResponseText(e.target.value)}
                        rows={3}
                        placeholder="Javobingizni yozing..."
                        className="w-full px-3.5 py-2.5 bg-surface-50 dark:bg-surface-800/60 border border-surface-200 dark:border-surface-700 rounded-lg text-surface-900 dark:text-white text-sm outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-500 resize-none"
                      />
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="w-44">
                          <Select
                            options={RESPOND_STATUS_OPTIONS}
                            value={RESPOND_STATUS_OPTIONS.find((o) => o.value === responseStatus)}
                            onChange={(opt) => setResponseStatus(opt?.value || 'resolved')}
                            styles={selectStyles}
                          />
                        </div>
                        <button
                          onClick={() =>
                            respondMutation.mutate({ id: c.id, admin_response: responseText, status: responseStatus })
                          }
                          disabled={!responseText.trim() || respondMutation.isPending}
                          className="px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold transition-colors disabled:opacity-50"
                        >
                          {respondMutation.isPending ? 'Yuborilmoqda...' : 'Javobni yuborish'}
                        </button>
                        <button
                          onClick={() => setRespondingId(null)}
                          className="px-4 py-2 rounded-lg bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-300 text-sm font-semibold hover:bg-surface-200 dark:hover:bg-surface-700 transition-colors"
                        >
                          Bekor qilish
                        </button>
                      </div>
                    </div>
                  )}
                </motion.div>
              );
            })
          )}
        </div>
      )}

      {/* Superadminga yuborilgan */}
      {activeTab === 'sent' && (
        <div className="space-y-3">
          {sentLoading ? (
            <div className="space-y-2">
              {[1, 2].map((i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          ) : sent.length === 0 ? (
            <div className="bg-white dark:bg-surface-900 rounded-xl border border-surface-200 dark:border-surface-800 shadow-sm">
              <EmptyState icon={Send} title="Yuborilgan murojaat yo'q" description="Superadminga hali murojaat yubormagansiz" />
            </div>
          ) : (
            sent.map((c, i) => {
              const StatusIcon = STATUS_ICON[c.status];
              return (
                <motion.div
                  key={c.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.02 }}
                  className="bg-white dark:bg-surface-900 rounded-xl border border-surface-200 dark:border-surface-800 shadow-sm p-5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3 mb-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3 className="text-sm font-bold text-surface-900 dark:text-white">{c.title}</h3>
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-brand-50 dark:bg-brand-950/40 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-800/60">
                          {c.type_display}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-300">
                          {c.category_display}
                        </span>
                      </div>
                      <p className="text-sm text-surface-600 dark:text-surface-400">{c.description}</p>
                    </div>
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border shrink-0 ${STATUS_STYLE[c.status]}`}>
                      <StatusIcon className={`w-3.5 h-3.5 ${c.status === 'in_progress' ? 'animate-spin' : ''}`} />
                      {c.status_display}
                    </span>
                  </div>
                  <p className="text-xs text-surface-400 dark:text-surface-500 mb-2">{formatDate(c.created_at)}</p>
                  {c.admin_response && (
                    <div className="rounded-lg bg-info-50 dark:bg-info-950/20 border border-info-100 dark:border-info-900/40 p-3 text-sm text-surface-700 dark:text-surface-300">
                      <span className="font-semibold text-surface-900 dark:text-white">Superadmin javobi: </span>
                      {c.admin_response}
                    </div>
                  )}
                </motion.div>
              );
            })
          )}
        </div>
      )}

      {/* Yangi murojaat */}
      {activeTab === 'new' && (
        <div className="bg-white dark:bg-surface-900 rounded-xl border border-surface-200 dark:border-surface-800 shadow-sm p-6 max-w-2xl">
          <h3 className="text-base font-bold text-surface-900 dark:text-white mb-1">Superadminga murojaat yuborish</h3>
          <p className="text-xs text-surface-500 dark:text-surface-400 mb-5">
            Platforma yuzasidan shikoyat yoki taklifingizni superadminga yuboring
          </p>

          <form onSubmit={handleSubmitNew} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-surface-600 dark:text-surface-400 mb-1.5">
                  Turi
                </label>
                <div className="flex gap-2">
                  {(['complaint', 'suggestion'] as ComplaintType[]).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setNewForm((f) => ({ ...f, type: t }))}
                      className={`flex-1 py-2.5 rounded-lg text-sm font-semibold border transition-colors ${
                        newForm.type === t
                          ? 'bg-brand-600 border-brand-600 text-white'
                          : 'bg-surface-50 dark:bg-surface-800/60 border-surface-200 dark:border-surface-700 text-surface-700 dark:text-surface-300'
                      }`}
                    >
                      {t === 'complaint' ? 'Shikoyat' : 'Taklif'}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-surface-600 dark:text-surface-400 mb-1.5">
                  Kategoriya *
                </label>
                <Select
                  options={CATEGORY_OPTIONS.filter((o) => o.value)}
                  value={CATEGORY_OPTIONS.find((o) => o.value === newForm.category) || null}
                  onChange={(opt) => setNewForm((f) => ({ ...f, category: opt?.value || '' }))}
                  styles={selectStyles}
                  placeholder="Tanlang"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-surface-600 dark:text-surface-400 mb-1.5">
                Sarlavha *
              </label>
              <input
                type="text"
                required
                value={newForm.title}
                onChange={(e) => setNewForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="Masalan: Tarif narxi bo'yicha taklif"
                className="w-full px-3.5 py-2.5 bg-surface-50 dark:bg-surface-800/60 border border-surface-200 dark:border-surface-700 rounded-lg text-surface-900 dark:text-white text-sm outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-surface-600 dark:text-surface-400 mb-1.5">
                Tavsif *
              </label>
              <textarea
                required
                value={newForm.description}
                onChange={(e) => setNewForm((f) => ({ ...f, description: e.target.value }))}
                rows={4}
                placeholder="Murojaatingizni batafsil yozing"
                className="w-full px-3.5 py-2.5 bg-surface-50 dark:bg-surface-800/60 border border-surface-200 dark:border-surface-700 rounded-lg text-surface-900 dark:text-white text-sm outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-500 resize-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-surface-600 dark:text-surface-400 mb-1.5">
                Rasm (ixtiyoriy)
              </label>
              <label className="flex items-center gap-2 px-3.5 py-2.5 bg-surface-50 dark:bg-surface-800/60 border border-dashed border-surface-300 dark:border-surface-700 rounded-lg text-sm text-surface-600 dark:text-surface-400 cursor-pointer hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors">
                <Upload className="w-4 h-4 shrink-0" />
                <span className="truncate">{newForm.image ? newForm.image.name : 'Rasm tanlang'}</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => setNewForm((f) => ({ ...f, image: e.target.files?.[0] || null }))}
                />
              </label>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={submittingNew}
                className="px-6 py-2.5 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold shadow-sm transition-colors disabled:opacity-50 inline-flex items-center gap-2"
              >
                {submittingNew ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Yuborilmoqda...</span>
                  </>
                ) : (
                  <span>Murojaatni yuborish</span>
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default Complaints;
