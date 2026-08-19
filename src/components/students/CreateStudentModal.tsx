import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  UserPlus,
  X,
  ImagePlus,
  FileUp,
  Phone,
  GraduationCap,
  MapPin,
  BadgeCheck,
  User,
  Trash2,
  FileText,
  Hash,
} from 'lucide-react';
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

interface Dormitory {
  id: number;
  name?: string;
}

export interface CreateStudentForm {
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
  dormitory: string;
  floor: string;
  room: string;
}

export type StudentFileKey =
  | 'picture'
  | 'passport_image_first'
  | 'passport_image_second'
  | 'document';

/**
 * Telefon raqamini +998 (XX) XXX-XX-XX formatiga o'tkazish
 */
function formatUzbekPhone(input: string): string {
  let digits = input.replace(/\D/g, '');
  if (!digits) return '+998 ';
  if (digits.startsWith('998')) {
    digits = digits.slice(3);
  }
  digits = digits.slice(0, 9);

  let res = '+998';
  if (digits.length > 0) {
    res += ' (' + digits.slice(0, 2);
  }
  if (digits.length >= 2) {
    res += ') ' + digits.slice(2, 5);
  }
  if (digits.length >= 5) {
    res += '-' + digits.slice(5, 7);
  }
  if (digits.length >= 7) {
    res += '-' + digits.slice(7, 9);
  }
  return res;
}

/**
 * Backend API uchun toza telefon formati (+998901234567)
 */
function cleanPhoneForApi(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('998')) {
    return `+${digits}`;
  }
  return `+998${digits}`;
}

/**
 * Passport formatini tozalash (masalan: AA 1234567 -> AA1234567)
 */
function formatPassportDisplay(input: string): string {
  const clean = input.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 9);
  const letters = clean.slice(0, 2).replace(/[^A-Z]/g, '');
  const numbers = clean.slice(2).replace(/[^0-9]/g, '').slice(0, 7);
  if (!letters) return '';
  if (!numbers) return letters;
  return `${letters} ${numbers}`;
}

const emptyForm: CreateStudentForm = {
  name: '',
  last_name: '',
  middle_name: '',
  phone: '+998 ',
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
  is_active: false,
  province: '',
  district: '',
  dormitory: '',
  floor: '',
  room: '',
};

const emptyFiles: Record<StudentFileKey, File | null> = {
  picture: null,
  passport_image_first: null,
  passport_image_second: null,
  document: null,
};

// Backend faqat shu qiymatlarni qabul qiladi (API kontrakt, /admin/students/ POST)
const COURSE_OPTIONS = ['1-kurs', '2-kurs', '3-kurs', '4-kurs', '5-kurs'];

const GENDER_OPTIONS = ['Erkak', 'Ayol'];
const STATUS_OPTIONS = ['Tasdiqlandi', 'Tekshirilmoqda', 'Tekshirilmaydi', 'Rad etildi'];
const PLACEMENT_OPTIONS = ['Qabul qilindi', 'Joylashdi'];

const PHONE_RE = /^\+998\d{9}$/;
const PASSPORT_RE = /^[A-Z]{2}\d{7}$/;
const JSHSHIR_RE = /^\d{14}$/;
const MAX_FILE_MB = 5;
const ACCEPTED = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];

const UPLOAD_FIELDS: { key: StudentFileKey; label: string; hint: string }[] = [
  { key: 'picture', label: 'Talaba rasmi', hint: 'JPG, PNG yoki PDF — 5MB gacha' },
  { key: 'passport_image_first', label: 'Passport (oldi)', hint: 'Passport old tomoni' },
  { key: 'passport_image_second', label: 'Passport (orqasi)', hint: 'Passport orqa tomoni' },
  { key: 'document', label: "Qo'shimcha hujjat", hint: 'Imtiyoz yoki boshqa hujjat (ixtiyoriy)' },
];

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

// Enterprise clean style (reduced radius)
const inputCls =
  'w-full px-3 py-2 border border-surface-200 dark:border-surface-700 rounded-lg bg-white dark:bg-surface-950 text-surface-900 dark:text-white text-sm focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 outline-none transition-colors duration-150 placeholder:text-surface-400';
const labelCls =
  'block text-[11px] font-bold text-surface-600 dark:text-surface-400 uppercase tracking-wider mb-1';

function SectionTitle({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <h4 className="flex items-center gap-2 text-sm font-bold text-surface-900 dark:text-white mb-2.5">
      <span className="p-1 rounded-md bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400">
        {icon}
      </span>
      {title}
    </h4>
  );
}

function UploadCard({
  label,
  hint,
  file,
  onChange,
}: {
  label: string;
  hint: string;
  file: File | null;
  onChange: (f: File | null) => void;
}) {
  const [preview, setPreview] = useState<string | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!file) {
      setPreview(null);
      return;
    }
    if (file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      setPreview(url);
      return () => URL.revokeObjectURL(url);
    }
    setPreview(null);
  }, [file]);

  return (
    <div className="rounded-lg border border-dashed border-surface-300 dark:border-surface-700 bg-surface-50/50 dark:bg-surface-950/40 p-2.5 transition-colors hover:border-brand-400 dark:hover:border-brand-500/60">
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,application/pdf"
        className="hidden"
        onChange={(e) => onChange(e.target.files?.[0] || null)}
      />
      <div className="flex items-center gap-2.5">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="relative w-14 h-14 shrink-0 rounded-md overflow-hidden bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 flex items-center justify-center text-surface-400 hover:text-brand-600 transition-colors"
        >
          {preview ? (
            <img src={preview} alt={label} className="w-full h-full object-cover" />
          ) : file?.type === 'application/pdf' ? (
            <FileUp className="w-5 h-5" />
          ) : (
            <ImagePlus className="w-5 h-5" />
          )}
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-surface-800 dark:text-surface-200 truncate">{label}</p>
          <p className="text-[11px] text-surface-400">{hint}</p>
          {file && <p className="text-[11px] text-brand-600 dark:text-brand-400 truncate mt-0.5">{file.name}</p>}
        </div>
        {file ? (
          <button
            type="button"
            onClick={() => {
              onChange(null);
              if (inputRef.current) inputRef.current.value = '';
            }}
            className="p-1.5 rounded-md text-danger-500 hover:bg-danger-50 dark:hover:bg-danger-900/20 transition-colors"
            title="O'chirish"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="px-2.5 py-1 rounded-md bg-brand-600 text-white text-xs font-semibold hover:bg-brand-700 transition-colors"
          >
            Yuklash
          </button>
        )}
      </div>
    </div>
  );
}

interface CreateStudentModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const CreateStudentModal: React.FC<CreateStudentModalProps> = ({ open, onClose, onSuccess }) => {
  const [form, setForm] = useState<CreateStudentForm>(emptyForm);
  const [files, setFiles] = useState<Record<StudentFileKey, File | null>>(emptyFiles);
  const [saving, setSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const [floors, setFloors] = useState<Floor[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [dormitory, setDormitory] = useState<Dormitory | null>(null);

  useEffect(() => {
    if (!open) return;
    setForm(emptyForm);
    setFiles(emptyFiles);
    setFieldErrors({});

    (async () => {
      try {
        const [floorsRes, provincesRes, dormRes] = await Promise.all([
          api.getFloors().catch(() => []),
          api.getProvinces().catch(() => []),
          api.getMyDormitory().catch(() => null),
        ]);
        setFloors(unwrapList<Floor>(floorsRes));
        setProvinces(unwrapList<Province>(provincesRes));
        if (dormRes && typeof dormRes === 'object' && 'id' in dormRes) {
          const d = dormRes as Dormitory;
          setDormitory(d);
          setForm((prev) => ({ ...prev, dormitory: String(d.id) }));
        }
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
      if (key === 'room') {
        if (value) {
          next.is_active = true;
          next.placement_status = 'Joylashdi';
        }
      }
      return next;
    });
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const handlePhoneChange = (val: string) => {
    const formatted = formatUzbekPhone(val);
    set('phone', formatted);
  };

  const handlePassportChange = (val: string) => {
    const formatted = formatPassportDisplay(val);
    set('passport', formatted);
  };

  const handleFile = (key: StudentFileKey, file: File | null) => {
    if (file) {
      if (file.size > MAX_FILE_MB * 1024 * 1024) {
        const label = UPLOAD_FIELDS.find((u) => u.key === key)?.label || 'Fayl';
        toast.error(`${label} 5MB dan oshmasligi kerak`);
        return;
      }
      if (!ACCEPTED.includes(file.type)) {
        toast.error('Faqat JPG, PNG yoki PDF fayllar qabul qilinadi');
        return;
      }
    }
    setFiles((prev) => ({ ...prev, [key]: file }));
  };

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'Ism majburiy';
    if (!form.province) e.province = 'Viloyat tanlanishi majburiy';
    if (!form.district) e.district = 'Tuman tanlanishi majburiy';

    const cleanPhone = cleanPhoneForApi(form.phone);
    if (cleanPhone && cleanPhone !== '+998') {
      if (!PHONE_RE.test(cleanPhone)) {
        e.phone = "To'liq 9 ta raqam kiritilishi kerak (masalan: +998 (90) 123-45-67)";
      }
    }

    if (form.passport.trim()) {
      const cleanPass = form.passport.replace(/\s/g, '');
      if (!PASSPORT_RE.test(cleanPass)) {
        e.passport = 'Passport: 2 ta lotin harfi va 7 ta raqam (masalan: AA 1234567)';
      }
    }

    if (form.jshshir.trim()) {
      const cleanJsh = form.jshshir.replace(/\D/g, '');
      if (!JSHSHIR_RE.test(cleanJsh)) {
        e.jshshir = 'JSHSHIR aniq 14 ta raqamdan iborat bo\'lishi kerak';
      }
    }

    setFieldErrors(e);
    return Object.keys(e).length === 0;
  };

  const floorOptions = useMemo(() => floors.map((f) => ({ value: String(f.id), label: f.name })), [floors]);
  const roomOptions = useMemo(() => rooms.map((r) => ({ value: String(r.id), label: r.name })), [rooms]);

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) {
      toast.error("Majburiy maydonlarni to'g'ri to'ldiring");
      return;
    }

    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('name', form.name.trim());
      if (form.last_name.trim()) fd.append('last_name', form.last_name.trim());
      if (form.middle_name.trim()) fd.append('middle_name', form.middle_name.trim());

      const cleanPhone = cleanPhoneForApi(form.phone);
      if (cleanPhone && cleanPhone !== '+998') {
        fd.append('phone', cleanPhone);
      }

      if (form.gender) fd.append('gender', form.gender);

      if (form.passport.trim()) {
        fd.append('passport', form.passport.replace(/\s/g, ''));
      }
      if (form.jshshir.trim()) {
        fd.append('jshshir', form.jshshir.replace(/\D/g, ''));
      }

      if (form.faculty.trim()) fd.append('faculty', form.faculty.trim());
      if (form.direction.trim()) fd.append('direction', form.direction.trim());
      if (form.group.trim()) fd.append('group', form.group.trim());
      if (form.course) fd.append('course', form.course);
      if (form.status) fd.append('status', form.status);
      if (form.placement_status) fd.append('placement_status', form.placement_status);

      fd.append('privilege', String(form.privilege));
      if (form.privilege && form.privilege_share) {
        fd.append('privilege_share', String(Number(form.privilege_share) || 0));
      }
      fd.append('is_active', String(form.is_active));

      if (form.province) fd.append('province', String(Number(form.province)));
      if (form.district) fd.append('district', String(Number(form.district)));
      if (form.dormitory || dormitory?.id) {
        fd.append('dormitory', String(form.dormitory || dormitory?.id));
      }
      if (form.floor) fd.append('floor', String(Number(form.floor)));
      if (form.room) fd.append('room', String(Number(form.room)));

      if (files.picture) {
        fd.append('picture', files.picture);
      }
      if (files.passport_image_first) {
        fd.append('passport_image_first', files.passport_image_first);
      }
      if (files.passport_image_second) {
        fd.append('passport_image_second', files.passport_image_second);
      }
      if (files.document) {
        fd.append('document', files.document);
      }

      await api.createStudent(fd);
      toast.success("Talaba muvaffaqiyatli qo'shildi!");
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
            initial={{ opacity: 0, scale: 0.98, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 8 }}
            className="relative w-full max-w-4xl max-h-[min(92dvh,92vh)] flex flex-col bg-white dark:bg-surface-900 rounded-xl border border-surface-200 dark:border-surface-800 shadow-xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-surface-200 dark:border-surface-800 shrink-0 bg-surface-50/70 dark:bg-surface-900">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-brand-600 text-white shadow-sm">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-surface-900 dark:text-white">
                    Yangi talaba qo'shish
                  </h3>
                  <p className="text-xs text-surface-500 dark:text-surface-400">
                    Talaba ma'lumotlarini kiriting va saqlang
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-surface-200/60 dark:hover:bg-surface-800 text-surface-400 hover:text-surface-700 dark:hover:text-surface-200 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form Body */}
            <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
              <div className="flex-1 overflow-y-auto p-5 space-y-5">
                
                {/* 1. Shaxsiy ma'lumotlar */}
                <section>
                  <SectionTitle icon={<User className="w-3.5 h-3.5" />} title="Shaxsiy ma'lumotlar" />
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className={labelCls}>Ism *</label>
                      <input
                        className={`${inputCls} ${fieldErrors.name ? 'border-danger-500 focus:ring-danger-500/30' : ''}`}
                        value={form.name}
                        onChange={(e) => set('name', e.target.value)}
                        placeholder="Ali"
                        maxLength={120}
                      />
                      {fieldErrors.name && <p className="text-[11px] text-danger-600 mt-1">{fieldErrors.name}</p>}
                    </div>
                    <div>
                      <label className={labelCls}>Familiya</label>
                      <input
                        className={inputCls}
                        value={form.last_name}
                        onChange={(e) => set('last_name', e.target.value)}
                        placeholder="Karimov"
                        maxLength={120}
                      />
                    </div>
                    <div>
                      <label className={labelCls}>Otasining ismi</label>
                      <input
                        className={inputCls}
                        value={form.middle_name}
                        onChange={(e) => set('middle_name', e.target.value)}
                        placeholder="Valiyevich"
                        maxLength={120}
                      />
                    </div>
                    <div>
                      <label className={labelCls}>Jins</label>
                      <select className={inputCls} value={form.gender} onChange={(e) => set('gender', e.target.value)}>
                        {GENDER_OPTIONS.map((o) => (
                          <option key={o} value={o}>{o}</option>
                        ))}
                      </select>
                    </div>
                    <div className="sm:col-span-2">
                      <label className={labelCls}>Telefon raqam</label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                        <input
                          className={`${inputCls} pl-9 font-medium tracking-wide ${fieldErrors.phone ? 'border-danger-500 focus:ring-danger-500/30' : ''}`}
                          value={form.phone}
                          onChange={(e) => handlePhoneChange(e.target.value)}
                          onFocus={() => {
                            if (!form.phone || form.phone.trim() === '') {
                              set('phone', '+998 ');
                            }
                          }}
                          placeholder="+998 (90) 123-45-67"
                          maxLength={19}
                        />
                      </div>
                      {fieldErrors.phone && <p className="text-[11px] text-danger-600 mt-1">{fieldErrors.phone}</p>}
                    </div>
                  </div>
                </section>

                {/* 2. Hujjat ma'lumotlari */}
                <section>
                  <SectionTitle icon={<FileText className="w-3.5 h-3.5" />} title="Hujjat raqamlari" />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className={labelCls}>Passport seriya va raqam</label>
                      <input
                        className={`${inputCls} font-mono uppercase tracking-wider ${fieldErrors.passport ? 'border-danger-500 focus:ring-danger-500/30' : ''}`}
                        value={form.passport}
                        onChange={(e) => handlePassportChange(e.target.value)}
                        placeholder="AA 1234567"
                        maxLength={10}
                      />
                      {fieldErrors.passport && <p className="text-[11px] text-danger-600 mt-1">{fieldErrors.passport}</p>}
                    </div>
                    <div>
                      <label className={labelCls}>JSHSHIR (14 ta raqam)</label>
                      <div className="relative">
                        <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                        <input
                          className={`${inputCls} pl-9 font-mono tracking-wider ${fieldErrors.jshshir ? 'border-danger-500 focus:ring-danger-500/30' : ''}`}
                          value={form.jshshir}
                          onChange={(e) => set('jshshir', e.target.value.replace(/\D/g, ''))}
                          placeholder="12345678901234"
                          maxLength={14}
                        />
                      </div>
                      {fieldErrors.jshshir && <p className="text-[11px] text-danger-600 mt-1">{fieldErrors.jshshir}</p>}
                    </div>
                  </div>
                </section>

                {/* 3. Manzil va Joylashuv */}
                <section>
                  <SectionTitle icon={<MapPin className="w-3.5 h-3.5" />} title="Manzil va Joylashuv" />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className={labelCls}>Viloyat *</label>
                      <select
                        className={`${inputCls} ${fieldErrors.province ? 'border-danger-500 focus:ring-danger-500/30' : ''}`}
                        value={form.province}
                        onChange={(e) => set('province', e.target.value)}
                      >
                        <option value="">Viloyatni tanlang</option>
                        {provinces.map((p) => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                      {fieldErrors.province && <p className="text-[11px] text-danger-600 mt-1">{fieldErrors.province}</p>}
                    </div>
                    <div>
                      <label className={labelCls}>Tuman *</label>
                      <select
                        className={`${inputCls} ${fieldErrors.district ? 'border-danger-500 focus:ring-danger-500/30' : ''}`}
                        value={form.district}
                        onChange={(e) => set('district', e.target.value)}
                        disabled={!form.province}
                      >
                        <option value="">Tumanni tanlang</option>
                        {districts.map((d) => (
                          <option key={d.id} value={d.id}>{d.name}</option>
                        ))}
                      </select>
                      {fieldErrors.district && <p className="text-[11px] text-danger-600 mt-1">{fieldErrors.district}</p>}
                    </div>
                    <div>
                      <label className={labelCls}>Qavat</label>
                      <select className={inputCls} value={form.floor} onChange={(e) => set('floor', e.target.value)}>
                        <option value="">Qavatni tanlang</option>
                        {floorOptions.map((f) => (
                          <option key={f.value} value={f.value}>{f.label}</option>
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
                        <option value="">Xonani tanlang</option>
                        {roomOptions.map((r) => (
                          <option key={r.value} value={r.value}>{r.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </section>

                {/* 4. O'qish ma'lumotlari */}
                <section>
                  <SectionTitle icon={<GraduationCap className="w-3.5 h-3.5" />} title="O'qish ma'lumotlari" />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className={labelCls}>Fakultet</label>
                      <input
                        className={inputCls}
                        value={form.faculty}
                        onChange={(e) => set('faculty', e.target.value)}
                        placeholder="Axborot texnologiyalari"
                        maxLength={120}
                      />
                    </div>
                    <div>
                      <label className={labelCls}>Yo'nalish</label>
                      <input
                        className={inputCls}
                        value={form.direction}
                        onChange={(e) => set('direction', e.target.value)}
                        placeholder="Dasturiy injiniring"
                        maxLength={120}
                      />
                    </div>
                    <div>
                      <label className={labelCls}>Guruh</label>
                      <input
                        className={inputCls}
                        value={form.group}
                        onChange={(e) => set('group', e.target.value)}
                        placeholder="210-21"
                        maxLength={120}
                      />
                    </div>
                    <div>
                      <label className={labelCls}>Kurs</label>
                      <select className={inputCls} value={form.course} onChange={(e) => set('course', e.target.value)}>
                        {COURSE_OPTIONS.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </section>

                {/* 5. Rasmlar va fayllar */}
                <section>
                  <SectionTitle icon={<ImagePlus className="w-3.5 h-3.5" />} title="Rasmlar va Hujjatlar" />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {UPLOAD_FIELDS.map((uf) => (
                      <UploadCard
                        key={uf.key}
                        label={uf.label}
                        hint={uf.hint}
                        file={files[uf.key]}
                        onChange={(f) => handleFile(uf.key, f)}
                      />
                    ))}
                  </div>
                </section>

                {/* 6. Status, Imtiyoz va Faollik */}
                <section>
                  <SectionTitle icon={<BadgeCheck className="w-3.5 h-3.5" />} title="Status va Imtiyoz" />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className={labelCls}>Status</label>
                      <select className={inputCls} value={form.status} onChange={(e) => set('status', e.target.value)}>
                        {STATUS_OPTIONS.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className={labelCls}>Joylashuv holati</label>
                      <select className={inputCls} value={form.placement_status} onChange={(e) => set('placement_status', e.target.value)}>
                        {PLACEMENT_OPTIONS.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>

                    {/* Faol talaba checkbox */}
                    <div className="flex items-center gap-2.5 p-2.5 rounded-lg border border-surface-200 dark:border-surface-700 bg-surface-50/50 dark:bg-surface-950/40">
                      <input
                        id="is_active"
                        type="checkbox"
                        checked={form.is_active}
                        onChange={(e) => set('is_active', e.target.checked)}
                        className="w-4 h-4 rounded border-surface-300 text-brand-600 focus:ring-brand-500/40"
                      />
                      <label htmlFor="is_active" className="text-xs font-medium text-surface-700 dark:text-surface-300 select-none">
                        Faol talaba {form.room ? "(Xona biriktirilgan)" : "(Xona biriktirilgach faol bo'ladi)"}
                      </label>
                    </div>

                    {/* Imtiyoz checkbox */}
                    <div className="flex items-center gap-2.5 p-2.5 rounded-lg border border-surface-200 dark:border-surface-700 bg-surface-50/50 dark:bg-surface-950/40">
                      <input
                        id="privilege"
                        type="checkbox"
                        checked={form.privilege}
                        onChange={(e) => set('privilege', e.target.checked)}
                        className="w-4 h-4 rounded border-surface-300 text-brand-600 focus:ring-brand-500/40"
                      />
                      <label htmlFor="privilege" className="text-xs font-medium text-surface-700 dark:text-surface-300 select-none">
                        Imtiyozli talaba
                      </label>
                    </div>

                    {form.privilege && (
                      <div className="sm:col-span-2">
                        <label className={labelCls}>Imtiyoz ulushi (%)</label>
                        <input
                          type="number"
                          min={0}
                          max={100}
                          className={inputCls}
                          value={form.privilege_share}
                          onChange={(e) => set('privilege_share', e.target.value)}
                          placeholder="Masalan: 50"
                        />
                      </div>
                    )}
                  </div>
                </section>

              </div>

              {/* Modal Footer */}
              <div className="flex gap-2.5 px-5 py-3.5 border-t border-surface-200 dark:border-surface-800 shrink-0 bg-white dark:bg-surface-900">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-2 rounded-lg border border-surface-200 dark:border-surface-700 text-surface-700 dark:text-surface-300 text-sm font-semibold hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold disabled:opacity-50 transition-colors focus:ring-2 focus:ring-brand-500/30 shadow-sm"
                >
                  {saving ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                      Saqlanmoqda...
                    </span>
                  ) : (
                    'Saqlash'
                  )}
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
