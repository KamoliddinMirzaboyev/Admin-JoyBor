import React, { useEffect, useState } from 'react';
import { X, Filter, User, BedDouble } from 'lucide-react';
import Select from 'react-select';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useNavigate, useLocation } from 'react-router-dom';
import FloorRooms from '../components/UI/FloorRooms';
import Skeleton from '../components/UI/Skeleton';
import EmptyState from '../components/UI/EmptyState';
import { get, post, patch, del } from '../data/api';
import { useQuery, useQueryClient } from '@tanstack/react-query';

interface Floor {
  id: number;
  name: string;
  gender: 'male' | 'female';
  AVAILABLE_floors?: number;
  AVAILABLE_rooms?: number;
}

interface Student {
  id: number;
  name: string;
  last_name: string;
}

export interface Room {
  id: number;
  name: string;
  floor: Floor;
  capacity: number;
  currentOccupancy: number;
  room_type: string;
  gender: 'male' | 'female';
  status: string;
  students: Student[];
}

interface ApiErrorResponse {
  response?: { data?: { detail?: string } };
}

const genderLabels: Record<string, { label: string; icon: React.ReactNode }> = {
  male: { label: 'Yigitlar', icon: <User className="inline w-5 h-5 mr-1" /> },
  female: { label: 'Qizlar', icon: <User className="inline w-5 h-5 mr-1" /> },
};

// Select styles for filters — brand/surface token hex values (tailwind.config.js)
const selectStyles = {
  control: (base: Record<string, unknown>, state: { isFocused: boolean }) => ({
    ...base,
    backgroundColor: '#fff',
    borderColor: state.isFocused ? '#0d9488' : '#cbd5e1',
    boxShadow: state.isFocused ? '0 0 0 2px rgba(13,148,136,0.4)' : undefined,
    minHeight: 40,
    fontSize: 14,
    ...(document.documentElement.classList.contains('dark') && {
      backgroundColor: '#1e293b',
      color: '#fff',
      borderColor: state.isFocused ? '#2dd4bf' : '#334155',
    })
  }),
  menu: (base: Record<string, unknown>) => ({
    ...base,
    backgroundColor: document.documentElement.classList.contains('dark') ? '#1e293b' : '#fff',
    color: document.documentElement.classList.contains('dark') ? '#fff' : '#0f172a',
  }),
  singleValue: (base: Record<string, unknown>) => ({
    ...base,
    color: document.documentElement.classList.contains('dark') ? '#fff' : '#0f172a',
  }),
  option: (base: Record<string, unknown>, state: { isSelected: boolean; isFocused: boolean }) => ({
    ...base,
    backgroundColor: state.isSelected
      ? (document.documentElement.classList.contains('dark') ? '#0d9488' : '#14b8a6')
      : state.isFocused
      ? (document.documentElement.classList.contains('dark') ? '#334155' : '#f1f5f9')
      : 'transparent',
    color: state.isSelected || document.documentElement.classList.contains('dark') ? '#fff' : '#0f172a',
    cursor: 'pointer',
  }),
};

const Rooms: React.FC = () => {
  const [showFloorModal, setShowFloorModal] = useState(false);
  const [showRoomModal, setShowRoomModal] = useState(false);
  const [newFloor, setNewFloor] = useState('');
  const [newFloorGender, setNewFloorGender] = useState<'male' | 'female'>('male');
  const [newRoom, setNewRoom] = useState('');
  const [newRoomGender, setNewRoomGender] = useState<'male' | 'female'>('male');
  const [selectedFloor, setSelectedFloor] = useState('');

  // Filter states
  const [roomStatusFilter, setRoomStatusFilter] = useState('');
  const [genderFilter, setGenderFilter] = useState('');
  const [newRoomCapacity, setNewRoomCapacity] = useState('');
  const [addingRoom, setAddingRoom] = useState(false);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [addingFloor, setAddingFloor] = useState(false);
  const [deleteFloorId, setDeleteFloorId] = useState<number | null>(null);
  const [deletingFloor, setDeletingFloor] = useState(false);
  const [editFloor, setEditFloor] = useState<Floor | null>(null);
  const [editFloorName, setEditFloorName] = useState('');
  const [editFloorGender, setEditFloorGender] = useState<'male' | 'female'>('male');
  const [editingFloor, setEditingFloor] = useState(false);
  const [editRoom, setEditRoom] = useState<Room | null>(null);
  const [editRoomName, setEditRoomName] = useState('');
  const [editRoomGender, setEditRoomGender] = useState<'male' | 'female'>('male');
  const [editRoomCapacity, setEditRoomCapacity] = useState('');
  const [editRoomFloor, setEditRoomFloor] = useState<number | null>(null);
  const [editingRoom, setEditingRoom] = useState(false);
  const [deleteRoom, setDeleteRoom] = useState<Room | null>(null);
  const [deletingRoom, setDeletingRoom] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();

  // API dan floors ma'lumotlarini olish
  const {
    data: floors = [],
    isLoading: floorsLoading,
    error: floorsError,
    refetch: refetchFloors
  } = useQuery<Floor[]>({
    queryKey: ['floors'],
    queryFn: async () => {
      const data = await get('/floors/');
      // API returns paginated data with results array
      if (data && data.results && Array.isArray(data.results)) {
        return data.results;
      }
      // Fallback for non-paginated response
      return Array.isArray(data) ? data : [];
    },
    staleTime: 0, // Always fetch fresh data
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  const typedFloors: Floor[] = Array.isArray(floors) ? (floors as Floor[]) : [];

  // Qavat yaratishda backend `dormitory` maydonini talab qiladi (POST /floors/)
  const { data: myDormitory } = useQuery<{ id: number } | null>({
    queryKey: ['my-dormitory'],
    queryFn: async () => (await get('/admin/my-dormitory/')) as { id: number },
    staleTime: 1000 * 60 * 10,
  });

  useEffect(() => {
    if (location.state && (location.state as { openAddRoomModal?: boolean })?.openAddRoomModal) {
      setShowRoomModal(true);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // Add new floor
  const handleAddFloor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (addingFloor) return; // Prevent double submit

    let floorStr = newFloor.trim();

    // Validation
    if (!floorStr) {
      toast.error('Qavat raqamini kiriting!');
      return;
    }

    // Remove all instances of 'qavat' (with or without dash or space)
    floorStr = floorStr.replace(/[- ]*qavat/gi, '');
    // Extract only the number part
    const match = floorStr.match(/\d+/);
    if (!match) {
      toast.error('Qavat raqami faqat raqamlardan iborat bo\'lishi kerak!');
      return;
    }
    const floorNumber = match[0];

    // Validate floor number range
    const floorNum = parseInt(floorNumber);
    if (floorNum <= 0) {
      toast.error('Qavat raqami 0 dan katta bo\'lishi kerak!');
      return;
    }
    if (floorNum > 20) {
      toast.error('Qavat raqami 20 dan oshmasligi kerak!');
      return;
    }

    floorStr = `${floorNumber}-qavat`;

    if (!myDormitory?.id) {
      toast.error('Yotoqxona ma\'lumoti hali yuklanmoqda, birozdan keyin urinib ko\'ring.');
      return;
    }

    setAddingFloor(true);
    try {
      // Check if floor already exists
      const existingFloor = typedFloors.find(f => f.name === floorStr);
      if (existingFloor) {
        toast.error('Bu qavat allaqachon mavjud!');
        setAddingFloor(false);
        return;
      }

      await post('/floors/', {
        name: floorStr,
        gender: newFloorGender,
        dormitory: myDormitory.id,
      });

      toast.success('Qavat muvaffaqiyatli qo\'shildi!');
      // Refresh floors from API
      setShowFloorModal(false);
      setNewFloor('');
      setNewFloorGender('male');
      // Invalidate and refetch
      await queryClient.invalidateQueries({ queryKey: ['floors'] });
      await refetchFloors();
    } catch (error: unknown) {
      const err = error as ApiErrorResponse;
      toast.error(err.response?.data?.detail || 'Qavat qo\'shishda xatolik!');
    } finally {
      setAddingFloor(false);
    }
  };

  // Add new room
  const handleAddRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    let roomStr = newRoom.trim();
    const capacity = parseInt(newRoomCapacity);

    // Validation
    if (!selectedFloor) {
      toast.error('Qavat tanlang!');
      return;
    }
    if (!roomStr) {
      toast.error('Xona raqamini kiriting!');
      return;
    }
    if (isNaN(capacity) || capacity <= 0) {
      toast.error('Xona sig\'imini to\'g\'ri kiriting!');
      return;
    }
    if (capacity > 10) {
      toast.error('Xona sig\'imi 10 dan oshmasligi kerak!');
      return;
    }

    // Remove all instances of 'xona' (with or without dash or space)
    roomStr = roomStr.replace(/[- ]*xona/gi, '');
    // Extract only the number part
    const match = roomStr.match(/\d+/);
    if (!match) {
      toast.error('Xona raqami faqat raqamlardan iborat bo\'lishi kerak!');
      return;
    }
    const roomNumber = match[0];
    roomStr = `${roomNumber}-xona`;

    setAddingRoom(true);
    try {
      const floorObj = typedFloors.find(f => f.name === selectedFloor);
      if (!floorObj) {
        toast.error('Qavat topilmadi!');
        setAddingRoom(false);
        return;
      }

      await post('/rooms/', {
        name: roomStr,
        capacity: capacity,
        floor: floorObj.id,
        gender: newRoomGender,
      });

      toast.success('Xona muvaffaqiyatli qo\'shildi!');
      setNewRoom('');
      setSelectedFloor('');
      setNewRoomCapacity('');
      setShowRoomModal(false);
      // Refresh rooms and floors
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      queryClient.invalidateQueries({ queryKey: ['floors'] });
    } catch {
      toast.error('Xona qo\'shishda xatolik!');
    } finally {
      setAddingRoom(false);
    }
  };

  // Edit floor handler
  const handleEditFloor = (floor: Floor) => {
    setEditFloor(floor);
    setEditFloorName(floor.name);
    setEditFloorGender(floor.gender);
    setMenuOpen(null);
  };

  const handleEditFloorSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editFloor) return;
    setEditingFloor(true);
    try {
      await patch(`/floors/${editFloor.id}/`, {
        name: editFloorName,
        gender: editFloorGender
      });

      toast.success('Qavat muvaffaqiyatli tahrirlandi!');
      setEditFloor(null);
      // Invalidate and refetch
      await queryClient.invalidateQueries({ queryKey: ['floors'] });
      await refetchFloors();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Qavatni tahrirlashda xatolik!';
      toast.error(errorMessage);
    } finally {
      setEditingFloor(false);
    }
  };

  // Delete floor handler
  const handleDeleteFloor = (floor: Floor) => {
    setDeleteFloorId(floor.id);
    setMenuOpen(null);
  };

  const confirmDeleteFloor = async () => {
    if (!deleteFloorId) return;
    setDeletingFloor(true);
    try {
      await del(`/floors/${deleteFloorId}/`);

      toast.success("Qavat muvaffaqiyatli o'chirildi!");
      setDeleteFloorId(null);
      // Invalidate and refetch
      await queryClient.invalidateQueries({ queryKey: ['floors'] });
      await refetchFloors();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Qavatni o'chirishda xatolik!";
      toast.error(errorMessage);
    } finally {
      setDeletingFloor(false);
    }
  };

  // Edit room handler
  const handleEditRoom = (room: Room) => {
    setEditRoom(room);
    setEditRoomName(room.name);
    setEditRoomCapacity(room.capacity.toString());
    setEditRoomFloor(room.floor.id);
    setEditRoomGender(room.gender || 'male');
  };

  const handleEditRoomSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editRoom) return;
    setEditingRoom(true);
    try {
      await patch(`/rooms/${editRoom.id}/`, {
        name: editRoomName,
        floor: editRoomFloor,
        capacity: Number(editRoomCapacity),
        gender: editRoomGender
      });

      toast.success('Xona muvaffaqiyatli tahrirlandi!');
      setEditRoom(null);
      // Refresh rooms and floors
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      queryClient.invalidateQueries({ queryKey: ['floors'] });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Xonani tahrirlashda xatolik!';
      toast.error(errorMessage);
    } finally {
      setEditingRoom(false);
    }
  };

  const confirmDeleteRoom = async () => {
    if (!deleteRoom) return;
    setDeletingRoom(true);
    try {
      await del(`/rooms/${deleteRoom.id}/`);

      toast.success('Xona muvaffaqiyatli o\'chirildi!');
      setDeleteRoom(null);
      // Refresh rooms and floors
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      queryClient.invalidateQueries({ queryKey: ['floors'] });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Xonani o\'chirishda xatolik!';
      toast.error(errorMessage);
    } finally {
      setDeletingRoom(false);
    }
  };

  const handleDeleteRoom = (room: Room) => {
    setDeleteRoom(room);
  };

  if (floorsError) {
    return (
      <div className="text-center py-10 text-danger-600 dark:text-danger-400">
        Ma'lumotlarni yuklashda xatolik yuz berdi.
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 max-w-6xl mx-auto">
      <div className="bg-white dark:bg-surface-900 rounded-2xl p-6 shadow-sm border border-surface-200 dark:border-surface-800">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
          <h1 className="text-2xl font-bold text-surface-900 dark:text-white">Yotoqxona</h1>
          <div className="flex gap-2">
            <button
              className="bg-brand-600 hover:bg-brand-700 text-white font-semibold px-4 py-2 rounded-xl transition-colors duration-150"
              onClick={() => setShowFloorModal(true)}
            >
              + Qavat qo'shish
            </button>
            <button
              className="bg-brand-600 hover:bg-brand-700 text-white font-semibold px-4 py-2 rounded-xl transition-colors duration-150"
              onClick={() => setShowRoomModal(true)}
            >
              + Xona qo'shish
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-6 p-4 bg-surface-50 dark:bg-surface-800 rounded-xl">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-surface-500" />
            <span className="text-sm font-medium text-surface-700 dark:text-surface-300">Filterlar:</span>
          </div>

          <div className="flex flex-wrap gap-3">
            <div className="min-w-[150px]">
              <Select
                options={[
                  { value: 'empty', label: 'Bo\'sh xonalar' },
                  { value: 'occupied', label: 'To\'lmagan xonalar' },
                  { value: 'full', label: 'To\'lgan xonalar' },
                ]}
                value={roomStatusFilter ? { value: roomStatusFilter, label:
                  roomStatusFilter === 'empty' ? 'Bo\'sh xonalar' :
                  roomStatusFilter === 'occupied' ? 'To\'lmagan xonalar' : 'To\'lgan xonalar'
                } : null}
                onChange={(opt) => setRoomStatusFilter(opt ? opt.value : '')}
                isClearable
                placeholder="Xona holati"
                styles={selectStyles}
                classNamePrefix="react-select"
              />
            </div>

            <div className="min-w-[120px]">
              <Select
                options={[
                  { value: 'male', label: 'Yigitlar' },
                  { value: 'female', label: 'Qizlar' },
                ]}
                value={genderFilter ? { value: genderFilter, label: genderFilter === 'male' ? 'Yigitlar' : 'Qizlar' } : null}
                onChange={(opt) => setGenderFilter(opt ? opt.value : '')}
                isClearable
                placeholder="Jinsi"
                styles={selectStyles}
                classNamePrefix="react-select"
              />
            </div>
          </div>
        </div>
        <div className="space-y-6">
          {floorsLoading ? (
            <Skeleton className="h-40 w-full rounded-2xl" count={3} />
          ) : typedFloors.length > 0 ? (
            typedFloors.map((floor) => (
              <FloorRooms
                key={floor.id}
                floor={floor}
                genderLabels={genderLabels}
                roomStatusFilter={roomStatusFilter}
                genderFilter={genderFilter}
                menuOpen={menuOpen}
                setMenuOpen={setMenuOpen}
                handleEditFloor={handleEditFloor}
                handleDeleteFloor={handleDeleteFloor}
                handleEditRoom={handleEditRoom}
                handleDeleteRoom={handleDeleteRoom}
                navigate={navigate}
              />
            ))
          ) : (
            <EmptyState
              icon={BedDouble}
              title="Qavatlar mavjud emas"
              description="Yotoqxonaga birinchi qavatni qo'shing"
              action={{ label: "+ Qavat qo'shish", onClick: () => setShowFloorModal(true) }}
            />
          )}
        </div>
      </div>

      {/* Qavat qo'shish modal */}
      <AnimatePresence>
        {showFloorModal && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
            onClick={() => setShowFloorModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 40 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="bg-white dark:bg-surface-900 rounded-2xl shadow-sm border border-surface-200 dark:border-surface-800 w-full max-w-sm p-6 relative"
              onClick={e => e.stopPropagation()}
            >
              <button
                className="absolute top-3 right-3 text-surface-400 hover:text-surface-700 dark:hover:text-surface-200 p-1 rounded transition-colors duration-150"
                onClick={() => setShowFloorModal(false)}
              >
                <X size={22} />
              </button>
              <h2 className="text-xl font-bold text-surface-900 dark:text-white mb-4">Yangi qavat qo'shish</h2>
              <form onSubmit={handleAddFloor} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">Qavat raqami</label>
                  <input
                    type="text"
                    value={newFloor}
                    onChange={e => setNewFloor(e.target.value)}
                    placeholder="Masalan: 1, 2, 3..."
                    className="w-full px-3 py-2 border border-surface-300 dark:border-surface-700 rounded-xl bg-white dark:bg-surface-800 text-surface-900 dark:text-white focus:ring-2 focus:ring-brand-500/40 focus:border-brand-600 outline-none transition-colors duration-150"
                    required
                  />
                  <p className="text-xs text-surface-500 dark:text-surface-400 mt-1">Faqat raqam kiriting, "qavat" so'zi avtomatik qo'shiladi</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">Qavat jinsi</label>
                  <div className="flex gap-4">
                    {(['male', 'female'] as const).map(g => (
                      <label
                        key={g}
                        className={`group flex flex-col items-center justify-center cursor-pointer px-4 py-3 rounded-xl border-2 transition-colors duration-150 select-none
                          ${newFloorGender === g
                            ? 'border-brand-600 bg-brand-50 dark:bg-brand-900/20'
                            : 'border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 hover:border-brand-400 dark:hover:border-brand-400'}
                        `}
                      >
                        <input
                          type="radio"
                          name="floor-gender"
                          checked={newFloorGender === g}
                          onChange={() => setNewFloorGender(g)}
                          className="sr-only"
                        />
                        <span className={`flex items-center justify-center w-10 h-10 rounded-full mb-2
                          ${newFloorGender === g
                            ? 'bg-brand-600 text-white'
                            : 'bg-surface-200 dark:bg-surface-700 text-surface-500'}
                          transition-colors duration-150
                        `}>
                          {genderLabels[g]?.icon}
                        </span>
                        <span className={`text-sm font-semibold
                          ${newFloorGender === g
                            ? 'text-brand-700 dark:text-brand-300'
                            : 'text-surface-700 dark:text-surface-200'}
                          transition-colors duration-150
                        `}>
                          {genderLabels[g]?.label}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowFloorModal(false)}
                    className="px-4 py-2 rounded-xl border border-surface-300 dark:border-surface-600 bg-surface-100 dark:bg-surface-800 text-surface-700 dark:text-surface-200 hover:bg-surface-200 dark:hover:bg-surface-700 transition-colors duration-150"
                  >
                    Bekor qilish
                  </button>
                  <button
                    type="submit"
                    disabled={addingFloor}
                    className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold transition-colors duration-150 disabled:opacity-60"
                  >
                    {addingFloor ? 'Qo\'shilmoqda...' : 'Qo\'shish'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Xona qo'shish modal */}
      <AnimatePresence>
        {showRoomModal && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
            onClick={() => setShowRoomModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 40 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="bg-white dark:bg-surface-900 rounded-2xl shadow-sm border border-surface-200 dark:border-surface-800 w-full max-w-sm p-6 relative"
              onClick={e => e.stopPropagation()}
            >
              <button
                className="absolute top-3 right-3 text-surface-400 hover:text-surface-700 dark:hover:text-surface-200 p-1 rounded transition-colors duration-150"
                onClick={() => setShowRoomModal(false)}
              >
                <X size={22} />
              </button>
              <h2 className="text-xl font-bold text-surface-900 dark:text-white mb-4">Yangi xona qo'shish</h2>
              <form onSubmit={handleAddRoom} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">Qavat tanlang</label>
                  <select
                    value={selectedFloor}
                    onChange={e => {
                      const floorName = e.target.value;
                      setSelectedFloor(floorName);
                      const floor = typedFloors.find(f => f.name === floorName);
                      if (floor) {
                        setNewRoomGender(floor.gender);
                      }
                    }}
                    className="w-full px-3 py-2 border border-surface-300 dark:border-surface-700 rounded-xl bg-white dark:bg-surface-800 text-surface-900 dark:text-white focus:ring-2 focus:ring-brand-500/40 focus:border-brand-600 outline-none transition-colors duration-150"
                    required
                  >
                    <option value="">Qavat tanlang</option>
                    {typedFloors.map(floor => (
                      <option key={floor.id} value={floor.name}>
                        {floor.name} ({floor.gender === 'female' ? 'Qizlar' : 'Yigitlar'})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">Xona raqami</label>
                  <input
                    type="number"
                    value={newRoom}
                    onChange={e => setNewRoom(e.target.value)}
                    className="w-full px-3 py-2 border border-surface-300 dark:border-surface-700 rounded-xl bg-white dark:bg-surface-800 text-surface-900 dark:text-white focus:ring-2 focus:ring-brand-500/40 focus:border-brand-600 outline-none transition-colors duration-150"
                    placeholder="Masalan: 101, 102, 201..."
                    min="1"
                    required
                  />
                  <p className="text-xs text-surface-500 dark:text-surface-400 mt-1">Faqat raqam kiriting, "xona" so'zi avtomatik qo'shiladi</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">Xona jinsi</label>
                  <div className="flex gap-4">
                    {(['male', 'female'] as const).map(g => (
                      <label
                        key={g}
                        className={`group flex flex-col items-center justify-center cursor-pointer px-4 py-3 rounded-xl border-2 transition-colors duration-150 select-none
                          ${newRoomGender === g
                            ? 'border-brand-600 bg-brand-50 dark:bg-brand-900/20'
                            : 'border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 hover:border-brand-400 dark:hover:border-brand-400'}
                        `}
                      >
                        <input
                          type="radio"
                          name="room-gender"
                          checked={newRoomGender === g}
                          onChange={() => setNewRoomGender(g)}
                          className="sr-only"
                        />
                        <span className={`flex items-center justify-center w-10 h-10 rounded-full mb-2
                          ${newRoomGender === g
                            ? 'bg-brand-600 text-white'
                            : 'bg-surface-200 dark:bg-surface-700 text-surface-500'}
                          transition-colors duration-150
                        `}>
                          {genderLabels[g]?.icon}
                        </span>
                        <span className={`text-sm font-semibold
                          ${newRoomGender === g
                            ? 'text-brand-700 dark:text-brand-300'
                            : 'text-surface-700 dark:text-surface-200'}
                          transition-colors duration-150
                        `}>
                          {genderLabels[g]?.label}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">Xona sigimi</label>
                  <input
                    type="number"
                    value={newRoomCapacity}
                    onChange={e => setNewRoomCapacity(e.target.value)}
                    className="w-full px-3 py-2 border border-surface-300 dark:border-surface-700 rounded-xl bg-white dark:bg-surface-800 text-surface-900 dark:text-white focus:ring-2 focus:ring-brand-500/40 focus:border-brand-600 outline-none transition-colors duration-150"
                    placeholder="Masalan: 3, 5, 8..."
                    min="1"
                    max="20"
                    required
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowRoomModal(false)}
                    className="px-4 py-2 rounded-xl border border-surface-300 dark:border-surface-600 bg-surface-100 dark:bg-surface-800 text-surface-700 dark:text-surface-200 hover:bg-surface-200 dark:hover:bg-surface-700 transition-colors duration-150"
                  >
                    Bekor qilish
                  </button>
                  <button
                    type="submit"
                    disabled={addingRoom}
                    className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold transition-colors duration-150 disabled:opacity-60"
                  >
                    {addingRoom ? 'Qo\'shilmoqda...' : 'Qo\'shish'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Qavatni tahrirlash modali */}
      <AnimatePresence>
        {editFloor && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setEditFloor(null)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 40 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="bg-white dark:bg-surface-900 rounded-2xl shadow-sm border border-surface-200 dark:border-surface-800 w-full max-w-sm p-6 relative"
              onClick={e => e.stopPropagation()}
            >
              <h2 className="text-xl font-bold text-surface-900 dark:text-white mb-4">Qavatni tahrirlash</h2>
              <form onSubmit={handleEditFloorSave} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">Qavat nomi yoki raqami</label>
                  <input
                    type="text"
                    value={editFloorName}
                    onChange={e => setEditFloorName(e.target.value)}
                    className="w-full px-3 py-2 border border-surface-300 dark:border-surface-700 rounded-xl bg-white dark:bg-surface-800 text-surface-900 dark:text-white focus:ring-2 focus:ring-brand-500/40 focus:border-brand-600 outline-none transition-colors duration-150"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">Qavat jinsi</label>
                  <div className="flex gap-4">
                    {(['male', 'female'] as const).map(g => (
                      <label
                        key={g}
                        className={`group flex flex-col items-center justify-center cursor-pointer px-4 py-3 rounded-xl border-2 transition-colors duration-150 select-none
                          ${editFloorGender === g
                            ? 'border-brand-600 bg-brand-50 dark:bg-brand-900/20'
                            : 'border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 hover:border-brand-400 dark:hover:border-brand-400'}
                        `}
                      >
                        <input
                          type="radio"
                          name="edit-floor-gender"
                          checked={editFloorGender === g}
                          onChange={() => setEditFloorGender(g)}
                          className="sr-only"
                        />
                        <span className={`flex items-center justify-center w-10 h-10 rounded-full mb-2
                          ${editFloorGender === g
                            ? 'bg-brand-600 text-white'
                            : 'bg-surface-200 dark:bg-surface-700 text-surface-500'}
                          transition-colors duration-150
                        `}>
                          {genderLabels[g]?.icon}
                        </span>
                        <span className={`text-sm font-semibold
                          ${editFloorGender === g
                            ? 'text-brand-700 dark:text-brand-300'
                            : 'text-surface-700 dark:text-surface-200'}
                          transition-colors duration-150
                        `}>
                          {genderLabels[g]?.label}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setEditFloor(null)}
                    className="px-4 py-2 rounded-xl border border-surface-300 dark:border-surface-600 bg-surface-100 dark:bg-surface-800 text-surface-700 dark:text-surface-200 hover:bg-surface-200 dark:hover:bg-surface-700 transition-colors duration-150"
                    disabled={editingFloor}
                  >
                    Bekor qilish
                  </button>
                  <button
                    type="submit"
                    disabled={editingFloor}
                    className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold transition-colors duration-150 disabled:opacity-60"
                  >
                    {editingFloor ? "Saqlanmoqda..." : "Saqlash"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Qavatni o'chirishni tasdiqlash modali */}
      <AnimatePresence>
        {deleteFloorId !== null && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setDeleteFloorId(null)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 40 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="bg-white dark:bg-surface-900 rounded-2xl shadow-sm border border-surface-200 dark:border-surface-800 w-full max-w-sm p-6 relative"
              onClick={e => e.stopPropagation()}
            >
              <h2 className="text-xl font-bold text-surface-900 dark:text-white mb-4">Qavatni o'chirish</h2>
              <p className="mb-6 text-surface-700 dark:text-surface-300">Rostdan ham ushbu qavatni o'chirmoqchimisiz?</p>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDeleteFloorId(null)}
                  className="px-4 py-2 rounded-xl border border-surface-300 dark:border-surface-600 bg-surface-100 dark:bg-surface-800 text-surface-700 dark:text-surface-200 hover:bg-surface-200 dark:hover:bg-surface-700 transition-colors duration-150"
                  disabled={deletingFloor}
                >
                  Bekor qilish
                </button>
                <button
                  type="button"
                  onClick={confirmDeleteFloor}
                  disabled={deletingFloor}
                  className="px-4 py-2 rounded-xl bg-danger-600 hover:bg-danger-700 text-white font-semibold transition-colors duration-150 disabled:opacity-60"
                >
                  {deletingFloor ? "O'chirilmoqda..." : "O'chirish"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Xonani tahrirlash modali */}
      <AnimatePresence>
        {editRoom && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setEditRoom(null)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 40 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="bg-white dark:bg-surface-900 rounded-2xl shadow-sm border border-surface-200 dark:border-surface-800 w-full max-w-sm p-6 relative"
              onClick={e => e.stopPropagation()}
            >
              <h2 className="text-xl font-bold text-surface-900 dark:text-white mb-4">Xonani tahrirlash</h2>
              <form onSubmit={handleEditRoomSave} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">Xona nomi</label>
                  <input
                    type="text"
                    value={editRoomName}
                    onChange={e => setEditRoomName(e.target.value)}
                    className="w-full px-3 py-2 border border-surface-300 dark:border-surface-700 rounded-xl bg-white dark:bg-surface-800 text-surface-900 dark:text-white focus:ring-2 focus:ring-brand-500/40 focus:border-brand-600 outline-none transition-colors duration-150"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">Qavat</label>
                  <select
                    value={editRoomFloor ?? ''}
                    onChange={e => {
                      const floorId = Number(e.target.value);
                      setEditRoomFloor(floorId);
                      const floor = typedFloors.find(f => f.id === floorId);
                      if (floor) {
                        setEditRoomGender(floor.gender);
                      }
                    }}
                    className="w-full px-3 py-2 border border-surface-300 dark:border-surface-700 rounded-xl bg-white dark:bg-surface-800 text-surface-900 dark:text-white focus:ring-2 focus:ring-brand-500/40 focus:border-brand-600 outline-none transition-colors duration-150"
                    required
                  >
                    <option value="">Qavat tanlang</option>
                    {typedFloors.map(floor => (
                      <option key={floor.id} value={floor.id}>{floor.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">Xona jinsi</label>
                  <div className="flex gap-4">
                    {(['male', 'female'] as const).map(g => (
                      <label
                        key={g}
                        className={`group flex flex-col items-center justify-center cursor-pointer px-4 py-3 rounded-xl border-2 transition-colors duration-150 select-none
                          ${editRoomGender === g
                            ? 'border-brand-600 bg-brand-50 dark:bg-brand-900/20'
                            : 'border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 hover:border-brand-400 dark:hover:border-brand-400'}
                        `}
                      >
                        <input
                          type="radio"
                          name="edit-room-gender"
                          checked={editRoomGender === g}
                          onChange={() => setEditRoomGender(g)}
                          className="sr-only"
                        />
                        <span className={`flex items-center justify-center w-10 h-10 rounded-full mb-2
                          ${editRoomGender === g
                            ? 'bg-brand-600 text-white'
                            : 'bg-surface-200 dark:bg-surface-700 text-surface-500'}
                          transition-colors duration-150
                        `}>
                          {genderLabels[g]?.icon}
                        </span>
                        <span className={`text-sm font-semibold
                          ${editRoomGender === g
                            ? 'text-brand-700 dark:text-brand-300'
                            : 'text-surface-700 dark:text-surface-200'}
                          transition-colors duration-150
                        `}>
                          {genderLabels[g]?.label}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">Xona sig'imi</label>
                  <input
                    type="number"
                    value={editRoomCapacity}
                    onChange={e => setEditRoomCapacity(e.target.value)}
                    className="w-full px-3 py-2 border border-surface-300 dark:border-surface-700 rounded-xl bg-white dark:bg-surface-800 text-surface-900 dark:text-white focus:ring-2 focus:ring-brand-500/40 focus:border-brand-600 outline-none transition-colors duration-150"
                    min="1"
                    max="20"
                    required
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setEditRoom(null)}
                    className="px-4 py-2 rounded-xl border border-surface-300 dark:border-surface-600 bg-surface-100 dark:bg-surface-800 text-surface-700 dark:text-surface-200 hover:bg-surface-200 dark:hover:bg-surface-700 transition-colors duration-150"
                    disabled={editingRoom}
                  >
                    Bekor qilish
                  </button>
                  <button
                    type="submit"
                    disabled={editingRoom}
                    className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold transition-colors duration-150 disabled:opacity-60"
                  >
                    {editingRoom ? "Saqlanmoqda..." : "Saqlash"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Xonani o'chirishni tasdiqlash modali */}
      <AnimatePresence>
        {deleteRoom && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setDeleteRoom(null)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 40 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="bg-white dark:bg-surface-900 rounded-2xl shadow-sm border border-surface-200 dark:border-surface-800 w-full max-w-sm p-6 relative"
              onClick={e => e.stopPropagation()}
            >
              <h2 className="text-xl font-bold text-surface-900 dark:text-white mb-4">Xonani o'chirish</h2>
              <p className="mb-6 text-surface-700 dark:text-surface-300">Rostdan ham ushbu xonani o'chirmoqchimisiz?</p>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDeleteRoom(null)}
                  className="px-4 py-2 rounded-xl border border-surface-300 dark:border-surface-600 bg-surface-100 dark:bg-surface-800 text-surface-700 dark:text-surface-200 hover:bg-surface-200 dark:hover:bg-surface-700 transition-colors duration-150"
                  disabled={deletingRoom}
                >
                  Bekor qilish
                </button>
                <button
                  type="button"
                  onClick={confirmDeleteRoom}
                  disabled={deletingRoom}
                  className="px-4 py-2 rounded-xl bg-danger-600 hover:bg-danger-700 text-white font-semibold transition-colors duration-150 disabled:opacity-60"
                >
                  {deletingRoom ? "O'chirilmoqda..." : "O'chirish"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Rooms;
