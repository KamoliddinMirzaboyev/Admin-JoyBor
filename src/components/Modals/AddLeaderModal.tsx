import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, UserPlus, User, Mail, Phone, Building, Lock, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../data/api';

interface AddLeaderModalProps {
  isOpen: boolean;
  onClose: () => void;
  floors: Array<{ id: string; number: number; name: string; gender?: string }>;
}

interface LeaderFormData {
  floor: number | '';
  username: string;
  password: string;
  first_name: string;
  last_name: string;
  phone: string;
}

const AddLeaderModal: React.FC<AddLeaderModalProps> = ({ isOpen, onClose, floors }) => {
  const [formData, setFormData] = useState<LeaderFormData>({
    floor: '',
    username: '',
    password: '',
    first_name: '',
    last_name: '',
    phone: ''
  });

  const [errors, setErrors] = useState<Partial<Record<keyof LeaderFormData, string>>>({});
  const [showPassword, setShowPassword] = useState(false);

  const queryClient = useQueryClient();

  // Create leader mutation
  const createLeaderMutation = useMutation({
    mutationFn: (data: LeaderFormData) => {
      const selectedFloor = floors.find(f => String(f.id) === String(data.floor));
      
      return api.createFloorLeader({
        floor: Number(data.floor),
        floor_info: {
          name: selectedFloor?.name || '',
          gender: selectedFloor?.gender || 'male'
        },
        username: data.username,
        password: data.password,
        first_name: data.first_name,
        last_name: data.last_name,
        phone: data.phone
      });
    },
    onSuccess: () => {
      toast.success('Qavat sardori muvaffaqiyatli qo\'shildi!');
      queryClient.invalidateQueries({ queryKey: ['floor-leaders'] });
      handleClose();
    },
    onError: (error: any) => {
      const errorData = error?.response?.data;
      const errorMessage = errorData?.detail || 
                          errorData?.message || 
                          error?.message || 
                          'Qavat sardorini qo\'shishda xatolik yuz berdi';
      toast.error(errorMessage);
      
      // Handle field-specific errors
      if (errorData && typeof errorData === 'object') {
        const fieldErrors: Partial<Record<keyof LeaderFormData, string>> = {};
        Object.keys(errorData).forEach(field => {
          if (field in formData) {
            fieldErrors[field as keyof LeaderFormData] = Array.isArray(errorData[field]) 
              ? String(errorData[field][0]) 
              : String(errorData[field]);
          }
        });
        setErrors(fieldErrors);
      }
    }
  });

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof LeaderFormData, string>> = {};

    if (!formData.floor) {
      newErrors.floor = 'Qavat tanlanishi shart';
    }

    if (!formData.username.trim()) {
      newErrors.username = 'Foydalanuvchi nomi kiritilishi shart';
    } else if (formData.username.length < 3) {
      newErrors.username = 'Foydalanuvchi nomi kamida 3 ta belgidan iborat bo\'lishi kerak';
    }

    if (!formData.password.trim()) {
      newErrors.password = 'Parol kiritilishi shart';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Parol kamida 8 ta belgidan iborat bo\'lishi kerak';
    }

    if (!formData.first_name.trim()) {
      newErrors.first_name = 'Ism kiritilishi shart';
    }

    if (!formData.last_name.trim()) {
      newErrors.last_name = 'Familiya kiritilishi shart';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Telefon raqami kiritilishi shart';
    } else if (!/^\+998[0-9]{9}$/.test(formData.phone)) {
      newErrors.phone = 'Telefon raqami +998XXXXXXXXX formatida bo\'lishi kerak';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof LeaderFormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear specific field error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    createLeaderMutation.mutate(formData);
  };

  const handleClose = () => {
    setFormData({
      floor: '',
      username: '',
      password: '',
      first_name: '',
      last_name: '',
      phone: ''
    });
    setErrors({});
    setShowPassword(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence mode="wait">
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm"
          onClick={handleClose}
        />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.98, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.98, y: 10 }}
          className="relative bg-white dark:bg-surface-800 rounded-xl shadow-sm w-full max-w-xl max-h-[90vh] overflow-hidden border border-surface-200 dark:border-surface-700"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-surface-100 dark:border-surface-700">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-brand-600 rounded-xl text-white shadow-sm shadow-brand-500/20">
                <UserPlus className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-surface-900 dark:text-white">
                  Yangi qavat sardori
                </h2>
                <p className="text-xs text-surface-500 dark:text-surface-400 font-medium">
                  Sardor uchun tizimda yangi profil yaratish
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-2 rounded-xl text-surface-400 hover:text-danger-500 hover:bg-danger-50 dark:hover:bg-danger-900/20 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="overflow-y-auto max-h-[calc(90vh-140px)] p-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Floor Selection */}
              <div>
                <label className="block text-xs font-bold text-surface-500 dark:text-surface-400 uppercase tracking-wider mb-2 ml-1">
                  Tanlangan qavat *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-surface-400">
                    <Building className="w-4 h-4" />
                  </div>
                  <select
                    value={formData.floor}
                    onChange={(e) => handleInputChange('floor', e.target.value)}
                    className={`w-full pl-10 pr-4 py-2.5 bg-surface-50 dark:bg-surface-900 border rounded-xl text-sm font-medium focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all ${
                      errors.floor ? 'border-danger-500' : 'border-surface-200 dark:border-surface-700 text-surface-900 dark:text-white'
                    }`}
                  >
                    <option value="">Qavatni tanlang</option>
                    {floors.map((floor) => (
                      <option key={floor.id} value={floor.id}>
                        {floor.name}
                      </option>
                    ))}
                  </select>
                </div>
                {errors.floor && (
                  <p className="text-danger-500 text-[11px] font-bold mt-1.5 ml-1">{errors.floor}</p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* First Name */}
                <div>
                  <label className="block text-xs font-bold text-surface-500 dark:text-surface-400 uppercase tracking-wider mb-2 ml-1">
                    Ism *
                  </label>
                  <input
                    type="text"
                    value={formData.first_name}
                    onChange={(e) => handleInputChange('first_name', e.target.value)}
                    className={`w-full px-4 py-2.5 bg-surface-50 dark:bg-surface-900 border rounded-xl text-sm font-medium focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all ${
                      errors.first_name ? 'border-danger-500' : 'border-surface-200 dark:border-surface-700 text-surface-900 dark:text-white'
                    }`}
                    placeholder="Ism"
                  />
                  {errors.first_name && (
                    <p className="text-danger-500 text-[11px] font-bold mt-1.5 ml-1">{errors.first_name}</p>
                  )}
                </div>

                {/* Last Name */}
                <div>
                  <label className="block text-xs font-bold text-surface-500 dark:text-surface-400 uppercase tracking-wider mb-2 ml-1">
                    Familiya *
                  </label>
                  <input
                    type="text"
                    value={formData.last_name}
                    onChange={(e) => handleInputChange('last_name', e.target.value)}
                    className={`w-full px-4 py-2.5 bg-surface-50 dark:bg-surface-900 border rounded-xl text-sm font-medium focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all ${
                      errors.last_name ? 'border-danger-500' : 'border-surface-200 dark:border-surface-700 text-surface-900 dark:text-white'
                    }`}
                    placeholder="Familiya"
                  />
                  {errors.last_name && (
                    <p className="text-danger-500 text-[11px] font-bold mt-1.5 ml-1">{errors.last_name}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Phone */}
                <div>
                  <label className="block text-xs font-bold text-surface-500 dark:text-surface-400 uppercase tracking-wider mb-2 ml-1">
                    Telefon raqam *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-surface-400">
                      <Phone className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      className={`w-full pl-10 pr-4 py-2.5 bg-surface-50 dark:bg-surface-900 border rounded-xl text-sm font-medium focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all ${
                        errors.phone ? 'border-danger-500' : 'border-surface-200 dark:border-surface-700 text-surface-900 dark:text-white'
                      }`}
                      placeholder="+998"
                    />
                  </div>
                  {errors.phone && (
                    <p className="text-danger-500 text-[11px] font-bold mt-1.5 ml-1">{errors.phone}</p>
                  )}
                </div>

                {/* Username */}
                <div>
                  <label className="block text-xs font-bold text-surface-500 dark:text-surface-400 uppercase tracking-wider mb-2 ml-1">
                    Username *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-surface-400">
                      <User className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      value={formData.username}
                      onChange={(e) => handleInputChange('username', e.target.value)}
                      className={`w-full pl-10 pr-4 py-2.5 bg-surface-50 dark:bg-surface-900 border rounded-xl text-sm font-medium focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all ${
                        errors.username ? 'border-danger-500' : 'border-surface-200 dark:border-surface-700 text-surface-900 dark:text-white'
                      }`}
                      placeholder="Username"
                    />
                  </div>
                  {errors.username && (
                    <p className="text-danger-500 text-[11px] font-bold mt-1.5 ml-1">{errors.username}</p>
                  )}
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-bold text-surface-500 dark:text-surface-400 uppercase tracking-wider mb-2 ml-1">
                  Parol *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-surface-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    className={`w-full pl-10 pr-12 py-2.5 bg-surface-50 dark:bg-surface-900 border rounded-xl text-sm font-medium focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all ${
                      errors.password ? 'border-danger-500' : 'border-surface-200 dark:border-surface-700 text-surface-900 dark:text-white'
                    }`}
                    placeholder="Parol"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-surface-400 hover:text-brand-500 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-danger-500 text-[11px] font-bold mt-1.5 ml-1">{errors.password}</p>
                )}
              </div>
            </form>
          </div>

          {/* Footer */}
          <div className="flex gap-3 p-6 bg-surface-50 dark:bg-surface-900/50 border-t border-surface-100 dark:border-surface-700">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 py-2.5 bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 text-surface-700 dark:text-surface-300 rounded-xl text-sm font-bold hover:bg-surface-50 dark:hover:bg-surface-700 transition-all active:scale-[0.98]"
            >
              Bekor qilish
            </button>
            <button
              onClick={handleSubmit}
              disabled={createLeaderMutation.isPending}
              className="flex-1 py-2.5 bg-brand-600 text-white rounded-xl text-sm font-bold hover:bg-brand-700 shadow-sm shadow-brand-500/20 transition-all active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {createLeaderMutation.isPending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Saqlanmoqda...
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  Sardorni saqlash
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default AddLeaderModal;