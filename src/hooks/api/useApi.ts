import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, patch } from '../../data/api';
import { toast } from 'sonner';

type QueryParams = Record<string, string | number | boolean | undefined | null>;

function errMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === 'object' && error && 'message' in error) {
    const m = (error as { message?: unknown }).message;
    if (typeof m === 'string') return m;
  }
  return fallback;
}

// --- Students Hooks ---

export const useStudents = (params?: QueryParams) => {
  return useQuery({
    queryKey: ['students', params],
    queryFn: () => api.getStudents(params),
  });
};

export const useStudent = (id: number | string) => {
  return useQuery({
    queryKey: ['student', id],
    queryFn: () => api.getStudent(id),
    enabled: !!id,
  });
};

export const useUpdateStudent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number | string; data: FormData | Record<string, unknown> }) =>
      api.updateStudent(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      queryClient.invalidateQueries({ queryKey: ['student', variables.id] });
      toast.success("Talaba ma'lumotlari yangilandi");
    },
    onError: (error: unknown) => {
      toast.error(errMessage(error, 'Xatolik yuz berdi'));
    },
  });
};

// --- Applications Hooks ---

export const useApplications = (params?: QueryParams) => {
  return useQuery({
    queryKey: ['applications', params],
    queryFn: () => api.getApplications(params),
  });
};

export const useApplication = (id: number | string) => {
  return useQuery({
    queryKey: ['application', id],
    queryFn: () => api.getApplication(id),
    enabled: !!id,
  });
};

export const useUpdateApplication = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number | string; data: Record<string, unknown> }) =>
      api.updateApplication(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      queryClient.invalidateQueries({ queryKey: ['application', variables.id] });
    },
  });
};

// --- Payments Hooks ---

export const usePayments = (params?: QueryParams) => {
  return useQuery({
    queryKey: ['payments', params],
    queryFn: () => api.getPayments(params),
  });
};

export const useCreatePayment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => api.createPayment(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      toast.success("To'lov muvaffaqiyatli qo'shildi");
    },
    onError: (error: unknown) => {
      toast.error(errMessage(error, "To'lov qo'shishda xatolik"));
    },
  });
};

export const useUpdatePayment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number | string; data: Record<string, unknown> }) =>
      patch(`/payments/${id}/`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      toast.success("To'lov ma'lumotlari yangilandi");
    },
    onError: (error: unknown) => {
      toast.error(errMessage(error, "To'lovni yangilashda xatolik"));
    },
  });
};

// --- Rooms & Floors Hooks ---

export const useFloors = () => {
  return useQuery({
    queryKey: ['floors'],
    queryFn: () => api.getFloors(),
  });
};

export const useRooms = (floorId?: number | string) => {
  return useQuery({
    queryKey: ['rooms', floorId],
    queryFn: () => api.getRooms(floorId),
  });
};
