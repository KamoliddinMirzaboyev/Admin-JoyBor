import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Eye, EyeOff, UserPlus, X } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '../../data/api';

interface Floor {
  id: number;
  name: string;
}

interface Room {
  id: number;
  name: string;
  floor?: number;
  capacity?: number;
  current_occupancy?: number;
}

interface Province {
  id: number;
  name: string;
}

interface District {
  id: number;
  name: string;
  province?: number;
}

export interface CreateStudentForm {
  // user_info
  username: string;
  password: string;
  email: string;
  user_phone: string;
  // student
  name: string;
  last_name: string;
  middle_name: string;
  phone: string;
  gender: string;
  passport: string;
  jshshir: string;
  faculty: string;
  direction: string;
  group: string;
  course: string;
  privilege: boolean;
  privilege_share: string;
  status: string;
  placement_status: string;
  is_active: boolean;
  province: string;
  district: string;
  floor: string;
  room: string;
}

const emptyForm: CreateStudentForm = {
  username: '',
  password: '',
  email: '',
  user_phone: '',
  name: '',
  last_name: '',
  middle_name: '',
  phone: '',
  gender: 'Erkak',
  passport: '',
  jshshir: '',
  faculty: '',
  direction: '',
  group: '',
  course: '1-kurs',
  privilege: false,
  privilege_share: '',
  status: 'Tasdiqlandi',
  placement_status: 'Qabul qilindi',
  is_active: true,
  province: '',
  district: '',
  floor: '',
  room: '',
};

const COURSE_OPTIONS = ['1-kurs', '2-kurs', '3-kurs', '4-kurs', '5-kurs', '6-kurs'];
const GENDER_OPTIONS = [
  { value: 'Erkak', label: 'Erkak' },
  { value: 'Ayol', label: 'Ayol' },
];
const STATUS_OPTIONS = ['Tekshirilmaydi', 'Tekshirilmoqda', 'Tasdiqlandi', 'Rad etildi'];
const PLACEMENT_OPTIONS = ['Qabul qilindi', 'Joylashdi'];

const PHONE_RE = /^\+?\d{7,15}$/;
const PASSPORT_RE = /^[A-Z]{2}\d{7}$/i;
const JSHSHIR_RE = /^\d{14}$/;

function unwrapList<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[];
  if (data && typeof data === 'object' && Array.isArray((data as { results?: T[] }).results)) {
    return (data as { results: T[] }).results;
  }
  return [];
}

function formatApiError(error: unknown): string {
  const err = error as Error & { response?: { data?: unknown } };
  const data = err.response?.data;
  if (data && typeof data === 'object') {
    const parts: string[] = [];
    const walk = (obj: Record<string, unknown>, prefix = '') => {
      for (const [key, value] of Object.entries(obj)) {
        const path = prefix ? `${prefix}.${key}` : key;
        if (Array.isArray(value)) {
          parts.push(`${path}: ${value.join(', ')}`);
        } else if (value && typeof value === 'object') {
          walk(value as Record<string, unknown>, path);
        } else if (typeof value === 'string') {
          parts.push(key === 'detail' || key === 'message' ? value : `${path}: ${value}`);
        }
      }
    };
    walk(data as Record<string, unknown>);
    if (parts.length) return parts.join(' · ');
  }
  return err instanceof Error ? err.message : 'Xatolik yuz berdi';
}

interface CreateStudentModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const inputCls =
  'w-full px-3.5 py-2.5 border border-surface-200 dark:border-surface-700 rounded-xl bg-white dark:bg-surface-950 text-surface-900 dark:text-white text-sm focus:ring-2 focus:ring-brand-500/40 outline-none transition-colors duration-150';
const labelCls =
  'block text-xs font-bold text-surface-500 dark:text-surface-400 uppercase tracking-wider mb-1.5 ml-0.5';

const CreateStudentModal: React.FC<CreateStudentModalProps> = ({ open, onClose, onSuccess }) => {
  const [form, setForm] = useState<CreateStudentForm>(emptyForm);
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const [floors, setFloors] = useState<Floor[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);

  useEffect(() => {
    if (!open) return;
    setForm(emptyForm);
    setFieldErrors({});
    setShowPassword(false);

    (async () => {
      try {
        const [floorsRes, provincesRes] = await Promise.all([
          api.getFloors(),
          api.getProvinces().catch(() => []),
        ]);
        setFloors(unwrapList<Floor>(floorsRes));
        setProvinces(unwrapList<Province>(provincesRes));
      } catch {
        setFloors([]);
        setProvinces([]);
      }
    })();
  }, [open]);

  useEffect(() => {
    if (!open || !form.floor) {
      setRooms([]);
      return;
    }
    (async () => {
      try {
        const res = await api.getRooms(form.floor);
        setRooms(unwrapList<Room>(res));
      } catch {
        setRooms([]);
      }
    })();
  }, [open, form.floor]);

  useEffect(() => {
    if (!open || !form.province) {
      setDistricts([]);
      return;
    }
    (async () => {
      try {
        const res = await api.getDistricts(form.province);
        setDistricts(unwrapList<District>(res));
      } catch {
        setDistricts([]);
      }
    })();
  }, [open, form.province]);

  const set = (key: keyof CreateStudentForm, value: string | boolean) => {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      if (key === 'floor') next.room = '';
      if (key === 'province') next.district = '';
      // username bo'sh bo'lsa passport/phone dan taklif
      if (key === 'passport' && typeof value === 'string' && !prev.username) {
        next.username = value.replace(/\s/g, '').toUpperCase();
      }
      if ((key === 'name' || key === 'last_name') && typeof value === 'string') {
        // first/last name sync optional via submit
      }
      return next;
    });
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'Ism majburiy';
    if (!form.username.trim()) e.username = 'Username majburiy';
    if (!form.password || form.password.length < 6) e.password = 'Parol kamida 6 belgi';
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Email noto‘g‘ri';
    if (form.phone && !PHONE_RE.test(form.phone.replace(/\s/g, ''))) e.phone = 'Telefon formati: +998...';
    if (form.user_phone && !PHONE_RE.test(form.user_phone.replace(/\s/g, ''))) {
      e.user_phone = 'Telefon formati: +998...';
    }
    if (form.passport && !PASSPORT_RE.test(form.passport.replace(/\s/g, ''))) {
      e.passport = 'Passport: AA1234567';
    }
    if (form.jshshir && !JSHSHIR_RE.test(form.jshshir)) e.jshshir = 'JSHSHIR: 14 raqam';
    setFieldErrors(e);
    return Object.keys(e).length === 0;
  };

  const floorOptions = useMemo(
    () => floors.map((f) => ({ value: String(f.id), label: f.name })),
    [floors]
  );
  const roomOptions = useMemo(
    () => rooms.map((r) => ({ value: String(r.id), label: r.name })),
    [rooms]
  );

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) {
      toast.error('Majburiy maydonlarni to‘ldiring');
      return;
    }

    setSaving(true);
    try {
      const phone = form.phone.replace(/\s/g, '') || form.user_phone.replace(/\s/g, '');
      const payload: Record<string, unknown> = {
        user_info: {
          username: form.username.trim(),
          password: form.password,
          role: 'student',
          first_name: form.name.trim(),
          last_name: form.last_name.trim() || undefined,
          email: form.email.trim() || null,
          phone: (form.user_phone || phone || '').replace(/\s/g, '') || null,
        },
        name: form.name.trim(),
        last_name: form.last_name.trim() || undefined,
        middle_name: form.middle_name.trim() || undefined,
        faculty: form.faculty.trim() || undefined,
        direction: form.direction.trim() || undefined,
        passport: form.passport.replace(/\s/g, '').toUpperCase() || undefined,
        jshshir: form.jshshir.trim() || undefined,
        group: form.group.trim() || undefined,
        course: form.course || undefined,
        gender: form.gender || undefined,
        phone: phone || undefined,
        privilege: form.privilege,
        privilege_share: form.privilege_share
          ? Number(form.privilege_share)
          : undefined,
        status: form.status || undefined,
        placement_status: form.placement_status || undefined,
        is_active: form.is_active,
      };

      if (form.province) payload.province = Number(form.province);
      if (form.district) payload.district = Number(form.district);
      if (form.floor) payload.floor = Number(form.floor);
      if (form.room) payload.room = Number(form.room);

      // null/undefined tozalash
      const clean = (obj: Record<string, unknown>): Record<string, unknown> => {
        const out: Record<string, unknown> = {};
        for (const [k, v] of Object.entries(obj)) {
          if (v === undefined || v === '') continue;
          if (v && typeof v === 'object' && !Array.isArray(v)) {
            out[k] = clean(v as Record<string, unknown>);
          } else {
            out[k] = v;
          }
        }
        return out;
      };

      await api.createStudent(clean(payload));
      toast.success('Talaba muvaffaqiyatli qo‘shildi');
      window.dispatchEvent(new CustomEvent('student-updated', { detail: { action: 'created' } }));
      onSuccess();
      onClose();
    } catch (error) {
      toast.error(formatApiError(error));
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-surface-900/60 dark:bg-surface-950/80 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            className="relative w-full max-w-3xl max-h-[min(92dvh,92vh)] flex flex-col bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 shadow-sm overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3 p-5 sm:p-6 border-b border-surface-200 dark:border-surface-800 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-surface-900 dark:text-white">
                    Yangi talaba qo&apos;shish
                  </h3>
                  <p className="text-xs text-surface-500 dark:text-surface-400">
                    POST /students/create/ — hisob + profil
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl hover:bg-surface-100 dark:hover:bg-surface-800 text-surface-400 hover:text-danger-500 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
              <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
                {/* Hisob */}
                <section>
                  <h4 className="text-sm font-bold text-surface-900 dark:text-white mb-3">
                    Login hisobi
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className={labelCls}>Username *</label>
                      <input
                        className={inputCls}
                        value={form.username}
                        onChange={(e) => set('username', e.target.value)}
                        placeholder="login"
                        autoComplete="off"
                      />
                      {fieldErrors.username && (
                        <p className="text-xs text-danger-600 mt-1">{fieldErrors.username}</p>
                      )}
                    </div>
                    <div>
                      <label className={labelCls}>Parol *</label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          className={`${inputCls} pr-10`}
                          value={form.password}
                          onChange={(e) => set('password', e.target.value)}
                          placeholder="kamida 6 belgi"
                          autoComplete="new-password"
                        />
                        <button
                          type="button"
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400"
                          onClick={() => setShowPassword((v) => !v)}
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      {fieldErrors.password && (
                        <p className="text-xs text-danger-600 mt-1">{fieldErrors.password}</p>
                      )}
                    </div>
                    <div>
                      <label className={labelCls}>Email</label>
                      <input
                        type="email"
                        className={inputCls}
                        value={form.email}
                        onChange={(e) => set('email', e.target.value)}
                        placeholder="email@example.com"
                      />
                      {fieldErrors.email && (
                        <p className="text-xs text-danger-600 mt-1">{fieldErrors.email}</p>
                      )}
                    </div>
                    <div>
                      <label className={labelCls}>Hisob telefoni</label>
                      <input
                        className={inputCls}
                        value={form.user_phone}
                        onChange={(e) => set('user_phone', e.target.value)}
                        placeholder="+998901234567"
                      />
                      {fieldErrors.user_phone && (
                        <p className="text-xs text-danger-600 mt-1">{fieldErrors.user_phone}</p>
                      )}
                    </div>
                  </div>
                </section>

                {/* Shaxsiy */}
                <section>
                  <h4 className="text-sm font-bold text-surface-900 dark:text-white mb-3">
                    Shaxsiy ma&apos;lumotlar
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className={labelCls}>Ism *</label>
                      <input
                        className={inputCls}
                        value={form.name}
                        onChange={(e) => set('name', e.target.value)}
                        placeholder="Ism"
                      />
                      {fieldErrors.name && (
                        <p className="text-xs text-danger-600 mt-1">{fieldErrors.name}</p>
                      )}
                    </div>
                    <div>
                      <label className={labelCls}>Familiya</label>
                      <input
                        className={inputCls}
                        value={form.last_name}
                        onChange={(e) => set('last_name', e.target.value)}
                        placeholder="Familiya"
                      />
                    </div>
                    <div>
                      <label className={labelCls}>Otasining ismi</label>
                      <input
                        className={inputCls}
                        value={form.middle_name}
                        onChange={(e) => set('middle_name', e.target.value)}
                        placeholder="Otasining ismi"
                      />
                    </div>
                    <div>
                      <label className={labelCls}>Jins</label>
                      <select
                        className={inputCls}
                        value={form.gender}
                        onChange={(e) => set('gender', e.target.value)}
                      >
                        {GENDER_OPTIONS.map((o) => (
                          <option key={o.value} value={o.value}>
                            {o.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className={labelCls}>Telefon</label>
                      <input
                        className={inputCls}
                        value={form.phone}
                        onChange={(e) => set('phone', e.target.value)}
                        placeholder="+998901234567"
                      />
                      {fieldErrors.phone && (
                        <p className="text-xs text-danger-600 mt-1">{fieldErrors.phone}</p>
                      )}
                    </div>
                    <div>
                      <label className={labelCls}>Passport</label>
                      <input
                        className={inputCls}
                        value={form.passport}
                        onChange={(e) => set('passport', e.target.value.toUpperCase())}
                        placeholder="AA1234567"
                        maxLength={9}
                      />
                      {fieldErrors.passport && (
                        <p className="text-xs text-danger-600 mt-1">{fieldErrors.passport}</p>
                      )}
                    </div>
                    <div className="sm:col-span-2">
                      <label className={labelCls}>JSHSHIR</label>
                      <input
                        className={inputCls}
                        value={form.jshshir}
                        onChange={(e) => set('jshshir', e.target.value.replace(/\D/g, '').slice(0, 14))}
                        placeholder="14 raqam"
                        maxLength={14}
                      />
                      {fieldErrors.jshshir && (
                        <p className="text-xs text-danger-600 mt-1">{fieldErrors.jshshir}</p>
                      )}
                    </div>
                  </div>
                </section>

                {/* O'qish */}
                <section>
                  <h4 className="text-sm font-bold text-surface-900 dark:text-white mb-3">
                    O&apos;qish ma&apos;lumotlari
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className={labelCls}>Fakultet</label>
                      <input
                        className={inputCls}
                        value={form.faculty}
                        onChange={(e) => set('faculty', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className={labelCls}>Yo&apos;nalish</label>
                      <input
                        className={inputCls}
                        value={form.direction}
                        onChange={(e) => set('direction', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className={labelCls}>Guruh</label>
                      <input
                        className={inputCls}
                        value={form.group}
                        onChange={(e) => set('group', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className={labelCls}>Kurs</label>
                      <select
                        className={inputCls}
                        value={form.course}
                        onChange={(e) => set('course', e.target.value)}
                      >
                        {COURSE_OPTIONS.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </section>

                {/* Joylashuv */}
                <section>
                  <h4 className="text-sm font-bold text-surface-900 dark:text-white mb-3">
                    Joylashuv (ixtiyoriy)
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className={labelCls}>Viloyat</label>
                      <select
                        className={inputCls}
                        value={form.province}
                        onChange={(e) => set('province', e.target.value)}
                      >
                        <option value="">Tanlang</option>
                        {provinces.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className={labelCls}>Tuman</label>
                      <select
                        className={inputCls}
                        value={form.district}
                        onChange={(e) => set('district', e.target.value)}
                        disabled={!form.province}
                      >
                        <option value="">Tanlang</option>
                        {districts.map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className={labelCls}>Qavat</label>
                      <select
                        className={inputCls}
                        value={form.floor}
                        onChange={(e) => set('floor', e.target.value)}
                      >
                        <option value="">Tanlang</option>
                        {floorOptions.map((f) => (
                          <option key={f.value} value={f.value}>
                            {f.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className={labelCls}>Xona</label>
                      <select
                        className={inputCls}
                        value={form.room}
                        onChange={(e) => set('room', e.target.value)}
                        disabled={!form.floor}
                      >
                        <option value="">Tanlang</option>
                        {roomOptions.map((r) => (
                          <option key={r.value} value={r.value}>
                            {r.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </section>

                {/* Status */}
                <section>
                  <h4 className="text-sm font-bold text-surface-900 dark:text-white mb-3">Status</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className={labelCls}>Status</label>
                      <select
                        className={inputCls}
                        value={form.status}
                        onChange={(e) => set('status', e.target.value)}
                      >
                        {STATUS_OPTIONS.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className={labelCls}>Joylashuv holati</label>
                      <select
                        className={inputCls}
                        value={form.placement_status}
                        onChange={(e) => set('placement_status', e.target.value)}
                      >
                        {PLACEMENT_OPTIONS.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex items-center gap-2 pt-6">
                      <input
                        id="privilege"
                        type="checkbox"
                        checked={form.privilege}
                        onChange={(e) => set('privilege', e.target.checked)}
                        className="w-4 h-4 rounded border-surface-300 text-brand-600 focus:ring-brand-500/40"
                      />
                      <label htmlFor="privilege" className="text-sm text-surface-700 dark:text-surface-300">
                        Imtiyozli
                      </label>
                    </div>
                    <div className="flex items-center gap-2 pt-6">
                      <input
                        id="is_active"
                        type="checkbox"
                        checked={form.is_active}
                        onChange={(e) => set('is_active', e.target.checked)}
                        className="w-4 h-4 rounded border-surface-300 text-brand-600 focus:ring-brand-500/40"
                      />
                      <label htmlFor="is_active" className="text-sm text-surface-700 dark:text-surface-300">
                        Faol
                      </label>
                    </div>
                    {form.privilege && (
                      <div>
                        <label className={labelCls}>Imtiyoz ulushi (%)</label>
                        <input
                          type="number"
                          min={0}
                          max={100}
                          className={inputCls}
                          value={form.privilege_share}
                          onChange={(e) => set('privilege_share', e.target.value)}
                        />
                      </div>
                    )}
                  </div>
                </section>
              </div>

              <div className="flex gap-3 p-4 sm:p-5 border-t border-surface-200 dark:border-surface-800 shrink-0 bg-white dark:bg-surface-900">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-surface-200 dark:border-surface-700 text-surface-700 dark:text-surface-300 text-sm font-semibold hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold disabled:opacity-50 transition-colors focus:ring-2 focus:ring-brand-500/40"
                >
                  {saving ? 'Saqlanmoqda...' : 'Saqlash'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default CreateStudentModal;
