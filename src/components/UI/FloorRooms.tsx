import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { get } from '../../data/api';
import { MoreVertical } from 'lucide-react';
import type { Room } from '../../pages/Rooms';
import Skeleton from './Skeleton';

interface Floor {
  id: number;
  name: string;
  gender: 'male' | 'female';
}

// Room status -> semantic token mapping (shared vocabulary with FloorDetail.tsx):
// EMPTY (bo'sh) = success, PARTIALLY_OCCUPIED (to'lmagan) = warning, OCCUPIED (to'lgan) = brand
const statusColors: Record<string, string> = {
  EMPTY: 'bg-success-100 text-success-700 dark:bg-success-900/20 dark:text-success-400',
  OCCUPIED: 'bg-brand-600 text-white',
  PARTIALLY_OCCUPIED: 'bg-warning-100 text-warning-700 dark:bg-warning-900/20 dark:text-warning-400',
};

const statusLabels: Record<string, string> = {
  OCCUPIED: "To'lgan",
  PARTIALLY_OCCUPIED: "To'lmagan",
  EMPTY: "Bo'sh",
};

const genderBadgeColors: Record<'male' | 'female', string> = {
  male: 'bg-brand-100 text-brand-700 dark:bg-brand-900/20 dark:text-brand-300',
  female: 'bg-info-100 text-info-700 dark:bg-info-900/20 dark:text-info-300',
};

function useRoomsByFloor(floorId: number) {
  return useQuery<Room[]>({
    queryKey: ['rooms', floorId],
    queryFn: async () => {
      const res = await get(`/rooms/?floor=${floorId}`);

      // API returns paginated data with results array
      let roomsData = [];
      if (res && res.results && Array.isArray(res.results)) {
        roomsData = res.results;
      } else if (Array.isArray(res)) {
        roomsData = res;
      }

      return roomsData.map((room: Record<string, unknown>) => {
        const students = Array.isArray(room.students) ? room.students : [];
        const capacity = typeof room.capacity === 'number' ? room.capacity : 0;
        const currentOccupancy = students.length;
        let status = 'EMPTY';
        if (currentOccupancy === 0) status = 'EMPTY';
        else if (currentOccupancy === capacity && capacity > 0) status = 'OCCUPIED';
        else status = 'PARTIALLY_OCCUPIED';
        return {
          ...room,
          students,
          capacity,
          currentOccupancy,
          status,
        } as Room;
      });
    },
    staleTime: 0, // Cache ni butunlay o'chiramiz
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    refetchInterval: 30000, // Har 30 soniyada yangilash
  });
}

const FloorRooms: React.FC<{
  floor: Floor;
  genderLabels: Record<string, { label: string; icon: React.ReactNode }>;
  menuOpen: string | null;
  setMenuOpen: (id: string | null) => void;
  handleEditFloor: (floor: Floor) => void;
  handleDeleteFloor: (floor: Floor) => void;
  handleEditRoom?: (room: Room) => void;
  handleDeleteRoom?: (room: Room) => void;
  navigate: (path: string) => void;
  roomStatusFilter?: string;
  genderFilter?: string;
}> = ({ floor, genderLabels, menuOpen, setMenuOpen, handleEditFloor, handleDeleteFloor, handleEditRoom, handleDeleteRoom, navigate, roomStatusFilter, genderFilter }) => {
  const { data, isLoading: roomsLoading } = useRoomsByFloor(floor.id);
  const [openRoomMenuId, setOpenRoomMenuId] = React.useState<number | null>(null);

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

  const allRooms = Array.isArray(data) ? data : [];

  // Filter rooms based on status and gender
  const filteredRooms = allRooms.filter(room => {
    // Gender filter
    if (genderFilter && room.gender !== genderFilter) {
      return false;
    }

    // Status filter
    if (roomStatusFilter) {
      if (roomStatusFilter === 'empty' && room.status !== 'EMPTY') {
        return false;
      }
      if (roomStatusFilter === 'occupied' && room.status !== 'PARTIALLY_OCCUPIED') {
        return false;
      }
      if (roomStatusFilter === 'full' && room.status !== 'OCCUPIED') {
        return false;
      }
    }

    return true;
  });

  // Sort rooms by room number (extract numeric part and sort)
  const rooms = filteredRooms.sort((a, b) => {
    const roomANum = parseInt(a.name.replace(/\D/g, '')) || 0;
    const roomBNum = parseInt(b.name.replace(/\D/g, '')) || 0;
    return roomANum - roomBNum;
  });

  return (
    <div
      className="bg-white dark:bg-surface-900 rounded-2xl p-4 border border-surface-200 dark:border-surface-800 relative group cursor-pointer shadow-sm hover:shadow-md transition-colors duration-150"
      onClick={e => {
        if ((e.target as HTMLElement).closest('.floor-actions')) return;
        navigate(`/rooms/${floor.id}`);
      }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-surface-900 dark:text-white">{floor.name.endsWith('-qavat') ? floor.name : `${floor.name}-qavat`}</h2>
          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${genderBadgeColors[floor.gender]}`}>{genderLabels[floor.gender]?.label}</span>
        </div>
        <div className="relative floor-actions">
          <button
            className="p-2 rounded transition-colors duration-150 hover:bg-surface-100 dark:hover:bg-surface-800 text-surface-400 dark:text-surface-400"
            onClick={e => { e.stopPropagation(); setMenuOpen(menuOpen === String(floor.id) ? null : String(floor.id)); }}
          >
            <MoreVertical size={20} />
          </button>
          {menuOpen === String(floor.id) && (
            <div className="absolute right-0 mt-2 w-36 bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl shadow-md z-30 animate-fade-in">
              <button
                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-surface-700 dark:text-surface-200 hover:bg-surface-100 dark:hover:bg-surface-700 rounded-t-xl transition-colors duration-150"
                onClick={() => handleEditFloor(floor)}
              >
                ✏️ Tahrirlash
              </button>
              <button
                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-danger-600 dark:text-danger-400 hover:bg-danger-50 dark:hover:bg-danger-900/20 rounded-b-xl transition-colors duration-150"
                onClick={() => handleDeleteFloor(floor)}
              >
                🗑️ O'chirish
              </button>
            </div>
          )}
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {roomsLoading ? (
          <Skeleton className="h-20 w-full rounded-xl" count={5} />
        ) : rooms.length === 0 ? (
          <span className="text-surface-400 dark:text-surface-500">Xona yo'q</span>
        ) : (
          rooms.map((room: Room) => (
            <div
              key={room.id}
              className="relative px-2 py-3 rounded-xl bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 shadow-sm hover:shadow-md transition-colors duration-150 cursor-pointer flex flex-col items-center justify-center min-w-[110px] w-full max-w-[150px] group/room"
              title={room.name}
              onClick={(e) => {
                // If clicking menu button or menu itself, don't navigate
                if ((e.target as HTMLElement).closest('.room-menu-button') || (e.target as HTMLElement).closest('.room-menu')) {
                  return;
                }
              }}
            >
              {/* Room actions menu */}
              <div className="absolute top-1 right-1 opacity-0 group-hover/room:opacity-100 transition-opacity">
                <button
                  className="p-1 rounded-full transition-colors duration-150 hover:bg-surface-100 dark:hover:bg-surface-800 text-surface-500 room-menu-button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpenRoomMenuId(openRoomMenuId === room.id ? null : room.id);
                  }}
                >
                  <MoreVertical size={14} />
                </button>
                {openRoomMenuId === room.id && (
                  <div className="absolute right-0 mt-1 w-32 bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl shadow-md z-50 room-menu">
                    <button
                      className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-surface-700 dark:text-surface-200 hover:bg-surface-100 dark:hover:bg-surface-700 rounded-t-xl transition-colors duration-150"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditRoom?.(room);
                        setOpenRoomMenuId(null);
                      }}
                    >
                      ✏️ Tahrirlash
                    </button>
                    <button
                      className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-danger-600 dark:text-danger-400 hover:bg-danger-50 dark:hover:bg-danger-900/20 rounded-b-xl transition-colors duration-150"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteRoom?.(room);
                        setOpenRoomMenuId(null);
                      }}
                    >
                      🗑️ O'chirish
                    </button>
                  </div>
                )}
              </div>

              <span className="font-bold text-base text-surface-900 dark:text-white mb-2">{room.name}</span>
              <span className={`text-xs px-3 py-1 rounded-full font-semibold ${statusColors[room.status] || 'bg-surface-200 text-surface-700'}`}>
                {statusLabels[room.status] || room.status}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default FloorRooms;
