import React, { useEffect, useState } from 'react';
import { User, GraduationCap, MapPin, UserPlus, XCircle, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import api from '../../data/api';
import { Application } from './types';

const EMPTY_FORM = {
  name: '', last_name: '', middle_name: '', passport: '', faculty: '',
  direction: '', course: '', group: '', phone: '', gender: 'Erkak',
};

const inputClass = 'w-full px-4 py-3 border border-surface-200 dark:border-surface-700 rounded-xl bg-white dark:bg-surface-800 text-surface-900 dark:text-white focus:ring-2 focus:ring-brand-500/40 focus:border-transparent transition-colors duration-150 outline-none';
const labelClass = 'block text-xs font-bold text-surface-500 dark:text-surface-400 mb-2 ml-1';

export default function AddStudentModal({ application, open, onClose, onSuccess }: {
  application: Application;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [studentForm, setStudentForm] = useState(EMPTY_FORM);
  const [selectedFloor, setSelectedFloor] = useState(0);
  const [selectedRoom, setSelectedRoom] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setStudentForm({
        name: application.name || '',
        last_name: application.last_name || '',
        middle_name: application.middle_name || '',
        passport: application.passport || '',
        faculty: application.faculty || '',
        direction: application.direction || '',
        course: application.course || '',
        group: application.group || '',
        phone: application.phone || '',
        gender: application.gender || 'Erkak',
      });
      setSelectedFloor(0);
      setSelectedRoom(0);
    }
  }, [open, application]);

  const { data: floorsData } = useQuery<{ results: Array<{ id: number; name: string }> }>({
    queryKey: ['floors'],
    queryFn: () => api.getFloors(),
    enabled: open,
  });
  const floors = floorsData?.results || [];

  const { data: roomsData } = useQuery<{ results: Array<{ id: number; name: string; capacity: number; current_occupancy: number }> }>({
    queryKey: ['rooms', selectedFloor],
    queryFn: () => api.getRooms(selectedFloor),
    enabled: open && !!selectedFloor,
  });
  const rooms = roomsData?.results || [];

  const handleClose = () => {
    onClose();
    setStudentForm(EMPTY_FORM);
    setSelectedFloor(0);
    setSelectedRoom(0);
  };

  const handleSubmit = async () => {
    if (!selectedFloor || !selectedRoom) {
      toast.error('Qavat va xonani tanlang!');
      return;
    }
    if (!studentForm.name || !studentForm.last_name || !studentForm.passport) {
      toast.error('Ism, familiya va pasport majburiy!');
      return;
    }

    setLoading(true);
    try {
      const userId = typeof application.user === 'number'
        ? application.user
        : (typeof application.user === 'string' ? parseInt(application.user) : 0);

      const searchData = await api.getUnassignedStudents();
      const unassignedStudents = Array.isArray(searchData.results) ? searchData.results : (Array.isArray(searchData) ? searchData : []);
      const matchingStudent = unassignedStudents.find((student: Record<string, unknown>) => {
        const studentUserId = typeof student.user === 'number'
          ? student.user
          : (typeof student.user === 'string' ? parseInt(student.user as string) : 0);
        return studentUserId === userId;
      });

      if (!matchingStudent) {
        toast.error('Xona biriktirilmagan talabalar orasida bu ariza egasi topilmadi! Avval arizani qabul qiling yoki talaba allaqachon xonaga biriktirilgan.');
        return;
      }

      const studentId = matchingStudent.id as number;

      // Xona biriktirish — maxsus API endpoint
      await api.assignRoom(studentId, {
        floor: selectedFloor,
        room: selectedRoom,
      });

      const formData = new FormData();
      formData.append('name', studentForm.name);
      formData.append('last_name', studentForm.last_name);
      formData.append('middle_name', studentForm.middle_name);
      formData.append('passport', studentForm.passport);
      formData.append('faculty', studentForm.faculty);
      formData.append('direction', studentForm.direction);
      formData.append('group', studentForm.group);
      formData.append('course', studentForm.course || '1-kurs');
      formData.append('gender', studentForm.gender);
      formData.append('phone', studentForm.phone);
      formData.append('placement_status', 'Joylashdi');
      formData.append('is_active', 'true');

      await api.updateStudent(studentId, formData);

      toast.success('Talaba xonaga biriktirildi!');
      onSuccess();
      handleClose();
    } catch (err) {
      toast.error((err as Error)?.message || 'Xatolik yuz berdi!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={handleClose}
        >
          <motion.div
            initial={{ scale: 0.95, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 20 }}
            className="bg-white dark:bg-surface-900 rounded-2xl shadow-sm w-full max-w-3xl p-6 sm:p-8 max-h-[90vh] overflow-y-auto border border-surface-200 dark:border-surface-800"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-brand-100 dark:bg-brand-900/30 rounded-xl text-brand-600 dark:text-brand-400">
                  <UserPlus className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl sm:text-2xl font-bold text-surface-900 dark:text-white">Talabalar ro'yxatiga qo'shish</h3>
                  <p className="text-sm text-surface-500 dark:text-surface-400">Talaba ma'lumotlarini tekshiring va yotoqxonaga joylashtiring</p>
                </div>
              </div>
              <button onClick={handleClose} className="p-2 hover:bg-surface-100 dark:hover:bg-surface-800 rounded-xl transition-colors duration-150 text-surface-400">
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-8">
              <div className="bg-surface-50 dark:bg-surface-800/30 p-4 sm:p-6 rounded-2xl border border-surface-100 dark:border-surface-800">
                <h4 className="text-sm font-bold text-surface-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Shaxsiy ma'lumotlar
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className={labelClass}>Ism <span className="text-danger-500">*</span></label>
                    <input type="text" value={studentForm.name} onChange={(e) => setStudentForm({ ...studentForm, name: e.target.value })} className={inputClass} placeholder="Ism" />
                  </div>
                  <div>
                    <label className={labelClass}>Familiya <span className="text-danger-500">*</span></label>
                    <input type="text" value={studentForm.last_name} onChange={(e) => setStudentForm({ ...studentForm, last_name: e.target.value })} className={inputClass} placeholder="Familiya" />
                  </div>
                  <div>
                    <label className={labelClass}>Otasining ismi</label>
                    <input type="text" value={studentForm.middle_name} onChange={(e) => setStudentForm({ ...studentForm, middle_name: e.target.value })} className={inputClass} placeholder="Otasining ismi" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                  <div>
                    <label className={labelClass}>Pasport <span className="text-danger-500">*</span></label>
                    <input type="text" value={studentForm.passport} onChange={(e) => setStudentForm({ ...studentForm, passport: e.target.value })} className={inputClass} placeholder="AA1234567" />
                  </div>
                  <div>
                    <label className={labelClass}>Telefon</label>
                    <input type="text" value={studentForm.phone} onChange={(e) => setStudentForm({ ...studentForm, phone: e.target.value })} className={inputClass} placeholder="+998901234567" />
                  </div>
                  <div>
                    <label className={labelClass}>Jinsi</label>
                    <select value={studentForm.gender} onChange={(e) => setStudentForm({ ...studentForm, gender: e.target.value })} className={`${inputClass} cursor-pointer`}>
                      <option value="Erkak">Erkak</option>
                      <option value="Ayol">Ayol</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="bg-surface-50 dark:bg-surface-800/30 p-4 sm:p-6 rounded-2xl border border-surface-100 dark:border-surface-800">
                <h4 className="text-sm font-bold text-surface-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <GraduationCap className="w-4 h-4" />
                  O'qish ma'lumotlari
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Fakultet</label>
                    <input type="text" value={studentForm.faculty} onChange={(e) => setStudentForm({ ...studentForm, faculty: e.target.value })} className={inputClass} placeholder="Fakultet" />
                  </div>
                  <div>
                    <label className={labelClass}>Yo'nalish</label>
                    <input type="text" value={studentForm.direction} onChange={(e) => setStudentForm({ ...studentForm, direction: e.target.value })} className={inputClass} placeholder="Yo'nalish" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className={labelClass}>Kurs</label>
                    <select value={studentForm.course} onChange={(e) => setStudentForm({ ...studentForm, course: e.target.value })} className={`${inputClass} cursor-pointer`}>
                      <option value="">Kursni tanlang</option>
                      <option value="1-kurs">1-kurs</option>
                      <option value="2-kurs">2-kurs</option>
                      <option value="3-kurs">3-kurs</option>
                      <option value="4-kurs">4-kurs</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Guruh</label>
                    <input type="text" value={studentForm.group} onChange={(e) => setStudentForm({ ...studentForm, group: e.target.value })} className={inputClass} placeholder="Guruh" />
                  </div>
                </div>
              </div>

              <div className="bg-brand-50 dark:bg-brand-900/10 p-4 sm:p-6 rounded-2xl border border-brand-100 dark:border-brand-900/30">
                <h4 className="text-sm font-bold text-brand-600 dark:text-brand-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Yotoqxonaga joylashtirish
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-brand-600/70 dark:text-brand-400/70 mb-2 ml-1">Qavat <span className="text-danger-500">*</span></label>
                    <select
                      value={selectedFloor}
                      onChange={(e) => { setSelectedFloor(Number(e.target.value)); setSelectedRoom(0); }}
                      className={`${inputClass} cursor-pointer border-brand-200 dark:border-brand-900/50`}
                    >
                      <option value={0}>Qavatni tanlang</option>
                      {floors.map((f) => (
                        <option key={f.id} value={f.id}>{f.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-brand-600/70 dark:text-brand-400/70 mb-2 ml-1">Xona <span className="text-danger-500">*</span></label>
                    <select
                      value={selectedRoom}
                      onChange={(e) => setSelectedRoom(Number(e.target.value))}
                      disabled={!selectedFloor}
                      className={`${inputClass} cursor-pointer border-brand-200 dark:border-brand-900/50 disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      <option value={0}>Xonani tanlang</option>
                      {rooms.map((r) => (
                        <option key={r.id} value={r.id}>{r.name} ({r.current_occupancy}/{r.capacity})</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 mt-10 pt-6 border-t border-surface-100 dark:border-surface-800">
              <button
                onClick={handleClose}
                className="flex-1 px-6 py-4 border border-surface-200 dark:border-surface-700 rounded-xl text-surface-700 dark:text-surface-300 font-bold hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors duration-150 active:scale-95"
              >
                Bekor qilish
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading || !selectedFloor || !selectedRoom}
                className="flex-[2] px-6 py-4 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-bold shadow-sm transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                    Saqlanmoqda...
                  </>
                ) : (
                  <>
                    <Check className="w-5 h-5" />
                    Ro'yxatga qo'shish va saqlash
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
