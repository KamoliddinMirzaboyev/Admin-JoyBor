import React, { useState, useEffect } from 'react';
import DataTable from '../components/UI/DataTable';
import { toast } from 'sonner';
import Select from 'react-select';
import { Link, useLocation } from 'react-router-dom';
import { useStudents, useFloors, useRooms } from '../hooks/api/useApi';
import { link } from '../data/config';

// react-select custom styles for dark mode
const selectStyles = {
  control: (base: Record<string, unknown>, state: { isFocused: boolean }) => ({
    ...base,
    backgroundColor: document.documentElement.classList.contains('dark') ? '#1f2937' : '#fff',
    borderColor: state.isFocused ? (document.documentElement.classList.contains('dark') ? '#60a5fa' : '#3b82f6') : (document.documentElement.classList.contains('dark') ? '#374151' : '#d1d5db'),
    boxShadow: state.isFocused ? `0 0 0 2px ${document.documentElement.classList.contains('dark') ? '#60a5fa' : '#3b82f6'}` : undefined,
    minHeight: 40,
    fontSize: 15,
  }),
  menu: (base: Record<string, unknown>) => ({
    ...base,
    backgroundColor: document.documentElement.classList.contains('dark') ? '#1f2937' : '#fff',
    color: document.documentElement.classList.contains('dark') ? '#fff' : '#111827',
    zIndex: 9999,
  }),
  singleValue: (base: Record<string, unknown>) => ({
    ...base,
    color: document.documentElement.classList.contains('dark') ? '#fff' : '#111827',
  }),
  input: (base: Record<string, unknown>) => ({
    ...base,
    color: document.documentElement.classList.contains('dark') ? '#fff' : '#111827',
  }),
  placeholder: (base: Record<string, unknown>) => ({
    ...base,
    color: document.documentElement.classList.contains('dark') ? '#d1d5db' : '#6b7280',
  }),
  option: (base: Record<string, unknown>, state: { isSelected: boolean; isFocused: boolean }) => ({
    ...base,
    backgroundColor: state.isSelected
      ? (document.documentElement.classList.contains('dark') ? '#2563eb' : '#3b82f6')
      : state.isFocused
        ? (document.documentElement.classList.contains('dark') ? '#374151' : '#e0e7ef')
        : 'transparent',
    color: state.isSelected || document.documentElement.classList.contains('dark') ? '#fff' : '#111827',
    cursor: 'pointer',
  }),
};

const Students: React.FC = () => {
  const [editingStudent, setEditingStudent] = useState<Record<string, unknown> | null>(null);

  // formData'ga gender va course string maydonini qo'sh
  const [formData, setFormData] = useState<{
    firstName: string;
    lastName: string;
    fatherName: string;
    phone: string;
    room: string;
    course: string;
    faculty: string;
    group: string;
    region: string;
    district: string;
    passport: string;
    isPrivileged: boolean;
    privilegeShare: string;
    avatar: string | File;
    direction: string;
    floor: string;
    gender: string;
    passportImage1: string | File | null;
    passportImage2: string | File | null;
  }>({
    firstName: "",
    lastName: "",
    fatherName: "",
    phone: "",
    room: "",
    course: "1-kurs",
    faculty: "",
    group: "",
    region: "",
    district: "",
    passport: "",
    isPrivileged: false,
    privilegeShare: "",
    avatar: "",
    direction: "",
    floor: "",
    gender: "",
    passportImage1: null,
    passportImage2: null,
  });
  const [loading, setLoading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string>("");



  const location = useLocation();

  // Fetch students using custom hook with caching
  const { data: studentsData, isLoading, error: fetchError, refetch } = useStudents({ is_active: true });
  
  // Extract results and filter active students
  const students = React.useMemo(() => {
    const results = Array.isArray(studentsData?.results) ? studentsData.results : [];
    return results.filter((student: Record<string, unknown>) => student.is_active !== false);
  }, [studentsData]);

  // Demo ma'lumotlar (Modal uchun)
  const provincesData = [
    { id: 1, name: 'Toshkent' },
    { id: 2, name: 'Samarqand' },
    { id: 3, name: 'Buxoro' },
    { id: 4, name: 'Farg\'ona' },
    { id: 5, name: 'Andijon' },
  ];

  const districtsData = formData.region ? [
    { id: 1, name: 'Chilonzor', province: Number(formData.region) },
    { id: 2, name: 'Yunusobod', province: Number(formData.region) },
    { id: 3, name: 'Mirzo Ulug\'bek', province: Number(formData.region) },
    { id: 4, name: 'Yakkasaroy', province: Number(formData.region) },
  ] : [];

  const floorsData = [
    { id: 1, name: '1-qavat', available_rooms: 5 },
    { id: 2, name: '2-qavat', available_rooms: 3 },
    { id: 3, name: '3-qavat', available_rooms: 4 },
    { id: 4, name: '4-qavat', available_rooms: 2 },
  ];

  const roomsData = formData.floor ? [
    { id: 1, name: '101', capacity: 4, occupied_beds: 2, floor: Number(formData.floor) },
    { id: 2, name: '102', capacity: 4, occupied_beds: 1, floor: Number(formData.floor) },
    { id: 3, name: '103', capacity: 4, occupied_beds: 3, floor: Number(formData.floor) },
    { id: 4, name: '104', capacity: 4, occupied_beds: 0, floor: Number(formData.floor) },
  ] : [];

  const regionOptions = Array.isArray(provincesData)
    ? provincesData.map((p: any) => ({ value: String(p.id), label: p.name }))
    : [];
  const districtOptions = Array.isArray(districtsData)
    ? districtsData.map((d: any) => ({ value: String(d.id), label: d.name }))
    : [];
  const floorOptions = Array.isArray(floorsData)
    ? floorsData.map((f: any) => ({
      value: String(f.id),
      label: `${f.name.endsWith('-qavat') ? f.name : `${f.name}-qavat`} ${(f as { gender?: string }).gender === 'male' ? '(Yigitlar)' : '(Qizlar)'}`
    }))
    : [];
  const roomOptions = Array.isArray(roomsData)
    ? (roomsData as any[])
      .sort((a, b) => {
        // Xona nomlarini raqam bo'yicha saralash
        const aNum = parseInt(a.name.replace(/\D/g, '')) || 0;
        const bNum = parseInt(b.name.replace(/\D/g, '')) || 0;
        return aNum - bNum;
      })
      .map((r) => ({ value: String(r.id), label: r.name }))
    : [];



  const columns = [
    {
      key: "index",
      title: "№",
      render: (_: unknown, row: Record<string, unknown>) => (
        <span className="text-gray-500 dark:text-gray-400 font-semibold">{(row._idx as number) + 1}</span>
      ),
    },
    {
      key: "fullName",
      title: "Familiya Ism",
      sortable: true,
      render: (_: unknown, row: Record<string, unknown>) => (
        <Link to={`/studentprofile/${row.id}`} className="font-medium text-blue-600 hover:underline dark:text-blue-400">{String(row.last_name)} {String(row.name)}</Link>
      ) as React.ReactNode,
    },
    {
      key: "direction",
      title: "Yo'nalish",
      render: (value: unknown) => <span className="text-sm text-gray-700 dark:text-gray-300">{value ? String(value) : '-'}</span>,
    },
    {
      key: "room_name",
      title: "Xona",
      render: (value: unknown) => <span className="px-2 py-1 bg-primary-100 dark:bg-primary-900/20 text-primary-800 dark:text-primary-300 rounded-full text-sm font-medium">{value ? String(value) : "-"}</span>,
    },
    {
      key: "floor_name",
      title: "Qavat",
      render: (value: unknown) => <span className="text-sm text-gray-700 dark:text-gray-300">{value ? String(value) : "-"}</span>,
    },
    {
      key: "payment_summary",
      title: "To'lov holati",
      render: (value: any) => {
        const isDebtor = value?.is_debtor;
        return (
          <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
            !isDebtor 
              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
              : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
          }`}>
            {!isDebtor ? 'Haqdor' : 'Qarzdor'}
          </span>
        );
      },
    },
    {
      key: "payment_summary",
      title: "Jami to'lov",
      render: (value: any) => (
        <div className="flex flex-col">
          <span className="text-sm font-bold text-gray-900 dark:text-white">
            {value?.total_amount ? Number(value.total_amount).toLocaleString() : '0'}
          </span>
          <span className="text-[10px] text-gray-400 font-bold uppercase">UZS</span>
        </div>
      ),
    },
  ];

  // Actions column for edit
  const columnsWithActions = [
    ...columns,
    {
      key: 'actions',
      title: 'Amallar',
      render: (_: unknown, row: Record<string, unknown>) => {
        return (
          <button
            className="px-3 py-1 rounded bg-yellow-500 text-white hover:bg-yellow-600 text-sm font-semibold"
            onClick={() => handleEdit(row as Record<string, unknown>)}
          >
            Tahrirlash
          </button>
        );
      },
    },
  ];



  // Edit handler
  const handleEdit = (student: Record<string, unknown>) => {
    setEditingStudent(student);
    const room = student.room as { id: number } | undefined;
    const province = student.province as { id: number } | undefined;
    const district = student.district as { id: number } | undefined;
    const floor = student.floor as { id: number } | undefined;
    
    setFormData({
      firstName: String(student.first_name || ""),
      lastName: String(student.last_name || ""),
      fatherName: String(student.father_name || ""),
      phone: String(student.phone || ""),
      room: room?.id ? String(room.id) : "",
      course: String(student.course || "1-kurs"),
      faculty: String(student.faculty || ""),
      group: String(student.group || ""),
      region: province?.id ? String(province.id) : "",
      district: district?.id ? String(district.id) : "",
      passport: String(student.passport || ""),
      isPrivileged: Boolean(student.privilege),
      privilegeShare: String(student.privilegeShare || ""),
      avatar: String(student.picture || ""),
      direction: String(student.direction || ""),
      floor: floor?.id ? String(floor.id) : "",
      gender: String(student.gender || ""),
      passportImage1: null,
      passportImage2: null,
    });
    setAvatarPreview(String(student.picture || ""));
    // Note: Edit functionality moved to Student Profile page
    toast.info("Tahrirlash uchun talaba profiliga o'ting");
  };

  // Validation funksiyasi
  const validateForm = () => {
    const errors: string[] = [];

    // Majburiy maydonlarni tekshirish
    if (!formData.firstName.trim()) {
      errors.push("Ism kiritilishi shart");
    }
    if (!formData.lastName.trim()) {
      errors.push("Familiya kiritilishi shart");
    }
    if (!formData.fatherName.trim()) {
      errors.push("Otasining ismi kiritilishi shart");
    }
    if (!formData.phone.trim()) {
      errors.push("Telefon raqami kiritilishi shart");
    }
    if (!formData.passport.trim()) {
      errors.push("Pasport seriyasi kiritilishi shart");
    }
    if (!formData.direction.trim()) {
      errors.push("Yo'nalish kiritilishi shart");
    }
    if (!formData.faculty.trim()) {
      errors.push("Fakultet kiritilishi shart");
    }
    if (!formData.group.trim()) {
      errors.push("Guruh kiritilishi shart");
    }
    if (!formData.gender.trim()) {
      errors.push("Jins tanlanishi shart");
    }
    if (!formData.course.trim()) {
      errors.push("Kurs tanlanishi shart");
    }
    if (!formData.region.trim()) {
      errors.push("Viloyat tanlanishi shart");
    }
    if (!formData.district.trim()) {
      errors.push("Tuman tanlanishi shart");
    }
    if (!formData.floor.trim()) {
      errors.push("Qavat tanlanishi shart");
    }
    if (!formData.room.trim()) {
      errors.push("Xona tanlanishi shart");
    }


    // Telefon raqami formatini tekshirish
    if (formData.phone.trim()) {
      const phoneRegex = /^(\+998|998|8)?[0-9]{9}$/;
      const cleanPhone = formData.phone.replace(/[\s\-()]/g, '');
      if (!phoneRegex.test(cleanPhone)) {
        errors.push("Telefon raqami noto'g'ri formatda");
      }
    }

    // Pasport formatini tekshirish
    if (formData.passport.trim()) {
      const passportRegex = /^[A-Z]{2}[0-9]{7}$/;
      if (!passportRegex.test(formData.passport.toUpperCase())) {
        errors.push("Pasport seriyasi noto'g'ri formatda (masalan: AB1234567)");
      }
    }

    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation tekshirish (faqat yangi talaba qo'shishda)
    if (!editingStudent) {
      const validationErrors = validateForm();
      if (validationErrors.length > 0) {
        // Birinchi xatolikni ko'rsatish
        toast.error(validationErrors[0]);
        return;
      }
    }

    if (editingStudent) {
      setLoading(true);
      try {
        const token = sessionStorage.getItem('access');
        // Prepare payload according to API documentation using FormData
        const formDataPayload = new FormData();
        formDataPayload.append('name', formData.firstName);
        formDataPayload.append('last_name', formData.lastName);
        formDataPayload.append('middle_name', formData.fatherName);
        formDataPayload.append('phone', formData.phone);
        formDataPayload.append('faculty', formData.faculty);
        formDataPayload.append('direction', formData.direction);
        formDataPayload.append('group', formData.group);
        formDataPayload.append('passport', formData.passport);
        formDataPayload.append('privilege', String(formData.isPrivileged));
        formDataPayload.append('course', formData.course);
        formDataPayload.append('gender', formData.gender);
        formDataPayload.append('province', formData.region ? String(Number(formData.region)) : '0');
        formDataPayload.append('district', formData.district ? String(Number(formData.district)) : '0');
        formDataPayload.append('floor', formData.floor ? String(Number(formData.floor)) : '0');
        formDataPayload.append('room', formData.room ? String(Number(formData.room)) : '0');

        await fetch(
          `${link}/students/${editingStudent.id}/`,
          {
            method: 'PATCH',
            headers: {
              'Authorization': `Bearer ${token}`,
              // Content-Type is NOT set for FormData
            },
            body: formDataPayload
          }
        );
        toast.success('Talaba maʼlumotlari yangilandi!');
        refetch();
      } catch {
        toast.error('Talaba maʼlumotlarini saqlashda xatolik!');
      } finally {
        setLoading(false);
      }
      return;
    }
    try {
      await addStudent();
      // addStudent already calls refetch and closes modal
    } catch (err) {
      console.error('Error in handleSubmit:', err);
      toast.error("Xatolik yuz berdi!");
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleSelectChange = (name: string, option: { value: string; label: string } | null) => {
    setFormData(prev => {
      const newData = {
        ...prev,
        [name]: option ? option.value : '',
      };

      // Agar qavat o'zgarsa, xonani tozalash
      if (name === 'floor') {
        newData.room = '';
      }

      // Agar viloyat o'zgarsa, tumanni tozalash
      if (name === 'region') {
        newData.district = '';
      }

      return newData;
    });
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.checked,
    }));
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({ ...prev, avatar: file }));
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  // Add filter states for gender, payment status, room, and floor
  const [genderFilter, setGenderFilter] = useState("");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("");
  const [roomFilter, setRoomFilter] = useState("");
  const [floorFilter, setFloorFilter] = useState("");

  // Fetch real data for filters
  const { data: floorsDataAPI } = useFloors();
  const { data: roomsDataAPI } = useRooms();

  const floorFilterOptions = React.useMemo(() => {
    const results = Array.isArray(floorsDataAPI?.results) ? floorsDataAPI.results : (Array.isArray(floorsDataAPI) ? floorsDataAPI : []);
    return results.map((f: any) => ({ value: String(f.id), label: f.name }));
  }, [floorsDataAPI]);

  const allRoomOptions = React.useMemo(() => {
    const results = Array.isArray(roomsDataAPI?.results) ? roomsDataAPI.results : (Array.isArray(roomsDataAPI) ? roomsDataAPI : []);
    // If floor filter is selected, filter rooms by floor
    const filtered = floorFilter 
      ? results.filter((r: any) => String(r.floor) === floorFilter)
      : results;
    
    return filtered.map((r: any) => ({ value: String(r.id), label: r.name }));
  }, [roomsDataAPI, floorFilter]);

  // Debug: API dan kelayotgan ma'lumotlarni ko'rish
  React.useEffect(() => {
    if (students.length > 0) {
      console.log('Students data sample:', students.slice(0, 2).map((s: any) => ({
        name: s.name,
        total_amount: s.payment_summary?.total_amount,
        is_debtor: s.payment_summary?.is_debtor,
        gender: s.gender
      })));
    }
  }, [students]);

  // Filtering and sorting logic
  const filteredStudents = students
    .filter((s: any) => {
      // Gender filter validation

      // Gender filter - API dan kelayotgan qiymatlarni tekshirish
      let matchesGender = true;
      if (genderFilter) {
        const studentGender = String(s.gender || '').toLowerCase().trim();
        const filterGender = genderFilter.toLowerCase();

        // Barcha mumkin bo'lgan variantlarni tekshirish
        matchesGender = studentGender === filterGender ||
          (studentGender === 'erkak' && filterGender === 'male') ||
          (studentGender === 'ayol' && filterGender === 'female') ||
          (studentGender === 'male' && filterGender === 'male') ||
          (studentGender === 'female' && filterGender === 'female') ||
          (studentGender === 'м' && filterGender === 'male') || // Rus tilida
          (studentGender === 'ж' && filterGender === 'female'); // Rus tilida

        // Debug gender filter
        if (genderFilter && students.indexOf(s) < 3) {
          console.log(`Gender filter debug for ${s.name}:`, {
            studentGender,
            filterGender,
            matchesGender
          });
        }
      }

      // Payment filter
      let matchesPayment = true;

      if (paymentStatusFilter) {
        // payment_summary.is_debtor field logic: false -> Haqdor, true -> Qarzdor
        const isDebtor = Boolean(s.payment_summary?.is_debtor);
        const isHaqdor = !isDebtor;
        const isQarzdor = isDebtor;

        // Filter bo'yicha tekshirish
        if (paymentStatusFilter === "haqdor") {
          matchesPayment = isHaqdor;
        } else if (paymentStatusFilter === "qarzdor") {
          matchesPayment = isQarzdor;
        }

        // Debug payment filter (faqat birinchi 3 ta talaba uchun)
        if (paymentStatusFilter && students.indexOf(s) < 3) {
          console.log(`Payment filter debug for ${s.name || s.last_name}:`, {
            isDebtor,
            isHaqdor,
            isQarzdor,
            filter: paymentStatusFilter,
            matchesPayment
          });
        }
      }

      // Room filter
      let matchesRoom = true;
      if (roomFilter) {
        const studentRoomId = s.room as number | undefined;
        matchesRoom = studentRoomId ? String(studentRoomId) === roomFilter : false;
      }

      // Floor filter
      let matchesFloor = true;
      if (floorFilter) {
        const studentFloorId = s.floor as number | undefined;
        matchesFloor = studentFloorId ? String(studentFloorId) === floorFilter : false;
      }

      const finalMatch = matchesGender && matchesPayment && matchesRoom && matchesFloor;

      // Debug final filter result
      if ((genderFilter || paymentStatusFilter || roomFilter || floorFilter) && students.indexOf(s) < 3) {
        console.log(`Final filter result for ${s.name}:`, {
          matchesGender,
          matchesPayment,
          matchesRoom,
          matchesFloor,
          finalMatch
        });
      }

      return finalMatch;
    })
    .sort((a: any, b: any) => {
      // Familiya bo'yicha alifbo tartibida saralash
      const lastNameA = String(a.last_name || '').toLowerCase();
      const lastNameB = String(b.last_name || '').toLowerCase();
      return lastNameA.localeCompare(lastNameB, 'uz-UZ');
    });





  // Listen for global student updates
  useEffect(() => {
    // Event listener for student updates
    const handleStudentUpdate = () => {
      refetch();
    };
    window.addEventListener('student-updated', handleStudentUpdate);
    return () => {
      window.removeEventListener('student-updated', handleStudentUpdate);
    };
  }, [refetch]);



  // Loading state
  if (isLoading && students.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-500 border-solid"></div>
      </div>
    );
  }

  // Error state
  if (fetchError) {
    return (
      <div className="text-center py-10 text-red-600 dark:text-red-400">
        Ma'lumotlarni yuklashda xatolik yuz berdi.
      </div>
    );
  }

  // Add student function for modal
  const addStudent = async () => {
    setLoading(true); // 🔄 loader ON
    const myHeaders = new Headers();
    myHeaders.append(
      "Authorization",
      `Bearer ${sessionStorage.getItem("access")}`
    );

    const formdata = new FormData();
    if (formData.firstName) formdata.append("name", formData.firstName);
    if (formData.lastName) formdata.append("last_name", formData.lastName);
    if (formData.fatherName) formdata.append("middle_name", formData.fatherName);
    if (formData.region) formdata.append("province", String(parseInt(formData.region)));
    if (formData.district) formdata.append("district", String(parseInt(formData.district)));
    if (formData.passport) formdata.append("passport", formData.passport);
    if (formData.group) formdata.append("group", formData.group);
    if (formData.faculty) formdata.append("faculty", formData.faculty);
    if (formData.direction) formdata.append("direction", formData.direction);
    if (formData.floor) formdata.append("floor", String(parseInt(formData.floor)));
    if (formData.room) formdata.append("room", String(parseInt(formData.room)));
    if (formData.phone) formdata.append("phone", formData.phone);
    formdata.append("tarif", "1200000"); // Default tarif
    if (formData.isPrivileged) formdata.append("privilege", String(formData.isPrivileged));
    if (formData.privilegeShare) {
      formdata.append("privilegeShare", formData.privilegeShare);
    }
    if (formData.gender) formdata.append("gender", formData.gender);
    if (formData.course) formdata.append("course", formData.course);
    // Avatar handling - both File and URL string
    if (formData.avatar) {
      if (typeof formData.avatar !== "string" && formData.avatar instanceof File) {
        // File upload
        formdata.append("picture", formData.avatar);
      } else if (typeof formData.avatar === "string" && formData.avatar.trim()) {
        // URL string - send as picture_url
        formdata.append("picture_url", formData.avatar);
      }
    }

    // Passport images handling
    if (formData.passportImage1) {
      if (typeof formData.passportImage1 !== "string" && formData.passportImage1 instanceof File) {
        formdata.append("passport_image_first", formData.passportImage1);
      } else if (typeof formData.passportImage1 === "string" && formData.passportImage1.trim()) {
        formdata.append("passport_image_first_url", formData.passportImage1);
      }
    }

    if (formData.passportImage2) {
      if (typeof formData.passportImage2 !== "string" && formData.passportImage2 instanceof File) {
        formdata.append("passport_image_second", formData.passportImage2);
      } else if (typeof formData.passportImage2 === "string" && formData.passportImage2.trim()) {
        formdata.append("passport_image_second_url", formData.passportImage2);
      }
    }

    const requestOptions = {
      method: "POST",
      headers: myHeaders,
      body: formdata,
    };

    fetch(`${link}/student/create/`, requestOptions)
      .then(async (response) => {
        let result;
        try {
          result = await response.json();
        } catch {
          result = {};
        }
        if (!response.ok) {
          // API error logged
          toast.error(result.detail || result.message || JSON.stringify(result) || "Xatolik yuz berdi");
          throw new Error(result.detail || result.message || JSON.stringify(result) || "Xatolik yuz berdi");
        }
        // Force immediate refetch
        await refetch();
        // Emit global event
        window.dispatchEvent(new CustomEvent('student-updated', { detail: { action: 'created' } }));
        toast.success("Talaba muvaffaqiyatli qo'shildi!");
      })
      .catch((error) => {
        // Catch error logged
        toast.error(error.message || "Xatolik yuz berdi");
      })
      .finally(() => {
        setLoading(false); // 🔄 loader OFF
      });
  };

  // Export handler for DataTable
  const handleExportStudents = async () => {
    try {
      const token = sessionStorage.getItem('access');
      if (!token) {
        toast.error('Avtorizatsiya talab qilinadi!');
        return;
      }
      const response = await fetch(`${link}/export-student/`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/json',
        },
      });
      if (!response.ok) {
        toast.error('Export xatolik yuz berdi!');
        return;
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `talabalar_ro'yxati_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('Talabalar ro\'yxati muvaffaqiyatli yuklandi!');
    } catch {
      toast.error('Export xatolik yuz berdi!');
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-4 sm:py-8 px-1 sm:px-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0 mb-4 sm:mb-6">
        <div>
          <h1 className="text-xl sm:text-3xl font-bold text-gray-900 dark:text-white">Talabalar</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1 text-xs sm:text-base">
            Yotoqxonada yashayotgan talabalar ro'yxati
            {(genderFilter || paymentStatusFilter || roomFilter) && (
              <span className="ml-2 text-blue-600 dark:text-blue-400 font-medium">
                ({filteredStudents.length} ta natija)
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Filter va qidiruv */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
        <div className="flex flex-wrap gap-3 items-center">
          <Select
            options={[
              { value: "male", label: "Erkak" },
              { value: "female", label: "Ayol" },
            ]}
            value={genderFilter ? { value: genderFilter, label: genderFilter === "male" ? "Erkak" : "Ayol" } : null}
            onChange={(opt: any) => setGenderFilter(opt ? String(opt.value) : "")}
            isClearable
            placeholder="Jins"
            styles={selectStyles}
            classNamePrefix="react-select"
            className="min-w-[120px]"
          />
          <Select
            options={[
              { value: "haqdor", label: "Haqdor" },
              { value: "qarzdor", label: "Qarzdor" },
            ]}
            value={paymentStatusFilter ? { value: paymentStatusFilter, label: paymentStatusFilter === "haqdor" ? "Haqdor" : "Qarzdor" } : null}
            onChange={(opt: any) => setPaymentStatusFilter(opt ? String(opt.value) : "")}
            isClearable
            placeholder="To'lov holati"
            styles={selectStyles}
            classNamePrefix="react-select"
            className="min-w-[140px]"
          />
          <Select
            options={floorFilterOptions}
            value={floorFilter ? floorFilterOptions.find((opt: any) => opt.value === floorFilter) || null : null}
            onChange={(opt: any) => {
              setFloorFilter(opt ? String(opt.value) : "");
              setRoomFilter(""); // Reset room when floor changes
            }}
            isClearable
            placeholder="Qavat"
            styles={selectStyles}
            classNamePrefix="react-select"
            className="min-w-[120px]"
          />
          <Select
            options={allRoomOptions}
            value={roomFilter ? allRoomOptions.find((opt: any) => opt.value === roomFilter) || null : null}
            onChange={(opt: any) => setRoomFilter(opt ? String(opt.value) : "")}
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
                setGenderFilter("");
                setPaymentStatusFilter("");
                setRoomFilter("");
                setFloorFilter("");
              }}
              className="px-3 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              Filterlarni tozalash
            </button>
          )}
        </div>

        {/* Filter results info */}
        {(genderFilter || paymentStatusFilter || roomFilter || floorFilter) && (
          <div className="text-sm text-gray-600 dark:text-gray-400">
            <span className="font-medium text-blue-600 dark:text-blue-400">
              {filteredStudents.length}
            </span> ta natija topildi
            {genderFilter && (
              <span className="ml-2 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded text-xs">
                {genderFilter === "male" ? "Erkak" : "Ayol"}
              </span>
            )}
            {paymentStatusFilter && (
              <span className={`ml-2 px-2 py-1 rounded text-xs ${paymentStatusFilter === "haqdor"
                ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
                : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300"
                }`}>
                {paymentStatusFilter === "haqdor" ? "Haqdor" : "Qarzdor"}
              </span>
            )}
            {floorFilter && (
              <span className="ml-2 px-2 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded text-xs">
                {floorFilterOptions.find((opt: any) => opt.value === floorFilter)?.label || floorFilter}
              </span>
            )}
            {roomFilter && (
              <span className="ml-2 px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded text-xs">
                {allRoomOptions.find((opt: any) => opt.value === roomFilter)?.label || roomFilter}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Data Table */}
      <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
        <DataTable
          data={filteredStudents.map((s: any, idx: number) => ({ ...s, _idx: idx }))}
          columns={columns}
          actions={null}
          searchable={true}
          filterable={false}
          pagination={true}
          pageSize={10}
          onExport={handleExportStudents}
        />
      </div>

    </div>
  );
};

export default Students;
