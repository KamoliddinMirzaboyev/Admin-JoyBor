import { useCallback, useEffect, useRef } from 'react';
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

export const useNotifications = () => {
  const queryClient = useQueryClient();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const prevUnreadCount = useRef<number>(0);
  const primed = useRef(false);

  // Initialize audio
  useEffect(() => {
    audioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
  }, []);

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

  // Play sound when unread count increases (skip first fetch baseline)
  useEffect(() => {
    if (!primed.current) {
      prevUnreadCount.current = unreadCount;
      primed.current = true;
      return;
    }
    if (unreadCount > prevUnreadCount.current) {
      audioRef.current?.play().catch(() => {});
      
      // Optional: Show toast for new notification if it's just one
      if (unreadCount - prevUnreadCount.current === 1) {
        const latest = unreadNotifications[0];
        if (latest) {
          toast.info(latest.message, {
            description: 'Yangi bildirishnoma keldi',
            duration: 5000,
          });
        }
      }
    }
    prevUnreadCount.current = unreadCount;
  }, [unreadCount, unreadNotifications]);

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
