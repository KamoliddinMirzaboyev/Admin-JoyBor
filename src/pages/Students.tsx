import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import Select from 'react-select';
import { UserPlus } from 'lucide-react';
import { useStudents, useFloors, useRooms } from '../hooks/api/useApi';
import { api } from '../data/api';
import Skeleton from '../components/UI/Skeleton';
import StudentsTable, { Student } from '../components/students/StudentsTable';
import CreateStudentModal from '../components/students/CreateStudentModal';

// react-select custom styles for dark mode (brand/surface tokens)
const selectStyles = {
  control: (base: Record<string, unknown>, state: { isFocused: boolean }) => ({
    ...base,
    backgroundColor: document.documentElement.classList.contains('dark') ? '#0f172a' : '#fff',
    borderColor: state.isFocused ? '#2563eb' : (document.documentElement.classList.contains('dark') ? '#1e293b' : '#e2e8f0'),
    boxShadow: state.isFocused ? '0 0 0 2px rgba(37, 99, 235, 0.2)' : undefined,
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
      ? '#2563eb'
      : state.isFocused
        ? (document.documentElement.classList.contains('dark') ? '#1e293b' : '#eff6ff')
        : 'transparent',
    color: state.isSelected
      ? '#ffffff'
      : (document.documentElement.classList.contains('dark') ? '#f1f5f9' : '#1e293b'),
    cursor: 'pointer',
  }),
};

interface FloorOption {
  id: number | string;
  name: string;
}

interface RoomOption {
  id: number | string;
  name: string;
  floor: number | string;
}

type SelectOption = { value: string; label: string };

const Students: React.FC = () => {
  // Fetch students using custom hook with caching
  const { data: studentsData, isLoading, error: fetchError, refetch } = useStudents({ is_active: true });

  // Extract results and filter active students
  const students = React.useMemo<Student[]>(() => {
    const raw = studentsData as { results?: Student[] } | undefined;
    const results = Array.isArray(raw?.results) ? raw!.results! : [];
    return results.filter((student) => student.is_active !== false);
  }, [studentsData]);

  // Filter states
  const [genderFilter, setGenderFilter] = useState('');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('');
  const [roomFilter, setRoomFilter] = useState('');
  const [floorFilter, setFloorFilter] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Fetch real data for filters
  const { data: floorsDataAPI } = useFloors();
  const { data: roomsDataAPI } = useRooms();

  const floorFilterOptions = React.useMemo<SelectOption[]>(() => {
    const raw = floorsDataAPI as { results?: FloorOption[] } | FloorOption[] | undefined;
    const results: FloorOption[] = Array.isArray(raw) ? raw : Array.isArray(raw?.results) ? raw.results : [];
    return results.map((f) => ({ value: String(f.id), label: f.name }));
  }, [floorsDataAPI]);

  const allRoomOptions = React.useMemo<SelectOption[]>(() => {
    const raw = roomsDataAPI as { results?: RoomOption[] } | RoomOption[] | undefined;
    const results: RoomOption[] = Array.isArray(raw) ? raw : Array.isArray(raw?.results) ? raw.results : [];
    const filtered = floorFilter ? results.filter((r) => String(r.floor) === floorFilter) : results;
    return filtered.map((r) => ({ value: String(r.id), label: r.name }));
  }, [roomsDataAPI, floorFilter]);

  // Filtering and sorting logic
  const filteredStudents = students
    .filter((s) => {
      const studentGender = String(s.gender || '').toLowerCase().trim();
      const filterGender = genderFilter.toLowerCase();
      const matchesGender =
        !genderFilter ||
        studentGender === filterGender ||
        (studentGender === 'erkak' && filterGender === 'male') ||
        (studentGender === 'ayol' && filterGender === 'female') ||
        (studentGender === 'м' && filterGender === 'male') ||
        (studentGender === 'ж' && filterGender === 'female');

      const isDebtor = Boolean(s.payment_summary?.is_debtor);
      const matchesPayment =
        !paymentStatusFilter ||
        (paymentStatusFilter === 'haqdor' ? !isDebtor : isDebtor);

      const matchesRoom = !roomFilter || String(s.room ?? '') === roomFilter;
      const matchesFloor = !floorFilter || String(s.floor ?? '') === floorFilter;

      return matchesGender && matchesPayment && matchesRoom && matchesFloor;
    })
    .sort((a, b) => String(a.last_name || '').toLowerCase().localeCompare(String(b.last_name || '').toLowerCase(), 'uz-UZ'));

  // Listen for global student updates
  useEffect(() => {
    const handleStudentUpdate = () => {
      refetch();
    };
    window.addEventListener('student-updated', handleStudentUpdate);
    return () => {
      window.removeEventListener('student-updated', handleStudentUpdate);
    };
  }, [refetch]);

  // Export handler for DataTable
  const handleExportStudents = async () => {
    try {
      const response = await api.exportStudents();
      if (!response.ok) {
        toast.error('Export xatolik yuz berdi!');
        return;
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `talabalar_ro'yxati_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      window.URL.revokeObjectURL(url);
      toast.success("Talabalar ro'yxati muvaffaqiyatli yuklandi!");
    } catch {
      toast.error('Export xatolik yuz berdi!');
    }
  };

  // Loading state
  if (isLoading && students.length === 0) {
    return (
      <div className="max-w-7xl mx-auto py-4 sm:py-8 px-1 sm:px-4">
        <Skeleton className="h-8 w-48 mb-6" />
        <Skeleton className="h-12 w-full mb-4" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  // Error state
  if (fetchError) {
    return (
      <div className="text-center py-10 text-danger-600 dark:text-danger-400">
        Ma'lumotlarni yuklashda xatolik yuz berdi.
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-4 sm:py-8 px-1 sm:px-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0 mb-4 sm:mb-6">
        <div>
          <h1 className="text-xl sm:text-3xl font-bold text-surface-900 dark:text-white">Talabalar</h1>
          <p className="text-surface-600 dark:text-surface-400 mt-1 text-xs sm:text-base">
            Yotoqxonada yashayotgan talabalar ro'yxati
            {(genderFilter || paymentStatusFilter || roomFilter) && (
              <span className="ml-2 text-brand-600 dark:text-brand-400 font-medium">
                ({filteredStudents.length} ta natija)
              </span>
            )}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 sm:py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-semibold shadow-sm transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-brand-500/40"
        >
          <UserPlus className="w-4 h-4 sm:w-5 sm:h-5" />
          Talaba qo&apos;shish
        </button>
      </div>

      {/* Filter va qidiruv */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
        <div className="flex flex-wrap gap-3 items-center">
          <Select
            options={[
              { value: 'male', label: 'Erkak' },
              { value: 'female', label: 'Ayol' },
            ]}
            value={genderFilter ? { value: genderFilter, label: genderFilter === 'male' ? 'Erkak' : 'Ayol' } : null}
            onChange={(opt: SelectOption | null) => setGenderFilter(opt ? opt.value : '')}
            isClearable
            placeholder="Jins"
            styles={selectStyles}
            classNamePrefix="react-select"
            className="min-w-[120px]"
          />
          <Select
            options={[
              { value: 'haqdor', label: 'Haqdor' },
              { value: 'qarzdor', label: 'Qarzdor' },
            ]}
            value={paymentStatusFilter ? { value: paymentStatusFilter, label: paymentStatusFilter === 'haqdor' ? 'Haqdor' : 'Qarzdor' } : null}
            onChange={(opt: SelectOption | null) => setPaymentStatusFilter(opt ? opt.value : '')}
            isClearable
            placeholder="To'lov holati"
            styles={selectStyles}
            classNamePrefix="react-select"
            className="min-w-[140px]"
          />
          <Select
            options={floorFilterOptions}
            value={floorFilter ? floorFilterOptions.find((opt) => opt.value === floorFilter) || null : null}
            onChange={(opt: SelectOption | null) => {
              setFloorFilter(opt ? opt.value : '');
              setRoomFilter('');
            }}
            isClearable
            placeholder="Qavat"
            styles={selectStyles}
            classNamePrefix="react-select"
            className="min-w-[120px]"
          />
          <Select
            options={allRoomOptions}
            value={roomFilter ? allRoomOptions.find((opt) => opt.value === roomFilter) || null : null}
            onChange={(opt: SelectOption | null) => setRoomFilter(opt ? opt.value : '')}
            isClearable
            placeholder="Xona"
            styles={selectStyles}
            classNamePrefix="react-select"
            className="min-w-[120px]"
          />

          {/* Filter reset button */}
          {(genderFilter || paymentStatusFilter || roomFilter || floorFilter) && (
            <button
              onClick={() => {
                setGenderFilter('');
                setPaymentStatusFilter('');
                setRoomFilter('');
                setFloorFilter('');
              }}
              className="px-3 py-2 text-sm bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-300 rounded-xl hover:bg-surface-200 dark:hover:bg-surface-700 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-brand-500/40"
            >
              Filterlarni tozalash
            </button>
          )}
        </div>

        {/* Filter results info */}
        {(genderFilter || paymentStatusFilter || roomFilter || floorFilter) && (
          <div className="text-sm text-surface-600 dark:text-surface-400">
            <span className="font-medium text-brand-600 dark:text-brand-400">
              {filteredStudents.length}
            </span> ta natija topildi
            {genderFilter && (
              <span className="ml-2 px-2 py-1 bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 rounded-full text-xs">
                {genderFilter === 'male' ? 'Erkak' : 'Ayol'}
              </span>
            )}
            {paymentStatusFilter && (
              <span className={`ml-2 px-2 py-1 rounded-full text-xs ${paymentStatusFilter === 'haqdor'
                ? 'bg-success-100 dark:bg-success-900/30 text-success-700 dark:text-success-300'
                : 'bg-danger-100 dark:bg-danger-900/30 text-danger-700 dark:text-danger-300'
                }`}>
                {paymentStatusFilter === 'haqdor' ? 'Haqdor' : 'Qarzdor'}
              </span>
            )}
            {floorFilter && (
              <span className="ml-2 px-2 py-1 bg-warning-100 dark:bg-warning-900/30 text-warning-700 dark:text-warning-300 rounded-full text-xs">
                {floorFilterOptions.find((opt) => opt.value === floorFilter)?.label || floorFilter}
              </span>
            )}
            {roomFilter && (
              <span className="ml-2 px-2 py-1 bg-info-100 dark:bg-info-900/30 text-info-700 dark:text-info-300 rounded-full text-xs">
                {allRoomOptions.find((opt) => opt.value === roomFilter)?.label || roomFilter}
              </span>
            )}
          </div>
        )}
      </div>

      <StudentsTable
        students={filteredStudents}
        onExport={handleExportStudents}
        onAdd={() => setShowCreateModal(true)}
      />

      <CreateStudentModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => {
          setShowCreateModal(false);
          refetch();
        }}
      />
    </div>
  );
};

export default Students;
