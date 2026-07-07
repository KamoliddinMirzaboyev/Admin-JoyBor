# Admin-JoyBor: Flat/Minimal Redesign + Density Pass

## Maqsad
Admin panelning vizual uslubini zamonaviy va professional qilish (minimal/flat yo'nalish,
Linear/Notion uslubiga yaqin), shu bilan birga komponentlarni ixchamlashtirish (padding,
shrift, balandlik) — hozir komponentlar haddan tashqari katta va foydalanishga noqulay.

Qamrov: butun loyiha (barcha 22 sahifa/komponent). Asosiy brend rangi (blue-600) saqlanadi,
lekin gradientlar va og'ir soyalar olib tashlanadi.

## Dizayn tokenlari (`tailwind.config.js`)
- Gradientlar o'rniga tekis ranglar + tint fon (masalan ikonka uchun `bg-primary-50 text-primary-600`
  gradient doira o'rniga)
- Soyalar yengillashadi: kartalar uchun bitta `shadow-sm` + border-based ajratish; `shadow-2xl`,
  `shadow-glass`, `backdrop-blur-xl` kabi og'ir effektlar olib tashlanadi
- Radius bitta standartga tushadi: `rounded-xl` (hozir `xl`/`2xl`/`r-2xl` aralash ishlatilgan)
- Zichlik: karta padding `p-6`→`p-4`, `StatsCard` min-height (220px) olib tashlanadi,
  qiymat shrifti `text-3xl font-black`→`text-2xl font-semibold`, uppercase+tracking-wide olib tashlanadi

## Asosiy karkas
- `Sidebar.tsx`: shisha effekti (`backdrop-blur-xl`, `shadow-2xl`, `rounded-r-2xl`) olib tashlanadi,
  o'rniga tekis fon + ingichka o'ng border; faol nav band gradient o'rniga `bg-primary-50 text-primary-700`
  tint; tugma padding `py-3`→`py-2.5`
- `Navbar.tsx`, `Layout.tsx`: yangi tokenlarga moslashtiriladi, balandlik/padding siqiladi

## Yangi umumiy komponentlar
- `components/UI/Button.tsx` — variant (`primary/secondary/ghost/danger`) + size (`sm/md`).
  Hozir har sahifada qo'lda yozilgan tugma classlari shu bilan almashtiriladi.
- `components/UI/Badge.tsx` — status ko'rsatish uchun (to'langan/qarzdor, tasdiqlangan/rad etilgan
  va h.k.), hozir bir necha joyda alohida-alohida yozilgan.

## Umumiy UI komponentlar
- `StatsCard.tsx`: gradient doira ikonka → kichik tint-fon `rounded-lg` ikonka; min-height olib
  tashlanadi; qiymat/label shrifti kichraytiriladi
- `DataTable.tsx`, `BackButton.tsx`, `FloorRooms.tsx`, `ModernDatePicker.tsx`: yangi
  token/padding'ga moslashtiriladi (yangidan yozilmaydi, faqat class'lar yangilanadi)

## Ishlash tartibi
1. `tailwind.config.js` — token yangilash
2. `Layout.tsx`, `Sidebar.tsx`, `Navbar.tsx` — karkas
3. `Button.tsx`, `Badge.tsx` — yangi umumiy komponentlar
4. `StatsCard.tsx`, `DataTable.tsx`, boshqa umumiy `UI/*` komponentlar
5. `Dashboard.tsx` — StatsCard/chart orqali ko'p qismi avtomatik yangilanadi, chart ranglari flat qilinadi
6. Qolgan sahifalar (Students, Rooms, Payments, Applications, Staff, Attendance, Settings,
   Notifications, Profile, StaffProfile, StudentProfile, FloorDetail, ApplicationDetail, Login,
   NotFound) — token/komponent almashtirish, bespoke gradient/shadow joylarni tozalash

## Doirasiz qoladigan narsalar (YAGNI)
- Yangi dependency qo'shilmaydi (mavjud Tailwind + MUI + lucide-react bilan yetadi)
- Backend/API o'zgarmaydi, faqat frontend uslub
- Ranglar palitrasi (`primary`/`secondary`/`accent` hue'lari) o'zgarmaydi, faqat qo'llanilish
  uslubi (gradient→flat)

## Tekshirish
Har bosqichdan keyin `npm run dev` bilan light/dark rejimda vizual tekshirish. Avtomatlashtirilgan
test yo'q (loyihada mavjud emas) — vizual regressiyalarni qo'lda ko'rib chiqamiz.
