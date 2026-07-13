import React, { useState } from "react";
import { useParams, Link } from "react-router-dom";
import BackButton from '../components/UI/BackButton';
import Skeleton from '../components/UI/Skeleton';
import EmptyState from '../components/UI/EmptyState';
import api, { post, patch, del } from '../data/api';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { X, MoreVertical, Filter, UserCog, Eye, EyeOff, User, BedDouble } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { toast } from 'sonner';

type ApiError = Error & { response?: { data?: { detail?: string; message?: string }; status?: number } };

const CARD_HEIGHT = 'h-44';

// Room status -> semantic token mapping (shared vocabulary with FloorRooms.tsx):
// empty (bo'sh) = success, partial (to'lmagan) = warning, full (to'lgan) = brand
const roomStatusText: Record<'empty' | 'partial' | 'full', string> = {
  empty: 'text-success-600 dark:text-success-400',
  partial: 'text-warning-600 dark:text-warning-400',
  full: 'text-brand-600 dark:text-brand-400',
};
const roomStatusBar: Record<'empty' | 'partial' | 'full', string> = {
  empty: 'bg-success-500',
  partial: 'bg-warning-500',
  full: 'bg-brand-600',
};
function getRoomStatus(occupancy: number, capacity: number): 'empty' | 'partial' | 'full' {
  if (occupancy === 0) return 'empty';
  if (occupancy >= capacity) return 'full';
  return 'partial';
}

const genderLabels: Record<string, { label: string; icon: React.ReactNode }> = {
  male: { label: 'Yigitlar', icon: <User className="inline w-5 h-5 mr-1" /> },
  female: { label: 'Qizlar', icon: <User className="inline w-5 h-5 mr-1" /> },
};

const genderBadgeColors: Record<'male' | 'female', string> = {
  male: 'bg-brand-100 text-brand-700 dark:bg-brand-900/20 dark:text-brand-300',
  female: 'bg-info-100 text-info-700 dark:bg-info-900/20 dark:text-info-300',
};

function getShortName(fullName: string) {
  const [first, ...rest] = fullName.split(' ');
  const last = rest.length > 0 ? rest[rest.length - 1] : '';
  return `${first[0]}. ${last}`;
}

interface Floor {
  id: number;
  name: string;
  gender: 'male' | 'female';
}

interface Student {
  id: number;
  name: string;
  last_name: string;
  fullName?: string;
}

interface Room {
  id: number;
  name: string;
  capacity: number;
  room_type: string;
  gender: 'male' | 'female';
  students: Student[];
}

const FloorDetail: React.FC = () => {
  const { floorId } = useParams();
  const queryClient = useQueryClient();
  const [showRoomModal, setShowRoomModal] = useState(false);
  const [newRoom, setNewRoom] = useState('');
  const [newRoomGender, setNewRoomGender] = useState<'male' | 'female'>('male');
  const [newRoomCapacity, setNewRoomCapacity] = useState('');
  const [adding, setAdding] = useState(false);
  // Add state for room actions
  // Replace global roomActionRoom/showRoomActionModal with a state for openRoomMenuId
  const [openRoomMenuId, setOpenRoomMenuId] = useState<number | null>(null);
  const [editRoomModal, setEditRoomModal] = useState<Room | null>(null);
  const [editRoomName, setEditRoomName] = useState('');
  const [editRoomGender, setEditRoomGender] = useState<'male' | 'female'>('male');
  const [editRoomCapacity, setEditRoomCapacity] = useState('');
  const [editingRoom, setEditingRoom] = useState(false);
  const [deleteRoomModal, setDeleteRoomModal] = useState<Room | null>(null);
  const [deletingRoom, setDeletingRoom] = useState(false);

  // Floor Leader states
  const [showLeaderModal, setShowLeaderModal] = useState(false);
  const [floorLeader, setFloorLeader] = useState<{ id: number; user_info: { username: string; email: string }; floor_info: { name: string } } | null>(null);
  const [leaderForm, setLeaderForm] = useState({
    username: '',
    password: '',
    first_name: '',
    last_name: '',
    phone: '',
  });
  const [addingLeader, setAddingLeader] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Close room menu on outside click or Esc
  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (openRoomMenuId !== null) {
        const target = e.target as HTMLElement;
        if (!target.closest('.room-menu') && !target.closest('.room-menu-button')) {
          setOpenRoomMenuId(null);
        }
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && openRoomMenuId !== null) setOpenRoomMenuId(null);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [openRoomMenuId]);

  // Filter states
  const [roomStatusFilter, setRoomStatusFilter] = useState('');

  // React Query bilan floors va rooms ma'lumotlarini olish
  const {
    data: floorsData,
    isLoading: floorsLoading,
    error: floorsError
  } = useQuery({
    queryKey: ['floors'],
    queryFn: () => api.getFloors(),
    staleTime: 1000 * 60 * 5,
  });

  const floors = Array.isArray(floorsData) ? floorsData : (floorsData?.results || []);
  const floor = floors.find((f: Floor) => String(f.id) === String(floorId)) as Floor | undefined;

  // Fetch floor leader
  const fetchFloorLeader = async () => {
    if (!floorId) return;
    try {
      const leaders = await api.getFloorLeaders();
      const leadersArray = leaders.results || leaders;
      const leader = leadersArray.find((l: { floor: number }) => String(l.floor) === String(floorId));
      setFloorLeader(leader || null);
    } catch {
      // Sardor topilmadi — jim o'tkazamiz
    }
  };

  React.useEffect(() => {
    fetchFloorLeader();
  }, [floorId]);

  const {
    data: roomsData,
    isLoading: roomsLoading,
    error: roomsError,
    refetch: refetchRooms
  } = useQuery({
    queryKey: ['rooms', floor?.id],
    queryFn: async () => {
      if (!floor) return [];
      const response = await api.getRooms(floor.id);
      // API returns paginated data with results array
      if (response && response.results && Array.isArray(response.results)) {
        return response.results;
      }
      // Fallback for non-paginated response
      return Array.isArray(response) ? response : [];
    },
    enabled: !!floor,
    staleTime: 1000 * 60 * 5,
  });

  const rooms = Array.isArray(roomsData) ? roomsData : [];

  const roomStats = React.useMemo(() => {
    const stats = { total: rooms.length, empty: 0, partial: 0, full: 0 } as { total: number; empty: number; partial: number; full: number };
    rooms.forEach((room: Room) => {
      const students = room.students || [];
      const occupancy = students.length;
      if (occupancy === 0) stats.empty += 1;
      else if (occupancy >= room.capacity) stats.full += 1;
      else stats.partial += 1;
    });
    return stats;
  }, [rooms]);

  const sortedRooms = React.useMemo(() => {
    const roomsCopy = Array.isArray(rooms) ? [...rooms] : [];
    return roomsCopy.sort((a, b) => {
      const aNum = parseInt(a.name.replace(/\D/g, '')) || 0;
      const bNum = parseInt(b.name.replace(/\D/g, '')) || 0;
      return aNum - bNum;
    });
  }, [rooms]);

  const handleAddRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoom.trim() || !newRoomCapacity.trim() || !floor) return;
    setAdding(true);

    const body = {
      name: `${newRoom.trim()}-xona`,
      floor: floor.id,
      capacity: Number(newRoomCapacity),
      room_type: '',
      gender: newRoomGender,
      status: 'EMPTY',
    };

    try {
      // Try /room/create/ first, if it fails with 404/405, try /rooms/
      try {
        await post('/room/create/', body);
      } catch (err) {
        const status = (err as ApiError)?.response?.status;
        if (status === 405 || status === 404) {
          await post('/rooms/', body);
        } else {
          throw err;
        }
      }

      setShowRoomModal(false);
      setNewRoom('');
      setNewRoomCapacity('');
      toast.success('Xona muvaffaqiyatli qo\'shildi!');

      // Cache ni yangilash - barcha bog'liq ma'lumotlarni yangilash
      queryClient.invalidateQueries({ queryKey: ['floors'] });
      queryClient.invalidateQueries({ queryKey: ['floor', floorId] });
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      queryClient.invalidateQueries({ queryKey: ['students'] });

      // Har bir qavat uchun xonalarni yangilash
      queryClient.invalidateQueries({ queryKey: ['rooms', parseInt(floorId || '0')] });

      // Global cache ni tozalash
      queryClient.refetchQueries({ queryKey: ['rooms'] });

      // Refresh rooms
      refetchRooms();
    } catch (error) {
      const err = error as ApiError;
      toast.error(err.response?.data?.detail || err.response?.data?.message || 'Xona qo\'shishda xatolik!');
    } finally {
      setAdding(false);
    }
  };

  // Floor Leader handlers
  const handleAddLeader = async () => {
    if (!leaderForm.username || !leaderForm.password || !floorId || !floor) {
      toast.error('Barcha maydonlarni to\'ldiring!');
      return;
    }

    setAddingLeader(true);
    try {
      await api.createFloorLeader({
        floor: parseInt(floorId),
        floor_info: {
          name: floor.name,
          gender: floor.gender
        },
        username: leaderForm.username,
        password: leaderForm.password,
        first_name: leaderForm.first_name,
        last_name: leaderForm.last_name,
        phone: leaderForm.phone,
      });

      toast.success('Qavat sardori muvaffaqiyatli qo\'shildi!');
      setShowLeaderModal(false);
      setLeaderForm({
        username: '',
        password: '',
        first_name: '',
        last_name: '',
        phone: '',
      });

      fetchFloorLeader();
    } catch (error) {
      const err = error as ApiError;
      toast.error(err.response?.data?.detail || err.message || 'Sardor qo\'shishda xatolik!');
    } finally {
      setAddingLeader(false);
    }
  };

  const handleRemoveLeader = async () => {
    if (!floorLeader) return;

    try {
      await api.deleteFloorLeader(floorLeader.id);
      toast.success('Qavat sardori o\'chirildi!');
      setFloorLeader(null);
    } catch {
      toast.error('Sardorni o\'chirishda xatolik!');
    }
  };

  if (floorsLoading || roomsLoading) {
    return (
      <div className="p-4 sm:p-8 max-w-7xl mx-auto pb-24">
        <Skeleton className="h-9 w-64 mb-6" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-6">
          <Skeleton className="h-16 w-full rounded-2xl" count={4} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <Skeleton className={`w-full rounded-2xl ${CARD_HEIGHT}`} count={8} />
        </div>
      </div>
    );
  }
  if (floorsError || roomsError) {
    return (
      <div className="p-8 text-center text-danger-600 dark:text-danger-400">
        Ma'lumotlarni yuklashda xatolik. <BackButton label="Orqaga qaytish" className="mx-auto mt-4" />
      </div>
    );
  }
  if (!floor) return null;

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto pb-24">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
        <div className="flex items-center gap-3">
          <BackButton className="w-max" />
          <div className="flex items-center flex-wrap gap-2 min-w-0">
            <h2 className="text-2xl font-bold text-surface-900 dark:text-white break-words">{floor.name.endsWith('-qavat') ? floor.name : `${floor.name}-qavat`} xonalari</h2>
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${genderBadgeColors[floor.gender]}`}>{floor.gender === 'female' ? 'Qizlar' : 'Yigitlar'}</span>
          </div>
        </div>
        <div className="sm:ml-auto w-full sm:w-auto flex gap-2">
          {floorLeader ? (
            <div className="flex items-center gap-2 bg-success-50 dark:bg-success-900/20 px-4 py-2 rounded-xl border border-success-200 dark:border-success-700">
              <UserCog className="w-5 h-5 text-success-600 dark:text-success-400" />
              <div className="flex flex-col">
                <span className="text-xs text-success-600 dark:text-success-400 font-medium">Qavat sardori</span>
                <span className="text-sm font-semibold text-surface-900 dark:text-white">{floorLeader.user_info?.username || 'Noma\'lum'}</span>
              </div>
              <button
                onClick={handleRemoveLeader}
                className="ml-2 text-danger-600 hover:text-danger-700 dark:text-danger-400 dark:hover:text-danger-300 transition-colors duration-150"
                title="Sardorni o'chirish"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              className="bg-success-600 hover:bg-success-700 text-white font-semibold px-4 py-2 rounded-xl transition-colors duration-150 flex items-center gap-2"
              onClick={() => setShowLeaderModal(true)}
            >
              <UserCog className="w-5 h-5" />
              Sardor tayinlash
            </button>
          )}
          <button
            className="w-full sm:w-auto bg-brand-600 hover:bg-brand-700 text-white font-semibold px-4 py-2 rounded-xl transition-colors duration-150"
            onClick={() => {
              setShowRoomModal(true);
              setNewRoom('');
              setNewRoomCapacity('');
              setNewRoomGender(floor.gender);
            }}
          >
            + Xona qo'shish
          </button>
        </div>
      </div>
      {/* Add Room Modal */}
      <AnimatePresence>
        {showRoomModal && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
            onClick={() => {
              setShowRoomModal(false);
              setNewRoom('');
              setNewRoomCapacity('');
            }}
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
                onClick={() => {
                  setShowRoomModal(false);
                  setNewRoom('');
                  setNewRoomCapacity('');
                }}
              >
                <X size={22} />
              </button>
              <h2 className="text-xl font-bold text-surface-900 dark:text-white mb-4">Yangi xona qo'shish</h2>
              <p className="text-sm text-surface-600 dark:text-surface-400 mb-4">
                Qavat: <span className="font-semibold text-brand-600 dark:text-brand-400">{floor.name}</span>
              </p>
              <form onSubmit={handleAddRoom} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">Xona nomi yoki raqami</label>
                  <input
                    type="number"
                    value={newRoom}
                    onChange={e => setNewRoom(e.target.value)}
                    className="w-full px-3 py-2 border border-surface-300 dark:border-surface-700 rounded-xl bg-white dark:bg-surface-800 text-surface-900 dark:text-white focus:ring-2 focus:ring-brand-500/40 focus:border-brand-600 outline-none transition-colors duration-150"
                    placeholder="Masalan: 101, 102, 201..."
                    min="1"
                    required
                  />
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
                  <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">Xona sig'imi</label>
                  <input
                    type="number"
                    value={newRoomCapacity}
                    onChange={e => setNewRoomCapacity(e.target.value)}
                    className="w-full px-3 py-2 border border-surface-300 dark:border-surface-700 rounded-xl bg-white dark:bg-surface-800 text-surface-900 dark:text-white focus:ring-2 focus:ring-brand-500/40 focus:border-brand-600 outline-none transition-colors duration-150"
                    placeholder="Necha kishi sig'adi?"
                    min="1"
                    max="20"
                    required
                  />
                </div>
                <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowRoomModal(false);
                      setNewRoom('');
                      setNewRoomCapacity('');
                    }}
                    className="px-4 py-2 rounded-xl border border-surface-300 dark:border-surface-600 bg-surface-100 dark:bg-surface-800 text-surface-700 dark:text-surface-200 hover:bg-surface-200 dark:hover:bg-surface-700 transition-colors duration-150 w-full sm:w-auto"
                  >
                    Bekor qilish
                  </button>
                  <button
                    type="submit"
                    disabled={adding}
                    className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold transition-colors duration-150 disabled:opacity-60 w-full sm:w-auto"
                  >
                    {adding ? 'Qo\'shilmoqda...' : 'Qo\'shish'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* End Add Room Modal */}

      {/* Floor Leader Modal */}
      <AnimatePresence>
        {showLeaderModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => {
                setShowLeaderModal(false);
                setLeaderForm({
                  username: '',
                  password: '',
                  first_name: '',
                  last_name: '',
                  phone: '',
                });
              }}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.98, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: 10 }}
              className="relative bg-white dark:bg-surface-900 rounded-2xl shadow-sm w-full max-w-xl max-h-[90vh] overflow-hidden border border-surface-200 dark:border-surface-800"
            >
              <button
                className="absolute top-4 right-4 text-surface-400 hover:text-danger-500 p-1.5 rounded-lg hover:bg-danger-50 dark:hover:bg-danger-900/20 transition-colors duration-150 z-10"
                onClick={() => {
                  setShowLeaderModal(false);
                  setLeaderForm({
                    username: '',
                    password: '',
                    first_name: '',
                    last_name: '',
                    phone: '',
                  });
                }}
              >
                <X size={20} />
              </button>

              <div className="flex items-center gap-3 p-5 border-b border-surface-100 dark:border-surface-700">
                <div className="p-2 bg-brand-600 rounded-xl text-white">
                  <UserCog className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-surface-900 dark:text-white">Qavat sardorini tayinlash</h2>
                  <p className="text-xs text-surface-500 dark:text-surface-400 font-medium">Sardor uchun tizimda yangi profil yaratish</p>
                </div>
              </div>

              <div className="overflow-y-auto max-h-[calc(90vh-140px)] p-6">
                <form
                  onSubmit={e => {
                    e.preventDefault();
                    handleAddLeader();
                  }}
                  className="space-y-5"
                >
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-surface-500 dark:text-surface-400 uppercase tracking-wider mb-2 ml-1">
                        Ism *
                      </label>
                      <input
                        type="text"
                        value={leaderForm.first_name}
                        onChange={e => setLeaderForm(prev => ({ ...prev, first_name: e.target.value }))}
                        className="w-full px-4 py-2.5 bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl text-sm font-medium text-surface-900 dark:text-white focus:ring-2 focus:ring-brand-500/40 focus:border-brand-600 outline-none transition-colors duration-150"
                        placeholder="Ism"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-surface-500 dark:text-surface-400 uppercase tracking-wider mb-2 ml-1">
                        Familiya *
                      </label>
                      <input
                        type="text"
                        value={leaderForm.last_name}
                        onChange={e => setLeaderForm(prev => ({ ...prev, last_name: e.target.value }))}
                        className="w-full px-4 py-2.5 bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl text-sm font-medium text-surface-900 dark:text-white focus:ring-2 focus:ring-brand-500/40 focus:border-brand-600 outline-none transition-colors duration-150"
                        placeholder="Familiya"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-surface-500 dark:text-surface-400 uppercase tracking-wider mb-2 ml-1">
                        Telefon raqam *
                      </label>
                      <input
                        type="text"
                        value={leaderForm.phone}
                        onChange={e => setLeaderForm(prev => ({ ...prev, phone: e.target.value }))}
                        className="w-full px-4 py-2.5 bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl text-sm font-medium text-surface-900 dark:text-white focus:ring-2 focus:ring-brand-500/40 focus:border-brand-600 outline-none transition-colors duration-150"
                        placeholder="+998"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-surface-500 dark:text-surface-400 uppercase tracking-wider mb-2 ml-1">
                        Username *
                      </label>
                      <input
                        type="text"
                        value={leaderForm.username}
                        onChange={e => setLeaderForm(prev => ({ ...prev, username: e.target.value }))}
                        className="w-full px-4 py-2.5 bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl text-sm font-medium text-surface-900 dark:text-white focus:ring-2 focus:ring-brand-500/40 focus:border-brand-600 outline-none transition-colors duration-150"
                        placeholder="Username"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-surface-500 dark:text-surface-400 uppercase tracking-wider mb-2 ml-1">
                      Parol *
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={leaderForm.password}
                        onChange={e => setLeaderForm(prev => ({ ...prev, password: e.target.value }))}
                        className="w-full px-4 py-2.5 bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl text-sm font-medium text-surface-900 dark:text-white focus:ring-2 focus:ring-brand-500/40 focus:border-brand-600 outline-none transition-colors duration-150"
                        placeholder="Parol"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-surface-400 hover:text-brand-500 transition-colors duration-150"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setShowLeaderModal(false);
                        setLeaderForm({
                          username: '',
                          password: '',
                          first_name: '',
                          last_name: '',
                          phone: '',
                        });
                      }}
                      className="flex-1 py-2.5 bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 text-surface-700 dark:text-surface-300 rounded-xl text-sm font-bold hover:bg-surface-50 dark:hover:bg-surface-700 transition-colors duration-150 active:scale-[0.98]"
                    >
                      Bekor qilish
                    </button>
                    <button
                      type="submit"
                      disabled={addingLeader}
                      className="flex-1 py-2.5 bg-brand-600 text-white rounded-xl text-sm font-bold hover:bg-brand-700 transition-colors duration-150 active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-2"
                    >
                      {addingLeader ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Saqlanmoqda...
                        </>
                      ) : (
                        <>
                          <UserCog className="w-4 h-4" />
                          Sardorni saqlash
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* End Floor Leader Modal */}

      {/* Edit room modal */}
      <AnimatePresence>
        {editRoomModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setEditRoomModal(null)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 40 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="bg-white dark:bg-surface-900 rounded-2xl shadow-sm border border-surface-200 dark:border-surface-800 w-full max-w-sm p-6 relative"
              onClick={e => e.stopPropagation()}
            >
              <h2 className="text-xl font-bold text-surface-900 dark:text-white mb-4">Xonani tahrirlash</h2>
              <form
                onSubmit={async e => {
                  e.preventDefault();
                  if (!editRoomModal) return;
                  setEditingRoom(true);
                  try {
                    await patch(
                      `/rooms/${editRoomModal.id}/`,
                      { name: editRoomName, capacity: Number(editRoomCapacity), gender: editRoomGender }
                    );
                    toast.success('Xona tahrirlandi!');
                    setEditRoomModal(null);
                    refetchRooms();
                  } catch {
                    toast.error('Xonani tahrirlashda xatolik!');
                  } finally {
                    setEditingRoom(false);
                  }
                }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">Xona nomi yoki raqami</label>
                  <input
                    type="text"
                    value={editRoomName}
                    onChange={e => setEditRoomName(e.target.value)}
                    className="w-full px-3 py-2 border border-surface-300 dark:border-surface-700 rounded-xl bg-white dark:bg-surface-800 text-surface-900 dark:text-white focus:ring-2 focus:ring-brand-500/40 focus:border-brand-600 outline-none transition-colors duration-150"
                    placeholder="Masalan: 101-xona"
                    required
                  />
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
                <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setEditRoomModal(null)}
                    className="px-4 py-2 rounded-xl border border-surface-300 dark:border-surface-600 bg-surface-100 dark:bg-surface-800 text-surface-700 dark:text-surface-200 hover:bg-surface-200 dark:hover:bg-surface-700 transition-colors duration-150 w-full sm:w-auto"
                    disabled={editingRoom}
                  >
                    Bekor qilish
                  </button>
                  <button
                    type="submit"
                    disabled={editingRoom}
                    className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold transition-colors duration-150 disabled:opacity-60 w-full sm:w-auto"
                  >
                    {editingRoom ? "Saqlanmoqda..." : "Saqlash"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Delete room modal */}
      <AnimatePresence>
        {deleteRoomModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setDeleteRoomModal(null)}>
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
              <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDeleteRoomModal(null)}
                  className="px-4 py-2 rounded-xl border border-surface-300 dark:border-surface-600 bg-surface-100 dark:bg-surface-800 text-surface-700 dark:text-surface-200 hover:bg-surface-200 dark:hover:bg-surface-700 transition-colors duration-150 w-full sm:w-auto"
                  disabled={deletingRoom}
                >
                  Bekor qilish
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    if (!deleteRoomModal) return;
                    setDeletingRoom(true);
                    try {
                      await del(`/rooms/${deleteRoomModal.id}/`);
                      toast.success('Xona o\'chirildi!');
                      setDeleteRoomModal(null);
                      refetchRooms();
                    } catch {
                      toast.error('Xonani o\'chirishda xatolik!');
                    } finally {
                      setDeletingRoom(false);
                    }
                  }}
                  disabled={deletingRoom}
                  className="px-4 py-2 rounded-xl bg-danger-600 hover:bg-danger-700 text-white font-semibold transition-colors duration-150 disabled:opacity-60 w-full sm:w-auto"
                >
                  {deletingRoom ? "O'chirilmoqda..." : "O'chirish"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Stats + Filters */}
      <div className="space-y-3 mb-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <div className="rounded-2xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 p-3">
            <div className="text-xs text-surface-500 dark:text-surface-400">Jami xona</div>
            <div className="text-lg font-semibold text-surface-900 dark:text-white">{roomStats.total}</div>
          </div>
          <div className="rounded-2xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 p-3">
            <div className="text-xs text-surface-500 dark:text-surface-400">Bo'sh</div>
            <div className="text-lg font-semibold text-success-600 dark:text-success-400">{roomStats.empty}</div>
          </div>
          <div className="rounded-2xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 p-3">
            <div className="text-xs text-surface-500 dark:text-surface-400">To'lmagan</div>
            <div className="text-lg font-semibold text-warning-600 dark:text-warning-400">{roomStats.partial}</div>
          </div>
          <div className="rounded-2xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 p-3">
            <div className="text-xs text-surface-500 dark:text-surface-400">To'lgan</div>
            <div className="text-lg font-semibold text-brand-600 dark:text-brand-400">{roomStats.full}</div>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 rounded-xl bg-surface-50 dark:bg-surface-800">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-surface-500" />
            <span className="text-sm font-medium text-surface-700 dark:text-surface-300">Filterlar</span>
          </div>
          <div className="flex sm:ml-auto">
            <div className="inline-flex w-full sm:w-auto rounded-xl overflow-hidden border border-surface-200 dark:border-surface-800">
              <button
                onClick={() => setRoomStatusFilter("")}
                className={`px-3 py-2 text-sm transition-colors duration-150 ${roomStatusFilter === "" ? 'bg-brand-600 text-white' : 'bg-white dark:bg-surface-900 text-surface-700 dark:text-surface-200'}`}
              >Barchasi</button>
              <button
                onClick={() => setRoomStatusFilter("empty")}
                className={`px-3 py-2 text-sm transition-colors duration-150 ${roomStatusFilter === "empty" ? 'bg-brand-600 text-white' : 'bg-white dark:bg-surface-900 text-surface-700 dark:text-surface-200'}`}
              >Bo'sh</button>
              <button
                onClick={() => setRoomStatusFilter("occupied")}
                className={`px-3 py-2 text-sm transition-colors duration-150 ${roomStatusFilter === "occupied" ? 'bg-brand-600 text-white' : 'bg-white dark:bg-surface-900 text-surface-700 dark:text-surface-200'}`}
              >To'lmagan</button>
              <button
                onClick={() => setRoomStatusFilter("full")}
                className={`px-3 py-2 text-sm transition-colors duration-150 ${roomStatusFilter === "full" ? 'bg-brand-600 text-white' : 'bg-white dark:bg-surface-900 text-surface-700 dark:text-surface-200'}`}
              >To'lgan</button>
            </div>
          </div>
        </div>
      </div>

      {rooms.length === 0 ? (
        <EmptyState
          icon={BedDouble}
          title="Bu qavatda xona yo'q"
          description="Qavatga birinchi xonani qo'shing"
          action={{
            label: "+ Xona qo'shish",
            onClick: () => {
              setShowRoomModal(true);
              setNewRoom('');
              setNewRoomCapacity('');
              setNewRoomGender(floor.gender);
            },
          }}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 relative">
          {sortedRooms
            .filter((room: Room) => {
              const students = room.students || [];
              const occupancy = students.length;
              const capacity = room.capacity;

              if (!roomStatusFilter) return true;

              if (roomStatusFilter === "empty") return occupancy === 0;
              if (roomStatusFilter === "full") return occupancy >= capacity;
              if (roomStatusFilter === "occupied") return occupancy > 0 && occupancy < capacity;

              return true;
            })
            .map((room: Room) => {
            const students = room.students || [];
            const status = getRoomStatus(students.length, room.capacity);
            return (
              <div
                key={room.id}
                className={`flex flex-col justify-between px-5 py-4 rounded-2xl bg-white dark:bg-surface-900 text-surface-900 dark:text-white font-medium border border-surface-200 dark:border-surface-800 hover:shadow-md focus:ring-2 focus:ring-brand-500/40 transition-colors duration-150 shadow-sm cursor-pointer ${CARD_HEIGHT} relative overflow-hidden`}
              >
                {/* Three dots button */}
                <div className="absolute top-2 right-2 z-20">
                  <button
                    className="p-2 rounded-full transition-colors duration-150 hover:bg-surface-100 dark:hover:bg-surface-800 text-surface-500 dark:text-surface-300 room-menu-button"
                    onClick={e => { e.stopPropagation(); setOpenRoomMenuId(room.id === openRoomMenuId ? null : room.id); }}
                    title="Ko'proq"
                  >
                    <MoreVertical size={20} />
                  </button>
                  {/* Inline dropdown menu for this room only */}
                  <AnimatePresence>
                    {openRoomMenuId === room.id && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        transition={{ duration: 0.18, ease: 'easeOut' }}
                        className="absolute right-0 mt-2 w-44 bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-xl shadow-md z-30 room-menu"
                        onClick={e => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-between px-3 py-2 border-b border-surface-100 dark:border-surface-800">
                          <span className="text-xs font-medium text-surface-500">Amallar</span>
                          <button
                            className="p-1 rounded transition-colors duration-150 hover:bg-surface-100 dark:hover:bg-surface-800 text-surface-500"
                            onClick={() => setOpenRoomMenuId(null)}
                            aria-label="Yopish"
                          >
                            <X size={14} />
                          </button>
                        </div>
                        <button
                          className="w-full flex items-center gap-2 px-4 py-2 text-sm text-brand-700 dark:text-brand-300 hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-colors duration-150"
                          onClick={() => {
                            setEditRoomModal(room);
                            setEditRoomName(room.name);
                            setEditRoomCapacity(room.capacity.toString());
                            setEditRoomGender(room.gender || 'male');
                            setOpenRoomMenuId(null);
                          }}
                        >
                          ✏️ Tahrirlash
                        </button>
                        <button
                          className="w-full flex items-center gap-2 px-4 py-2 text-sm text-danger-600 dark:text-danger-400 hover:bg-danger-50 dark:hover:bg-danger-900/20 transition-colors duration-150"
                          onClick={() => {
                            setDeleteRoomModal(room);
                            setOpenRoomMenuId(null);
                          }}
                        >
                          🗑️ O'chirish
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2 pr-8">
                    <div className="font-bold text-lg truncate pr-2" title={room.name.endsWith('-xona') ? room.name : `${room.name}-xona`}>
                      {room.name.endsWith('-xona') ? room.name : `${room.name}-xona`}
                    </div>
                    <div className="text-xs shrink-0 rounded-full px-2 py-0.5 border border-surface-200 dark:border-surface-800 bg-surface-50 dark:bg-surface-800">
                      {students.length}/{room.capacity}
                    </div>
                  </div>
                  <div className="h-1.5 rounded bg-surface-100 dark:bg-surface-800 overflow-hidden">
                    <div
                      className={`${roomStatusBar[status]} h-full`}
                      style={{ width: `${Math.min(100, (students.length / Math.max(1, room.capacity)) * 100)}%` }}
                    />
                  </div>
                  <div className="mt-3 grid grid-cols-1 xs:grid-cols-2 gap-2 overflow-y-auto pr-2 flex-1"
                    style={{ maxHeight: '4rem' }}
                  >
                    {students.length === 0 ? (
                      <span className="text-surface-400 dark:text-surface-500 col-span-full">Talaba yo'q</span>
                    ) : (
                      [0, 1].map(col => (
                        <div key={col} className="flex flex-col gap-1">
                          {students.slice(col * 3, col * 3 + 3).map(student => (
                            <Link
                              key={student.id}
                              to={`/studentprofile/${student.id}`}
                              className="text-sm whitespace-normal sm:whitespace-nowrap break-words text-brand-600 hover:underline dark:text-brand-400 transition-colors duration-150"
                            >
                              {getShortName(student.name + ' ' + student.last_name)}
                            </Link>
                          ))}
                        </div>
                      ))
                    )}
                  </div>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center justify-between mt-auto pt-3">
                  <div className={`text-xs font-medium ${roomStatusText[status]}`}>
                    {status === 'empty' ? "Bo'sh" : status === 'full' ? "To'lgan" : "To'lmagan"}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Floating Add Button (mobile) */}
      <div className="fixed right-4 bottom-20 sm:hidden z-40">
        <button
          onClick={() => {
            setShowRoomModal(true);
            setNewRoom('');
            setNewRoomCapacity('');
            setNewRoomGender(floor.gender);
          }}
          className="inline-flex items-center gap-2 px-4 py-3 rounded-full bg-brand-600 text-white shadow-md hover:bg-brand-700 active:scale-[0.98] transition-colors duration-150"
        >
          <span className="text-lg">+</span>
          <span className="font-semibold">Xona qo'shish</span>
        </button>
      </div>


    </div>
  );
};

export default FloorDetail;
