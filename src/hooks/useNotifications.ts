import { useCallback, useEffect, useRef, type MutableRefObject } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../data/api';
import { toast } from 'sonner';

export interface Notification {
  id: number;
  type: string;
  message: string;
  is_read: boolean;
  created_at: string;
  image?: string | null;
}

// Yumshoq, bosinqroq "ding" ovozi — tashqi mp3 fayl kerak emas
const playChime = (ctxRef: MutableRefObject<AudioContext | null>) => {
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!ctxRef.current) ctxRef.current = new Ctx();
    const ctx = ctxRef.current;
    if (ctx.state === 'suspended') ctx.resume();

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(660, ctx.currentTime + 0.2);
    gain.gain.setValueAtTime(0.001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.15, ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.35);
  } catch {
    // audio ishlamasa ham indamay o'tamiz
  }
};

export const useNotifications = () => {
  const queryClient = useQueryClient();
  const audioCtxRef = useRef<AudioContext | null>(null);
  const seenIds = useRef<Set<number> | null>(null);

  const { data: notifications = [], isLoading, error, refetch } = useQuery<Notification[]>({
    queryKey: ['notifications'],
    queryFn: async () => {
      const res = await api.getNotifications();
      return Array.isArray(res) ? res : [];
    },
    staleTime: 1000 * 60,
    refetchInterval: 10000, // Check every 10 seconds for new notifications
  });

  const unreadNotifications = notifications.filter(n => !n.is_read);
  const unreadCount = unreadNotifications.length;

  // Yangi bildirishnoma kelganda — id bo'yicha, bir marta ovoz chiqarish.
  // (unreadCount taqqoslash o'rniga id set ishlatiladi — mark-as-read/refetch
  // poygasida bitta bildirishnoma bir necha marta "yangi" bo'lib qolmasin uchun)
  useEffect(() => {
    if (!seenIds.current) {
      seenIds.current = new Set(notifications.map(n => n.id));
      return;
    }
    const freshUnread = unreadNotifications.filter(n => !seenIds.current!.has(n.id));
    notifications.forEach(n => seenIds.current!.add(n.id));

    if (freshUnread.length > 0) {
      playChime(audioCtxRef);
      toast.info(freshUnread[0].message, {
        description: 'Yangi bildirishnoma keldi',
        duration: 5000,
      });
    }
  }, [notifications, unreadNotifications]);

  const markAsReadMutation = useMutation({
    mutationFn: (id: number) => api.markNotificationAsRead(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['notifications'] });
      const previousNotifications = queryClient.getQueryData<Notification[]>(['notifications']);
      
      queryClient.setQueryData<Notification[]>(['notifications'], (old) => {
        if (!old) return [];
        return old.map(n => n.id === id ? { ...n, is_read: true } : n);
      });
      
      return { previousNotifications };
    },
    onError: (_err, _id, context) => {
      if (context?.previousNotifications) {
        queryClient.setQueryData(['notifications'], context.previousNotifications);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: () => api.markAllNotificationsAsRead(),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['notifications'] });
      const previousNotifications = queryClient.getQueryData<Notification[]>(['notifications']);
      
      queryClient.setQueryData<Notification[]>(['notifications'], (old) => {
        if (!old) return [];
        return old.map(n => ({ ...n, is_read: true }));
      });
      
      return { previousNotifications };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousNotifications) {
        queryClient.setQueryData(['notifications'], context.previousNotifications);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
    onSuccess: () => {
      toast.success("Barcha bildirishnomalar o'qilgan deb belgilandi");
    },
  });

  const markAsRead = useCallback((id: number) => {
    markAsReadMutation.mutate(id);
  }, [markAsReadMutation]);

  const markAllAsRead = useCallback(() => {
    markAllAsReadMutation.mutate();
  }, [markAllAsReadMutation]);

  return {
    notifications,
    unreadNotifications,
    unreadCount,
    isLoading,
    error,
    refetch,
    markAsRead,
    markAllAsRead
  };
};
