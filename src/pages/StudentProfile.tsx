import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import BackButton from '../components/UI/BackButton';
import { BadgeCheck, Calendar, Trash2, Eye, FileText } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { mediaUrl } from '../data/config';
import api from '../data/api';
import { toast } from 'sonner';
import Select from 'react-select';
import { formatCurrency, formatDate } from '../utils/formatters';
import { invalidateStudentCaches } from '../utils/cacheUtils';
import { useGlobalEvents } from '../utils/globalEvents';
import Skeleton from '../components/UI/Skeleton';

type IdRef = number | { id: number; name?: string } | null | undefined;

interface Payment {
  id: number | string;
  paid_date: string;
  amount: number | string;
  method?: string;
  status: string;
}

interface PaymentSummary {
  total_amount?: number | string;
  approved_payments?: number;
  is_debtor?: boolean;
}

interface StudentForm {
  id?: number | string;
  name?: string;
  last_name?: string;
  middle_name?: string;
  phone?: string;
  jshshir?: string;
  faculty?: string;
  direction?: string;
  group?: string;
  course?: string;
  gender?: string;
  room?: IdRef;
  room_name?: string;
  floor?: IdRef;
  floor_name?: string;
  province?: IdRef;
  province_name?: string;
  district?: IdRef;
  district_name?: string;
  dormitory?: IdRef;
  user?: IdRef;
  passport?: string;
  status?: string;
  placement_status?: string;
  privilege?: boolean;
  privilege_share?: number | string;
  accepted_date?: string;
  total_payment?: number | string;
  payment_summary?: PaymentSummary;
  payments?: Payment[];
  picture?: string;
  passport_image_first?: string;
  passport_image_second?: string;
  document?: string;
  is_active?: boolean;
}

interface ApiError extends Error {
  response?: { data?: { detail?: string; message?: string } };
}

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error) {
    const apiError = error as ApiError;
    return apiError.response?.data?.detail || apiError.response?.data?.message || apiError.message || fallback;
  }
  return fallback;
}

function toArray<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[];
  return (data as { results?: T[] } | undefined)?.results || [];
}

// react-select custom styles for dark mode (brand/surface tokens) — matches Students.tsx
const selectStyles = {
  control: (base: Record<string, unknown>, state: { isFocused: boolean }) => ({
    ...base,
    backgroundColor: document.documentElement.classList.contains('dark') ? '#0f172a' : '#fff',
    borderColor: state.isFocused ? '#14b8a6' : (document.documentElement.classList.contains('dark') ? '#1e293b' : '#e2e8f0'),
    boxShadow: state.isFocused ? '0 0 0 2px #14b8a6' : undefined,
    minHeight: 40,
    fontSize: 15,
  }),
  menu: (base: Record<string, unknown>) => ({
    ...base,
    backgroundColor: document.documentElement.classList.contains('dark') ? '#0f172a' : '#fff',
    color: document.documentElement.classList.contains('dark') ? '#f1f5f9' : '#1e293b',
    zIndex: 9999,
  }),
  singleValue: (base: Record<string, unknown>) => ({
    ...base,
    color: document.documentElement.classList.contains('dark') ? '#f1f5f9' : '#1e293b',
  }),
  input: (base: Record<string, unknown>) => ({
    ...base,
    color: document.documentElement.classList.contains('dark') ? '#f1f5f9' : '#1e293b',
  }),
  placeholder: (base: Record<string, unknown>) => ({
    ...base,
    color: '#94a3b8',
  }),
  option: (base: Record<string, unknown>, state: { isSelected: boolean; isFocused: boolean }) => ({
    ...base,
    backgroundColor: state.isSelected
      ? '#14b8a6'
      : state.isFocused
        ? (document.documentElement.classList.contains('dark') ? '#1e293b' : '#f1f5f9')
        : 'transparent',
    color: state.isSelected
      ? '#ffffff'
      : (document.documentElement.classList.contains('dark') ? '#f1f5f9' : '#1e293b'),
    cursor: 'pointer',
  }),
};



function ReadOnlyInput({ label, value, type }: { label: string; value?: string | number | boolean; type?: 'date' | 'currency' | 'default' }) {
  let displayValue = typeof value === 'boolean' ? (value ? 'Ha' : 'Yo\'q') : value || '-';

  // Format based on type
  if (type === 'date') {
    displayValue = formatDate(displayValue as string);
  } else if (type === 'currency') {
    displayValue = formatCurrency(displayValue as string | number);
  }

  return (
    <div className="flex flex-col gap-1 w-full">
      <label className="text-xs text-surface-500 dark:text-surface-400 font-medium mb-1">{label}</label>
      <div className={`bg-surface-100 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl px-3 py-2 text-surface-900 dark:text-white text-base font-medium cursor-default focus:outline-none focus:ring-2 focus:ring-brand-500/40 w-full flex items-center ${type === 'date' || type === 'currency' ? 'text-brand-600 dark:text-brand-400' : ''}`}>
        {type === 'date' && <Calendar className="w-4 h-4 mr-2 text-brand-500 dark:text-brand-400" />}
        {type === 'currency' && <span className="mr-2 text-success-500 dark:text-success-400">₩</span>}
        {displayValue}
      </div>
    </div>
  );
}

function EditableInput({ label, value, onChange, type = 'text' }: { label: string; value?: string | number; onChange: (v: string) => void; type?: string }) {
  // Convert date format for date inputs (YYYY-MM-DD for HTML date input)
  let inputValue = value ?? '';
  const inputType = type;

  if (type === "date" && typeof value === "string") {
    try {
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        inputValue = date.toISOString().split('T')[0];
      }
    } catch {
      // Keep original value if parsing fails
    }
  }

  return (
    <div className="flex flex-col gap-1 w-full">
      <label className="text-xs text-surface-500 dark:text-surface-400 font-medium mb-1">{label}</label>
      <input
        className="bg-white dark:bg-surface-800 border border-surface-300 dark:border-surface-700 rounded-xl px-3 py-2 text-surface-900 dark:text-white text-base font-medium focus:outline-none focus:ring-2 focus:ring-brand-500/40 w-full transition-colors duration-150"
        value={inputValue}
        onChange={e => onChange(e.target.value)}
        type={inputType}
      />
    </div>
  );
}

const StudentProfile: React.FC = () => {
  const { studentId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { emitStudentUpdate, subscribe } = useGlobalEvents();
  const [editMode, setEditMode] = useState(false);
  const [hasEdited, setHasEdited] = useState(false);
  const [form, setForm] = useState<StudentForm | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // States for file uploads
  const [pictureFile, setPictureFile] = useState<File | null>(null);
  const [passportFirstFile, setPassportFirstFile] = useState<File | null>(null);
  const [passportSecondFile, setPassportSecondFile] = useState<File | null>(null);
  const [documentFile, setDocumentFile] = useState<File | null>(null);

  // Previews for file uploads
  const [passportFirstPreview, setPassportFirstPreview] = useState<string | null>(null);
  const [passportSecondPreview, setPassportSecondPreview] = useState<string | null>(null);
  const [documentPreview, setDocumentPreview] = useState<string | null>(null);

  // States for dropdown data
  const [provinces, setProvinces] = useState<{ id: number; name: string }[]>([]);
  const [districts, setDistricts] = useState<{ id: number; name: string; province: number }[]>([]);
  const [floors, setFloors] = useState<{ id: number; name: string }[]>([]);
  const [rooms, setRooms] = useState<{ id: number; name: string; floor: number }[]>([]);

  // React Query bilan student profilini olish
  const {
    data: student,
    isLoading,
    error,
    refetch
  } = useQuery<StudentForm>({
    queryKey: ['studentProfile', studentId],
    queryFn: () => api.getStudent(studentId as string),
    enabled: !!studentId,
    staleTime: 1000 * 60 * 5,
  });

  React.useEffect(() => {
    if (student) {
      setForm({
        ...student,
        course: student.course || '1-kurs',
        gender: student.gender || 'Erkak',
      });
    }
  }, [student]);

  // Tahrirlash rejimiga o'tganda barcha inputlarni to'g'ri holatga keltirish
  React.useEffect(() => {
    if (editMode && student) {
      // Form ma'lumotlarini qayta o'rnatish
      setForm({
        ...student,
        course: student.course || '1-kurs',
        gender: student.gender || 'Erkak',
      });
    }
  }, [editMode, student]);

  // Listen for global student updates
  useEffect(() => {
    const unsubscribe = subscribe('student-updated', () => {
      refetch();
    });
    return unsubscribe;
  }, [subscribe, refetch]);

  // Fetch provinces
  useEffect(() => {
    api.getProvinces()
      .then(data => setProvinces(toArray<{ id: number; name: string }>(data)))
      .catch(() => setProvinces([]));
  }, []);

  // Fetch floors
  useEffect(() => {
    api.getFloors()
      .then(data => setFloors(toArray<{ id: number; name: string }>(data)))
      .catch(() => setFloors([]));
  }, []);

  // Fetch districts when province changes
  useEffect(() => {
    const currentProvince = form?.province;
    const provinceId = typeof currentProvince === 'number' ? currentProvince : null;

    if (!provinceId) {
      setDistricts([]);
      return;
    }

    api.getDistricts(provinceId)
      .then(data => setDistricts(toArray<{ id: number; name: string; province: number }>(data)))
      .catch(() => setDistricts([]));
  }, [form?.province]);

  // Fetch rooms when floor changes
  useEffect(() => {
    const currentFloor = form?.floor;
    const floorId = typeof currentFloor === 'number' ? currentFloor : null;

    if (!floorId) {
      setRooms([]);
      return;
    }

    api.getRooms(floorId)
      .then(data => {
        const roomsArray = toArray<{ id: number; name: string; floor: number }>(data);
        // Xona raqami bo'yicha saralash
        const sortedRooms = [...roomsArray].sort((a, b) => {
          const aNum = parseInt(a.name.replace(/\D/g, '')) || 0;
          const bNum = parseInt(b.name.replace(/\D/g, '')) || 0;
          return aNum - bNum;
        });
        setRooms(sortedRooms);
      })
      .catch(() => setRooms([]));
  }, [form?.floor]);

  // Create options for dropdowns
  const statusOptions = [
    { value: 'Tekshirilmaydi', label: 'Tekshirilmaydi' },
    { value: 'Tekshirilmoqda', label: 'Tekshirilmoqda' },
    { value: 'Tasdiqlandi', label: 'Tasdiqlandi' },
    { value: 'Rad etildi', label: 'Rad etildi' }
  ];

  const placementStatusOptions = [
    { value: 'Qabul qilindi', label: 'Qabul qilindi' },
    { value: 'Joylashdi', label: 'Joylashdi' }
  ];

  const courseOptions = [
    { value: '1-kurs', label: '1-kurs' },
    { value: '2-kurs', label: '2-kurs' },
    { value: '3-kurs', label: '3-kurs' },
    { value: '4-kurs', label: '4-kurs' },
    { value: '5-kurs', label: '5-kurs' },
    { value: '6-kurs', label: '6-kurs' }
  ];

  const genderOptions = [
    { value: 'Erkak', label: 'Erkak' },
    { value: 'Ayol', label: 'Ayol' }
  ];

  const provinceOptions = provinces.map(p => ({ value: p.id, label: p.name }));
  const districtOptions = districts.map(d => ({ value: d.id, label: d.name }));
  const floorOptions = floors.map(f => ({ value: f.id, label: f.name }));
  const roomOptions = rooms.map(r => ({ value: r.id, label: r.name }));

  // Imtiyoz options
  const privilegeOptions = [
    { value: true, label: 'Imtiyozli' },
    { value: false, label: 'Imtiyozsiz' }
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface-50 dark:bg-surface-950 py-4 sm:py-6 px-1 sm:px-2 flex flex-col items-center">
        <div className="w-full max-w-4xl bg-white dark:bg-surface-900 rounded-2xl shadow-sm p-2 sm:p-6 md:p-8 border border-surface-200 dark:border-surface-800">
          <Skeleton className="h-8 w-48 mb-6" />
          <Skeleton className="h-40 w-full rounded-2xl" count={3} />
        </div>
      </div>
    );
  }
  if (error || !student || !form) {
    return (
      <div className="p-8 text-center text-danger-500">
        {error ? 'Maʼlumotlarni yuklashda xatolik.' : 'Talaba topilmadi.'} <BackButton label="Orqaga qaytish" className="mx-auto mt-4" />
      </div>
    );
  }

  const handleChange = (field: string, value: string) => {
    setForm(f => f ? { ...f, [field]: value } : f);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPictureFile(file);
      const reader = new FileReader();
      reader.onload = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePassportFirstChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPassportFirstFile(file);
      const reader = new FileReader();
      reader.onload = () => {
        setPassportFirstPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePassportSecondChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPassportSecondFile(file);
      const reader = new FileReader();
      reader.onload = () => {
        setPassportSecondPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDocumentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setDocumentFile(file);
      const reader = new FileReader();
      reader.onload = () => {
        setDocumentPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImagePreview(null);
    setPictureFile(null);
  };

  const handleSelectChange = (field: string, option: { value: number | boolean | string; label: string } | null) => {
    if (!option) {
      setForm(f => f ? { ...f, [field]: null } : f);
      return;
    }

    // Imtiyoz uchun boolean value
    if (field === 'privilege') {
      setForm(f => f ? { ...f, [field]: option.value } : f);
      return;
    }

    // For ID fields, store just the ID number
    setForm(f => f ? { ...f, [field]: option.value } : f);
  };

  const handleSave = async () => {
    if (!studentId || !form) return;

    setSaving(true);

    try {
      const formDataPayload = new FormData();

      // Basic string fields
      if (form.name !== undefined) formDataPayload.append('name', String(form.name || ''));
      if (form.last_name !== undefined) formDataPayload.append('last_name', String(form.last_name || ''));
      if (form.middle_name !== undefined) formDataPayload.append('middle_name', String(form.middle_name || ''));
      if (form.phone !== undefined) formDataPayload.append('phone', String(form.phone || ''));
      if (form.faculty !== undefined) formDataPayload.append('faculty', String(form.faculty || ''));
      if (form.direction !== undefined) formDataPayload.append('direction', String(form.direction || ''));
      if (form.group !== undefined) formDataPayload.append('group', String(form.group || ''));
      if (form.passport !== undefined) formDataPayload.append('passport', String(form.passport || ''));
      if (form.jshshir !== undefined) formDataPayload.append('jshshir', String(form.jshshir || ''));

      // Course
      if (form.course !== undefined) {
        formDataPayload.append('course', String(form.course || '1-kurs'));
      }

      // Gender
      if (form.gender !== undefined) {
        formDataPayload.append('gender', String(form.gender || 'Erkak'));
      }

      // Boolean fields
      if (form.privilege !== undefined) {
        formDataPayload.append('privilege', String(Boolean(form.privilege)));
      }

      if (form.is_active !== undefined) {
        formDataPayload.append('is_active', String(Boolean(form.is_active)));
      }

      // Privilege share
      if (form.privilege && form.privilege_share !== undefined) {
        formDataPayload.append('privilege_share', String(Number(form.privilege_share) || 0));
      }

      // Status fields
      if (form.status !== undefined) {
        formDataPayload.append('status', String(form.status || 'Tekshirilmaydi'));
      }

      if (form.placement_status !== undefined) {
        formDataPayload.append('placement_status', String(form.placement_status || 'Qabul qilindi'));
      }

      // ID fields
      const extractId = (value: IdRef): number | undefined => {
        if (!value) return undefined;
        if (typeof value === 'number') return value;
        if (typeof value === 'object' && value.id) return Number(value.id);
        return undefined;
      };

      const provinceId = extractId(form.province);
      if (provinceId !== undefined) formDataPayload.append('province', String(provinceId));

      const districtId = extractId(form.district);
      if (districtId !== undefined) formDataPayload.append('district', String(districtId));

      const dormitoryId = extractId(form.dormitory);
      if (dormitoryId !== undefined) formDataPayload.append('dormitory', String(dormitoryId));

      const floorId = extractId(form.floor);
      if (floorId !== undefined) formDataPayload.append('floor', String(floorId));

      const roomId = extractId(form.room);
      if (roomId !== undefined) formDataPayload.append('room', String(roomId));

      const userId = extractId(form.user);
      if (userId !== undefined) formDataPayload.append('user', String(userId));

      // Files
      if (pictureFile) {
        formDataPayload.append('picture', pictureFile);
      }
      if (passportFirstFile) {
        formDataPayload.append('passport_image_first', passportFirstFile);
      }
      if (passportSecondFile) {
        formDataPayload.append('passport_image_second', passportSecondFile);
      }
      if (documentFile) {
        formDataPayload.append('document', documentFile);
      }

      await api.updateStudent(studentId, formDataPayload);

      toast.success('Talaba maʼlumotlari saqlandi!');
      setEditMode(false);
      setHasEdited(true);
      setImagePreview(null);
      setPassportFirstPreview(null);
      setPassportSecondPreview(null);
      setDocumentPreview(null);
      setPictureFile(null);
      setPassportFirstFile(null);
      setPassportSecondFile(null);
      setDocumentFile(null);

      // Barcha bog'liq cache larni yangilash
      await invalidateStudentCaches(queryClient);
      // Force immediate refetch
      await refetch();
      // Emit global event
      emitStudentUpdate({ action: 'updated', id: studentId });
    } catch (error) {
      toast.error(getErrorMessage(error, 'Xatolik yuz berdi!'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!studentId) return;

    setDeleting(true);
    try {
      await api.deleteStudent(studentId);

      toast.success('Talaba muvaffaqiyatli o\'chirildi!');

      // Barcha bog'liq cache larni yangilash
      await invalidateStudentCaches(queryClient);
      // Emit global event
      emitStudentUpdate({ action: 'deleted', id: studentId });

      // Students sahifasiga qaytish
      window.location.href = '/students';
    } catch (error) {
      toast.error(getErrorMessage(error, "Talabani o'chirishda xatolik yuz berdi!"));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-50 dark:bg-surface-950 py-4 sm:py-6 px-1 sm:px-2 flex flex-col items-center">
      <div className="w-full max-w-4xl bg-white dark:bg-surface-900 rounded-2xl shadow-sm p-2 sm:p-6 md:p-8 border border-surface-200 dark:border-surface-800">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0 mb-4 sm:mb-6">
          <BackButton
            label="Orqaga"
            onClick={() => hasEdited ? navigate('/students') : navigate(-1)}
          />

          <div className="flex items-center gap-2 justify-center">
            <BadgeCheck className="w-6 h-6 sm:w-7 sm:h-7 text-brand-600 dark:text-brand-400" />
            <h1 className="text-lg sm:text-2xl md:text-3xl font-bold text-surface-900 dark:text-white">Talaba profili</h1>
          </div>

          <div className="flex gap-2">
            {editMode && (
              <button
                className="px-3 sm:px-4 py-2 rounded-xl border border-surface-300 dark:border-surface-600 bg-surface-100 dark:bg-surface-800 text-surface-700 dark:text-surface-200 font-semibold hover:bg-surface-200 dark:hover:bg-surface-700 transition-colors duration-150 text-sm sm:text-base"
                onClick={() => {
                  setEditMode(false);
                  setForm(student); // Reset form to original data
                  setImagePreview(null);
                }}
              >
                Bekor qilish
              </button>
            )}
            <button
              className="px-3 sm:px-4 py-2 rounded-xl bg-brand-600 text-white font-semibold hover:bg-brand-700 transition-colors duration-150 text-sm sm:text-base disabled:opacity-60 disabled:cursor-not-allowed"
              onClick={() => editMode ? handleSave() : setEditMode(true)}
              disabled={saving}
            >
              {editMode ? (saving ? 'Saqlanmoqda...' : 'Saqlash') : 'Tahrirlash'}
            </button>
            {!editMode && (
              <button
                className="px-3 sm:px-4 py-2 rounded-xl bg-danger-600 text-white font-semibold hover:bg-danger-700 transition-colors duration-150 text-sm sm:text-base flex items-center gap-2"
                onClick={() => setShowDeleteModal(true)}
              >
                <Trash2 className="w-4 h-4" />
                O'chirish
              </button>
            )}
          </div>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 mb-6 sm:mb-8">
          {/* Profil rasmi yoki avatar */}
          <div className="relative">
            {imagePreview || form.picture ? (
              <img
                src={imagePreview || mediaUrl(form.picture)}
                alt={form.name}
                className="w-32 h-32 object-cover rounded-xl border border-surface-200 dark:border-surface-700"
              />
            ) : (
              <div className="w-32 h-32 flex items-center justify-center bg-surface-200 dark:bg-surface-800 text-5xl font-bold text-surface-500 dark:text-surface-400 rounded-xl border border-surface-200 dark:border-surface-700">
                {form.name && form.last_name
                  ? `${form.name[0] || ''}${form.last_name[0] || ''}`
                  : ''}
              </div>
            )}

            {editMode && (
              <div className="absolute inset-0 bg-black/50 rounded-xl flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-150 cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <span className="text-white text-sm font-medium">📷 Rasm yuklash</span>
              </div>
            )}

            {editMode && (imagePreview || form.picture) && (
              <button
                onClick={removeImage}
                className="absolute -top-2 -right-2 bg-danger-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-danger-600 transition-colors duration-150"
              >
                ×
              </button>
            )}
          </div>
          <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {editMode ? (
              <>
                <EditableInput label="Ism" value={form.name} onChange={v => handleChange('name', v)} />
                <EditableInput label="Familiya" value={form.last_name} onChange={v => handleChange('last_name', v)} />
                <EditableInput label="Otasining ismi" value={form.middle_name} onChange={v => handleChange('middle_name', v)} />
                <EditableInput label="Telefon" value={form.phone} onChange={v => handleChange('phone', v)} />
                <EditableInput label="JSHSHIR" value={form.jshshir} onChange={v => handleChange('jshshir', v)} />
              </>
            ) : (
              <>
                <ReadOnlyInput label="Ism" value={form.name} />
                <ReadOnlyInput label="Familiya" value={form.last_name} />
                <ReadOnlyInput label="Otasining ismi" value={form.middle_name} />
                <ReadOnlyInput label="Telefon" value={form.phone} />
                <ReadOnlyInput label="JSHSHIR" value={form.jshshir} />
              </>
            )}
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-6 md:gap-8 mt-4 sm:mt-6">
          {editMode ? (
            <>
              <EditableInput label="Fakultet" value={form.faculty} onChange={v => handleChange('faculty', v)} />
              <EditableInput label="Yo'nalish" value={form.direction} onChange={v => handleChange('direction', v)} />
              <EditableInput label="Guruh" value={form.group || ''} onChange={v => handleChange('group', v)} />

              {/* Course Select */}
              <div className="flex flex-col gap-1 w-full">
                <label className="text-xs text-surface-500 dark:text-surface-400 font-medium mb-1">Kurs</label>
                <Select
                  options={courseOptions}
                  value={courseOptions.find(opt => opt.value === form.course) || null}
                  onChange={opt => handleSelectChange('course', opt)}
                  isClearable
                  placeholder="Kursni tanlang..."
                  styles={selectStyles}
                  classNamePrefix="react-select"
                />
              </div>

              {/* Gender Select */}
              <div className="flex flex-col gap-1 w-full">
                <label className="text-xs text-surface-500 dark:text-surface-400 font-medium mb-1">Jins</label>
                <Select
                  options={genderOptions}
                  value={genderOptions.find(opt => opt.value === form.gender) || null}
                  onChange={opt => handleSelectChange('gender', opt)}
                  isClearable
                  placeholder="Jinsni tanlang..."
                  styles={selectStyles}
                  classNamePrefix="react-select"
                />
              </div>

              <div className="flex flex-col gap-1 w-full">
                <label className="text-xs text-surface-500 dark:text-surface-400 font-medium mb-1">Qavat</label>
                <Select
                  options={floorOptions}
                  value={floorOptions.find(opt => {
                    const floorValue = form.floor;
                    const floorId = typeof floorValue === 'object' ? floorValue?.id : floorValue;
                    return opt.value === floorId;
                  }) || null}
                  onChange={opt => handleSelectChange('floor', opt)}
                  isClearable
                  placeholder="Qavat tanlang..."
                  styles={selectStyles}
                  classNamePrefix="react-select"
                />
              </div>
              <div className="flex flex-col gap-1 w-full">
                <label className="text-xs text-surface-500 dark:text-surface-400 font-medium mb-1">Xona</label>
                <Select
                  options={roomOptions}
                  value={roomOptions.find(opt => {
                    const roomValue = form.room;
                    const roomId = typeof roomValue === 'object' ? roomValue?.id : roomValue;
                    return opt.value === roomId;
                  }) || null}
                  onChange={opt => handleSelectChange('room', opt)}
                  isClearable
                  placeholder="Xona tanlang..."
                  styles={selectStyles}
                  classNamePrefix="react-select"
                  isDisabled={!form.floor}
                />
              </div>
              <div className="flex flex-col gap-1 w-full">
                <label className="text-xs text-surface-500 dark:text-surface-400 font-medium mb-1">Viloyat</label>
                <Select
                  options={provinceOptions}
                  value={provinceOptions.find(opt => {
                    const provinceValue = form.province;
                    const provinceId = typeof provinceValue === 'object' ? provinceValue?.id : provinceValue;
                    return opt.value === provinceId;
                  }) || null}
                  onChange={opt => handleSelectChange('province', opt)}
                  isClearable
                  placeholder="Viloyat tanlang..."
                  styles={selectStyles}
                  classNamePrefix="react-select"
                />
              </div>
              <div className="flex flex-col gap-1 w-full">
                <label className="text-xs text-surface-500 dark:text-surface-400 font-medium mb-1">Tuman</label>
                <Select
                  options={districtOptions}
                  value={districtOptions.find(opt => {
                    const districtValue = form.district;
                    const districtId = typeof districtValue === 'object' ? districtValue?.id : districtValue;
                    return opt.value === districtId;
                  }) || null}
                  onChange={opt => handleSelectChange('district', opt)}
                  isClearable
                  placeholder="Tuman tanlang..."
                  styles={selectStyles}
                  classNamePrefix="react-select"
                  isDisabled={!form.province}
                />
              </div>
              <EditableInput label="Pasport" value={form.passport || ''} onChange={v => handleChange('passport', v)} />

              {/* Status Select */}
              <div className="flex flex-col gap-1 w-full">
                <label className="text-xs text-surface-500 dark:text-surface-400 font-medium mb-1">Holati</label>
                <Select
                  options={statusOptions}
                  value={statusOptions.find(opt => opt.value === form.status) || null}
                  onChange={opt => handleSelectChange('status', opt)}
                  isClearable
                  placeholder="Holatni tanlang..."
                  styles={selectStyles}
                  classNamePrefix="react-select"
                />
              </div>

              {/* Placement Status Select */}
              <div className="flex flex-col gap-1 w-full">
                <label className="text-xs text-surface-500 dark:text-surface-400 font-medium mb-1">Joylashish holati</label>
                <Select
                  options={placementStatusOptions}
                  value={placementStatusOptions.find(opt => opt.value === form.placement_status) || null}
                  onChange={opt => handleSelectChange('placement_status', opt)}
                  isClearable
                  placeholder="Joylashish holatini tanlang..."
                  styles={selectStyles}
                  classNamePrefix="react-select"
                />
              </div>

              {/* Imtiyoz Select */}
              <div className="flex flex-col gap-1 w-full">
                <label className="text-xs text-surface-500 dark:text-surface-400 font-medium mb-1">Imtiyoz</label>
                <Select
                  options={privilegeOptions}
                  value={privilegeOptions.find(opt => opt.value === form.privilege) || null}
                  onChange={opt => handleSelectChange('privilege', opt)}
                  isClearable
                  placeholder="Imtiyoz tanlang..."
                  styles={selectStyles}
                  classNamePrefix="react-select"
                />
              </div>

              {/* Imtiyoz ulushi - faqat imtiyoz belgilangan bo'lsa ko'rsatish */}
              {form.privilege && (
                <div className="flex flex-col gap-1 w-full">
                  <label className="text-xs text-surface-500 dark:text-surface-400 font-medium mb-1">Imtiyoz ulushi (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={form.privilege_share || ''}
                    onChange={e => handleChange('privilege_share', e.target.value)}
                    className="bg-white dark:bg-surface-800 border border-surface-300 dark:border-surface-700 rounded-xl px-3 py-2 text-surface-900 dark:text-white text-base font-medium focus:outline-none focus:ring-2 focus:ring-brand-500/40 w-full transition-colors duration-150"
                    placeholder="Imtiyoz ulushi"
                  />
                </div>
              )}
              <ReadOnlyInput label="Qabul qilingan sana" value={form.accepted_date} type="date" />
              <ReadOnlyInput
                label="Jami to'lov"
                value={form.payment_summary?.total_amount || form.total_payment}
                type="currency"
              />
            </>
          ) : (
            <>
              <ReadOnlyInput label="Fakultet" value={form.faculty} />
              <ReadOnlyInput label="Yo'nalish" value={form.direction} />
              <ReadOnlyInput label="Guruh" value={form.group} />
              <ReadOnlyInput label="Kurs" value={form.course} />
              <ReadOnlyInput label="Jins" value={form.gender} />
              <ReadOnlyInput label="Xona" value={form.room_name} />
              <ReadOnlyInput label="Qavat" value={form.floor_name} />
              <ReadOnlyInput label="Viloyat" value={form.province_name} />
              <ReadOnlyInput label="Tuman" value={form.district_name} />
              <ReadOnlyInput label="Pasport" value={form.passport} />
              <ReadOnlyInput label="Holati" value={form.status} />
              <ReadOnlyInput label="Joylashish holati" value={form.placement_status} />
              <ReadOnlyInput
                label="Imtiyoz"
                value={form.privilege ? 'Imtiyozli' : 'Imtiyozsiz'}
              />
              {form.privilege && form.privilege_share && (
                <ReadOnlyInput
                  label="Imtiyoz ulushi"
                  value={`${form.privilege_share}%`}
                />
              )}
              <ReadOnlyInput label="Qabul qilingan sana" value={form.accepted_date} type="date" />
              <ReadOnlyInput
                label="Jami to'lov"
                value={form.payment_summary?.total_amount || form.total_payment}
                type="currency"
              />
            </>
          )}
        </div>

        {/* Hujjatlar bo'limi */}
        {editMode ? (
          <div className="bg-white dark:bg-surface-900 rounded-2xl shadow-sm p-4 sm:p-6 border mt-6 border-surface-200 dark:border-surface-800 w-full">
            <h2 className="text-lg sm:text-xl font-bold text-surface-900 dark:text-white mb-4 sm:mb-6 flex items-center gap-2">
              <BadgeCheck className="w-5 h-5 text-brand-500" />
              Hujjatlarni tahrirlash
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Pasport (old) */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-medium text-surface-500 dark:text-surface-400">Pasport (old tomoni)</label>
                <div className="relative aspect-video bg-surface-100 dark:bg-surface-900 rounded-xl overflow-hidden border border-dashed border-surface-300 dark:border-surface-700 flex items-center justify-center">
                  {passportFirstPreview || form.passport_image_first ? (
                    <img src={passportFirstPreview || form.passport_image_first} className="w-full h-full object-contain" alt="Pasport old" />
                  ) : (
                    <FileText className="w-8 h-8 text-surface-400" />
                  )}
                  <input type="file" accept="image/*" onChange={handlePassportFirstChange} className="absolute inset-0 opacity-0 cursor-pointer" />
                </div>
              </div>

              {/* Pasport (orqa) */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-medium text-surface-500 dark:text-surface-400">Pasport (orqa tomoni)</label>
                <div className="relative aspect-video bg-surface-100 dark:bg-surface-900 rounded-xl overflow-hidden border border-dashed border-surface-300 dark:border-surface-700 flex items-center justify-center">
                  {passportSecondPreview || form.passport_image_second ? (
                    <img src={passportSecondPreview || form.passport_image_second} className="w-full h-full object-contain" alt="Pasport orqa" />
                  ) : (
                    <FileText className="w-8 h-8 text-surface-400" />
                  )}
                  <input type="file" accept="image/*" onChange={handlePassportSecondChange} className="absolute inset-0 opacity-0 cursor-pointer" />
                </div>
              </div>

              {/* Qo'shimcha hujjat */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-medium text-surface-500 dark:text-surface-400">Qo'shimcha hujjat</label>
                <div className="relative aspect-video bg-surface-100 dark:bg-surface-900 rounded-xl overflow-hidden border border-dashed border-surface-300 dark:border-surface-700 flex items-center justify-center">
                  {documentPreview || form.document ? (
                    <div className="flex flex-col items-center gap-1">
                      <FileText className="w-8 h-8 text-brand-500" />
                      <span className="text-[10px] text-surface-500">Hujjat tanlangan</span>
                    </div>
                  ) : (
                    <FileText className="w-8 h-8 text-surface-400" />
                  )}
                  <input type="file" onChange={handleDocumentChange} className="absolute inset-0 opacity-0 cursor-pointer" />
                </div>
              </div>
            </div>
          </div>
        ) : form && (
          <div className="bg-white dark:bg-surface-900 rounded-2xl shadow-sm p-4 sm:p-6 border mt-6 border-surface-200 dark:border-surface-800 w-full">
            <h2 className="text-lg sm:text-xl font-bold text-surface-900 dark:text-white mb-4 sm:mb-6 flex items-center gap-2">
              <BadgeCheck className="w-5 h-5 text-brand-500" />
              Hujjatlar
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
              {/* Pasport old tomoni */}
              {form.passport_image_first && (
                <div
                  className="group relative bg-surface-50 dark:bg-surface-800/30 rounded-xl overflow-hidden border border-surface-100 dark:border-surface-800 cursor-pointer shadow-sm hover:shadow-md transition-all duration-300"
                  onClick={() => setSelectedImage(form.passport_image_first ?? null)}
                >
                  <div className="aspect-[3/4] sm:aspect-video bg-surface-100 dark:bg-surface-900 flex items-center justify-center relative overflow-hidden">
                    <img
                      src={form.passport_image_first}
                      alt="Pasport old tomoni"
                      className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                       <Eye className="text-white w-6 h-6 sm:w-8 sm:h-8" />
                    </div>
                  </div>
                  <div className="p-2 sm:p-3 bg-white dark:bg-surface-900 text-center border-t border-surface-50 dark:border-surface-800">
                    <div className="text-[10px] sm:text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider truncate">Pasport (old)</div>
                  </div>
                </div>
              )}

              {/* Pasport orqa tomoni */}
              {form.passport_image_second && (
                <div
                  className="group relative bg-surface-50 dark:bg-surface-800/30 rounded-xl overflow-hidden border border-surface-100 dark:border-surface-800 cursor-pointer shadow-sm hover:shadow-md transition-all duration-300"
                  onClick={() => setSelectedImage(form.passport_image_second ?? null)}
                >
                  <div className="aspect-[3/4] sm:aspect-video bg-surface-100 dark:bg-surface-900 flex items-center justify-center relative overflow-hidden">
                    <img
                      src={form.passport_image_second}
                      alt="Pasport orqa tomoni"
                      className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                       <Eye className="text-white w-6 h-6 sm:w-8 sm:h-8" />
                    </div>
                  </div>
                  <div className="p-2 sm:p-3 bg-white dark:bg-surface-900 text-center border-t border-surface-50 dark:border-surface-800">
                    <div className="text-[10px] sm:text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider truncate">Pasport (orqa)</div>
                  </div>
                </div>
              )}

              {/* Qo'shimcha hujjat - Fayl ko'rinishida */}
              {form.document && (
                <a
                  href={form.document}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative bg-surface-50 dark:bg-surface-800/30 rounded-xl overflow-hidden border border-surface-100 dark:border-surface-800 cursor-pointer shadow-sm hover:shadow-md transition-all duration-300 flex flex-col"
                >
                  <div className="aspect-[3/4] sm:aspect-video bg-surface-100 dark:bg-surface-900 flex items-center justify-center relative overflow-hidden">
                    <div className="flex flex-col items-center gap-3">
                      <FileText className="w-16 h-16 text-surface-400 dark:text-surface-500 group-hover:text-brand-500 dark:group-hover:text-brand-400 transition-colors duration-150" />
                      <span className="text-xs text-surface-500 dark:text-surface-400 font-medium">Hujjatni ochish</span>
                    </div>
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                       <Eye className="text-white w-6 h-6 sm:w-8 sm:h-8" />
                    </div>
                  </div>
                  <div className="p-2 sm:p-3 bg-white dark:bg-surface-900 text-center border-t border-surface-50 dark:border-surface-800">
                    <div className="text-[10px] sm:text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider truncate">Qo'shimcha hujjat</div>
                  </div>
                </a>
              )}
            </div>
          </div>
        )}

        {/* To'lovlar tarixi */}
        {!editMode && form && form.payments && form.payments.length > 0 && (
          <div className="bg-white dark:bg-surface-900 rounded-2xl shadow-sm p-6 border border-surface-200 dark:border-surface-800 mt-6 w-full">
            <h2 className="text-xl font-bold text-surface-900 dark:text-white mb-6">To'lovlar tarixi</h2>

            {/* Summary Cards */}
            {form.payment_summary && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                 <div className="bg-brand-50 dark:bg-brand-900/20 p-4 rounded-2xl border border-brand-100 dark:border-brand-800">
                    <p className="text-sm text-surface-500 dark:text-surface-400">Jami to'langan</p>
                    <p className="text-lg font-bold text-brand-600 dark:text-brand-400">
                      {formatCurrency(form.payment_summary.total_amount)}
                    </p>
                 </div>
                 <div className="bg-success-50 dark:bg-success-900/20 p-4 rounded-2xl border border-success-100 dark:border-success-800">
                    <p className="text-sm text-surface-500 dark:text-surface-400">Tasdiqlangan to'lovlar</p>
                    <p className="text-lg font-bold text-success-600 dark:text-success-400">
                      {form.payment_summary.approved_payments} ta
                    </p>
                 </div>
                 <div className={`p-4 rounded-2xl border ${form.payment_summary.is_debtor ? 'bg-danger-50 dark:bg-danger-900/20 border-danger-100 dark:border-danger-800' : 'bg-success-50 dark:bg-success-900/20 border-success-100 dark:border-success-800'}`}>
                    <p className="text-sm text-surface-500 dark:text-surface-400">Holati</p>
                    <p className={`text-lg font-bold ${form.payment_summary.is_debtor ? 'text-danger-600 dark:text-danger-400' : 'text-success-600 dark:text-success-400'}`}>
                      {form.payment_summary.is_debtor ? 'Qarzdor' : 'To\'lov qilingan'}
                    </p>
                 </div>
              </div>
            )}

            {/* Payments List */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-surface-200 dark:border-surface-700">
                    <th className="py-3 px-4 text-sm font-medium text-surface-500 dark:text-surface-400">Sana</th>
                    <th className="py-3 px-4 text-sm font-medium text-surface-500 dark:text-surface-400">Summa</th>
                    <th className="py-3 px-4 text-sm font-medium text-surface-500 dark:text-surface-400">Usul</th>
                    <th className="py-3 px-4 text-sm font-medium text-surface-500 dark:text-surface-400">Holat</th>
                  </tr>
                </thead>
                <tbody>
                  {form.payments.map((payment: Payment) => (
                    <tr key={payment.id} className="border-b border-surface-100 dark:border-surface-700/50 hover:bg-surface-50 dark:hover:bg-surface-800/30 transition-colors duration-150">
                      <td className="py-3 px-4 text-surface-900 dark:text-white">
                        {formatDate(payment.paid_date)}
                      </td>
                      <td className="py-3 px-4 font-medium text-surface-900 dark:text-white">
                        {formatCurrency(payment.amount)}
                      </td>
                      <td className="py-3 px-4 text-surface-700 dark:text-surface-300">
                        {payment.method || '-'}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          payment.status === 'APPROVED'
                            ? 'bg-success-100 text-success-700 dark:bg-success-900/30 dark:text-success-400'
                            : payment.status === 'REJECTED'
                            ? 'bg-danger-100 text-danger-700 dark:bg-danger-900/30 dark:text-danger-400'
                            : 'bg-warning-100 text-warning-700 dark:bg-warning-900/30 dark:text-warning-400'
                        }`}>
                          {payment.status === 'APPROVED' ? 'Tasdiqlangan' :
                           payment.status === 'REJECTED' ? 'Rad etilgan' :
                           payment.status === 'PENDING' ? 'Kutilmoqda' : payment.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Rasm modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-5xl max-h-[90vh] w-full">
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute -top-10 right-0 text-white hover:text-surface-300 transition-colors duration-150"
            >
              <span className="text-4xl font-light">×</span>
            </button>
            <img
              src={selectedImage}
              alt="Katta rasm"
              className="w-full h-full object-contain rounded-xl"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}

      {/* O'chirish modali */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-surface-900 rounded-2xl shadow-sm w-full max-w-md p-6 border border-surface-200 dark:border-surface-800">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-danger-100 dark:bg-danger-900/30 rounded-full flex items-center justify-center">
                <Trash2 className="w-6 h-6 text-danger-600 dark:text-danger-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-surface-900 dark:text-white">Talabani o'chirish</h3>
                <p className="text-sm text-surface-500 dark:text-surface-400">Bu amalni bekor qilib bo'lmaydi</p>
              </div>
            </div>

            <div className="mb-6">
              <p className="text-surface-700 dark:text-surface-300">
                Rostdan ham <strong>{student?.name} {student?.last_name}</strong> nomli talabani o'chirmoqchimisiz?
              </p>
              <p className="text-sm text-danger-600 dark:text-danger-400 mt-2">
                Bu amal qaytarilmaydi va barcha ma'lumotlar yo'qoladi.
              </p>
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteModal(false)}
                disabled={deleting}
                className="px-4 py-2 text-surface-700 dark:text-surface-300 bg-surface-100 dark:bg-surface-800 hover:bg-surface-200 dark:hover:bg-surface-700 rounded-xl transition-colors duration-150"
              >
                Bekor qilish
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2 bg-danger-600 hover:bg-danger-700 text-white rounded-xl transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {deleting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    O'chirilmoqda...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    O'chirish
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentProfile;
