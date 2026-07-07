# Flat/Minimal Redesign — Phase 1 (Design System + Chrome) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Establish the flat/minimal design system (tokens, `Button`, `Badge`) and apply it to the app chrome (Sidebar, Navbar) and the two most-reused shared components (`StatsCard`, `DataTable`), plus the Dashboard page that consumes them — shrinking padding/font sizes and removing gradients/heavy shadows so the rest of the app can adopt the same look in Phase 2.

**Architecture:** No new dependencies. Tailwind utility classes only, using the existing `primary`/`secondary`/`accent` color scale already in `tailwind.config.js`. Two new tiny presentational components (`Button`, `Badge`) live in `src/components/UI/` next to the existing `StatsCard`/`DataTable`. Every other change is a class-string edit to an existing file — no new abstractions, no logic changes.

**Tech Stack:** React 18, TypeScript, Vite, Tailwind CSS. No test runner exists in this repo — verification is `npm run build` (typecheck) + `grep` checks for removed anti-patterns + manual visual check via `npm run dev`.

---

## File Structure

- Modify: `tailwind.config.js` — soften `shadow.card`, drop unused `shadow.glass`
- Create: `src/components/UI/Button.tsx` — shared button (variant/size)
- Create: `src/components/UI/Badge.tsx` — shared status pill
- Modify: `src/components/UI/BackButton.tsx` — use `Button` internally, drop gradient
- Modify: `src/components/UI/StatsCard.tsx` — flat icon chip, shrink padding/type scale
- Modify: `src/components/Layout/Sidebar.tsx` — drop glass/blur/gradient, shrink padding
- Modify: `src/components/Layout/Navbar.tsx` — flatten notification header + avatar gradient
- Modify: `src/components/UI/DataTable.tsx` — swap Filter/Export/pagination buttons to `Button`
- Modify: `src/pages/Dashboard.tsx` — flat chart bar fill instead of gradient

---

### Task 1: Soften shadow tokens

**Files:**
- Modify: `tailwind.config.js:60-67`

- [ ] **Step 1: Note current values**

Run: `grep -n "shadow" tailwind.config.js`
Expected output includes:
```
        glass: "0 8px 32px 0 rgba(31, 38, 135, 0.37)",
        card: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
```

- [ ] **Step 2: Replace the `boxShadow` block**

Replace:
```js
      boxShadow: {
        glass: "0 8px 32px 0 rgba(31, 38, 135, 0.37)",
        card: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
      },
```
With:
```js
      boxShadow: {
        card: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
      },
```

- [ ] **Step 3: Verify no remaining references to the removed token**

Run: `grep -rn "shadow-glass" ../Admin-JoyBor/src 2>/dev/null || grep -rn "shadow-glass" src`
Expected: no output (no matches).

- [ ] **Step 4: Commit**

```bash
git add tailwind.config.js
git commit -m "style: soften shadow-card token, drop unused shadow-glass"
```

---

### Task 2: Add `Button` component

**Files:**
- Create: `src/components/UI/Button.tsx`

- [ ] **Step 1: Create the component**

```tsx
import React from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-primary-600 text-white hover:bg-primary-700',
  secondary:
    'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700',
  ghost:
    'bg-transparent text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800',
  danger: 'bg-red-600 text-white hover:bg-red-700',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-sm gap-1.5',
  md: 'px-4 py-2 text-sm gap-2',
};

const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  ...rest
}) => (
  <button
    className={`inline-flex items-center justify-center rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
    {...rest}
  >
    {children}
  </button>
);

export default Button;
```

- [ ] **Step 2: Verify it compiles**

Run: `npm run build`
Expected: exits 0, no TypeScript errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/UI/Button.tsx
git commit -m "feat: add shared Button component"
```

---

### Task 3: Add `Badge` component

**Files:**
- Create: `src/components/UI/Badge.tsx`

- [ ] **Step 1: Create the component**

```tsx
import React from 'react';

type BadgeTone = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

interface BadgeProps {
  tone?: BadgeTone;
  children: React.ReactNode;
  className?: string;
}

const toneClasses: Record<BadgeTone, string> = {
  success: 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400',
  warning: 'bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400',
  danger: 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400',
  info: 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400',
  neutral: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
};

const Badge: React.FC<BadgeProps> = ({ tone = 'neutral', children, className = '' }) => (
  <span
    className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${toneClasses[tone]} ${className}`}
  >
    {children}
  </span>
);

export default Badge;
```

- [ ] **Step 2: Verify it compiles**

Run: `npm run build`
Expected: exits 0, no TypeScript errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/UI/Badge.tsx
git commit -m "feat: add shared Badge component"
```

---

### Task 4: Flatten `BackButton`

**Files:**
- Modify: `src/components/UI/BackButton.tsx`

- [ ] **Step 1: Replace the gradient button with `Button`**

Replace the entire file content with:
```tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import Button from './Button';

interface BackButtonProps {
  label?: string;
  onClick?: () => void;
  className?: string;
}

const BackButton: React.FC<BackButtonProps> = ({ label = 'Orqaga', onClick, className }) => {
  const navigate = useNavigate();
  return (
    <Button
      type="button"
      variant="secondary"
      onClick={onClick || (() => navigate(-1))}
      className={className}
      aria-label={label}
    >
      <ArrowLeft className="w-4 h-4" />
      <span>{label}</span>
    </Button>
  );
};

export default BackButton;
```

- [ ] **Step 2: Verify the gradient is gone**

Run: `grep -n "gradient" src/components/UI/BackButton.tsx`
Expected: no output (no matches).

- [ ] **Step 3: Verify it compiles**

Run: `npm run build`
Expected: exits 0.

- [ ] **Step 4: Commit**

```bash
git add src/components/UI/BackButton.tsx
git commit -m "style: flatten BackButton, drop gradient"
```

---

### Task 5: Flatten and shrink `StatsCard`

**Files:**
- Modify: `src/components/UI/StatsCard.tsx`

- [ ] **Step 1: Replace the whole file**

```tsx
import React from 'react';
import { LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';

interface StatsCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: 'increase' | 'decrease' | 'neutral';
  icon: LucideIcon;
  color?: 'primary' | 'secondary' | 'accent' | 'warning' | 'danger';
  trend?: number[];
  subStats?: { label: string; value: string | number }[];
}

const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  change,
  changeType = 'neutral',
  icon: Icon,
  color = 'primary',
  subStats,
}) => {
  const colorClasses = {
    primary: 'bg-primary-50 text-primary-600 dark:bg-primary-900/20 dark:text-primary-400',
    secondary: 'bg-secondary-50 text-secondary-600 dark:bg-secondary-900/20 dark:text-secondary-400',
    accent: 'bg-accent-50 text-accent-600 dark:bg-accent-900/20 dark:text-accent-400',
    warning: 'bg-yellow-50 text-yellow-600 dark:bg-yellow-900/20 dark:text-yellow-400',
    danger: 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400',
  };

  const changeClasses = {
    increase: 'text-green-600 dark:text-green-400',
    decrease: 'text-red-600 dark:text-red-400',
    neutral: 'text-gray-600 dark:text-gray-400',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-card border border-gray-200 dark:border-gray-700 p-4 flex flex-col gap-3"
    >
      <div className="flex items-center gap-3">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${colorClasses[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</h3>
      </div>

      {value !== undefined && (
        <div className="text-2xl font-semibold text-gray-900 dark:text-white">{value}</div>
      )}

      {subStats && subStats.length > 0 && (
        <div className="flex flex-col gap-1.5 pt-2 border-t border-gray-100 dark:border-gray-700">
          {subStats.map((stat, idx) => (
            <div key={idx} className="flex items-center justify-between text-sm">
              <span className="text-gray-500 dark:text-gray-400">{stat.label}</span>
              <span className="font-medium text-gray-900 dark:text-white">{stat.value}</span>
            </div>
          ))}
        </div>
      )}

      {change && (
        <p className={`text-xs font-medium ${changeClasses[changeType]}`}>{change}</p>
      )}
    </motion.div>
  );
};

export default StatsCard;
```

- [ ] **Step 2: Verify the old gradient/min-height are gone**

Run: `grep -n "gradient\|min-h-\[220px\]\|font-black" src/components/UI/StatsCard.tsx`
Expected: no output (no matches).

- [ ] **Step 3: Verify it compiles**

Run: `npm run build`
Expected: exits 0.

- [ ] **Step 4: Commit**

```bash
git add src/components/UI/StatsCard.tsx
git commit -m "style: flatten StatsCard icon chip, shrink padding and type scale"
```

---

### Task 6: Flatten and shrink `Sidebar`

**Files:**
- Modify: `src/components/Layout/Sidebar.tsx:63-153`

- [ ] **Step 1: Replace the sidebar shell (glass/blur/shadow-2xl → flat)**

Replace:
```tsx
    <motion.aside
      initial={false}
      animate={{
        width: sidebarCollapsed && !mobileOpen ? SIDEBAR_COLLAPSED : SIDEBAR_WIDTH,
        boxShadow: '0 8px 32px 0 rgba(0,0,0,0.12)',
      }}
      transition={{ type: 'spring', stiffness: 90, damping: 18, mass: 0.7 }}
      className="h-full flex flex-col bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border-r border-gray-200 dark:border-gray-700 rounded-r-2xl shadow-2xl overflow-hidden relative transition-all duration-300"
      style={{
        minWidth: sidebarCollapsed && !mobileOpen ? SIDEBAR_COLLAPSED : SIDEBAR_WIDTH,
        maxWidth: sidebarCollapsed && !mobileOpen ? SIDEBAR_COLLAPSED : SIDEBAR_WIDTH,
      }}
    >
      {/* Navigation */}
      <nav className="mt-10 px-3 flex-1">
        <ul className="space-y-2">
```
With:
```tsx
    <motion.aside
      initial={false}
      animate={{
        width: sidebarCollapsed && !mobileOpen ? SIDEBAR_COLLAPSED : SIDEBAR_WIDTH,
      }}
      transition={{ type: 'spring', stiffness: 90, damping: 18, mass: 0.7 }}
      className="h-full flex flex-col bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 overflow-hidden relative transition-all duration-300"
      style={{
        minWidth: sidebarCollapsed && !mobileOpen ? SIDEBAR_COLLAPSED : SIDEBAR_WIDTH,
        maxWidth: sidebarCollapsed && !mobileOpen ? SIDEBAR_COLLAPSED : SIDEBAR_WIDTH,
      }}
    >
      {/* Navigation */}
      <nav className="mt-6 px-3 flex-1">
        <ul className="space-y-1">
```

- [ ] **Step 2: Replace the nav item active state (gradient → flat tint)**

Replace:
```tsx
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => handleNavigation(item.href)}
                  className={`w-full flex items-center space-x-3 px-3 py-3 rounded-xl text-base font-medium transition-all duration-200 group ${
                    isActive
                      ? 'bg-gradient-to-r from-blue-500 to-blue-700 text-white shadow'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  <Icon
                    className={`w-6 h-6 flex-shrink-0 ${
                      isActive
                        ? 'text-white'
                        : 'text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300'
                    }`}
                  />
```
With:
```tsx
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => handleNavigation(item.href)}
                  className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150 group ${
                    isActive
                      ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  <Icon
                    className={`w-5 h-5 flex-shrink-0 ${
                      isActive
                        ? 'text-primary-600 dark:text-primary-400'
                        : 'text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300'
                    }`}
                  />
```

- [ ] **Step 3: Replace the active-indicator dot color and footer card gradient**

Replace:
```tsx
                  {isActive && !sidebarCollapsed && !mobileOpen && (
                    <motion.div
                      layoutId="activeIndicator"
                      className="ml-auto w-2 h-2 bg-white rounded-full"
                    />
                  )}
```
With:
```tsx
                  {isActive && !sidebarCollapsed && !mobileOpen && (
                    <motion.div
                      layoutId="activeIndicator"
                      className="ml-auto w-1.5 h-1.5 bg-primary-600 dark:bg-primary-400 rounded-full"
                    />
                  )}
```

Replace:
```tsx
            <div className="bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/20 dark:to-blue-900/40 rounded-xl p-3 border border-blue-200 dark:border-blue-800">
```
With:
```tsx
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
```

- [ ] **Step 4: Verify all gradients and the shadow-2xl/rounded-r-2xl are gone**

Run: `grep -n "gradient\|shadow-2xl\|rounded-r-2xl\|backdrop-blur-xl" src/components/Layout/Sidebar.tsx`
Expected: no output (no matches).

- [ ] **Step 5: Verify it compiles**

Run: `npm run build`
Expected: exits 0.

- [ ] **Step 6: Commit**

```bash
git add src/components/Layout/Sidebar.tsx
git commit -m "style: flatten Sidebar, remove glass/gradient effects, shrink nav items"
```

---

### Task 7: Flatten `Navbar` notification header and avatar

**Files:**
- Modify: `src/components/Layout/Navbar.tsx:192-197`, `:359`

- [ ] **Step 1: Replace the notification dropdown header gradient**

Replace:
```tsx
                      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-500 rounded-lg">
                              <Bell className="w-5 h-5 text-white" />
                            </div>
```
With:
```tsx
                      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary-50 dark:bg-primary-900/20 rounded-lg">
                              <Bell className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                            </div>
```

- [ ] **Step 2: Replace the profile avatar gradient**

Replace:
```tsx
                <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full flex items-center justify-center overflow-hidden">
```
With:
```tsx
                <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center overflow-hidden">
```

- [ ] **Step 3: Verify gradients are gone**

Run: `grep -n "gradient" src/components/Layout/Navbar.tsx`
Expected: no output (no matches).

- [ ] **Step 4: Verify it compiles**

Run: `npm run build`
Expected: exits 0.

- [ ] **Step 5: Commit**

```bash
git add src/components/Layout/Navbar.tsx
git commit -m "style: flatten Navbar notification header and avatar, drop gradients"
```

---

### Task 8: Swap `DataTable` buttons to `Button`

**Files:**
- Modify: `src/components/UI/DataTable.tsx:1-2`, `:102-121`, `:182-216`

- [ ] **Step 1: Import Button**

Replace:
```tsx
import React, { useState } from 'react';
import { Search, Filter, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
```
With:
```tsx
import React, { useState } from 'react';
import { Search, Filter, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import Button from './Button';
```

- [ ] **Step 2: Replace the Filter and Export buttons**

Replace:
```tsx
            {filterable && (
              <button className="flex items-center space-x-2 px-3 sm:px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors text-xs sm:text-sm">
                <Filter className="w-4 h-4" />
                <span>Filter</span>
              </button>
            )}
          </div>

          <div className="flex items-center space-x-2">
            {actions}
            {!hideExportButton && onExport && (
              <button
                className="flex items-center space-x-2 px-3 sm:px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-xs sm:text-sm"
                onClick={onExport}
                type="button"
              >
                <Download className="w-4 h-4" />
                <span>Export</span>
              </button>
            )}
          </div>
```
With:
```tsx
            {filterable && (
              <Button type="button" variant="secondary" size="sm">
                <Filter className="w-4 h-4" />
                <span>Filter</span>
              </Button>
            )}
          </div>

          <div className="flex items-center space-x-2">
            {actions}
            {!hideExportButton && onExport && (
              <Button type="button" variant="primary" size="sm" onClick={onExport}>
                <Download className="w-4 h-4" />
                <span>Export</span>
              </Button>
            )}
          </div>
```

- [ ] **Step 3: Replace the pagination prev/next buttons**

Replace:
```tsx
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
```
With:
```tsx
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
```

Replace:
```tsx
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
```
With:
```tsx
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
```

- [ ] **Step 4: Verify it compiles**

Run: `npm run build`
Expected: exits 0.

- [ ] **Step 5: Commit**

```bash
git add src/components/UI/DataTable.tsx
git commit -m "refactor: use shared Button in DataTable controls and pagination"
```

---

### Task 9: Flatten the Dashboard revenue chart bar

**Files:**
- Modify: `src/pages/Dashboard.tsx:234`, `:303-313`

- [ ] **Step 1: Shrink the chart card padding**

This exact class string appears twice (Revenue Chart card and Room Status card) — replace **all** occurrences:
```tsx
          className="bg-white dark:bg-gray-800 rounded-xl shadow-card p-6 border border-gray-200 dark:border-gray-700"
```
With:
```tsx
          className="bg-white dark:bg-gray-800 rounded-xl shadow-card p-4 border border-gray-200 dark:border-gray-700"
```

- [ ] **Step 2: Replace the gradient bar fill with a solid color**

Replace:
```tsx
                <Bar
                  dataKey="income"
                  fill="url(#barGradient)"
                  radius={[4, 4, 0, 0]}
                />
                <defs>
                  <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" />
                    <stop offset="100%" stopColor="#1d4ed8" />
                  </linearGradient>
                </defs>
```
With:
```tsx
                <Bar dataKey="income" fill="#2563eb" radius={[4, 4, 0, 0]} />
```

- [ ] **Step 3: Verify the gradient def is gone**

Run: `grep -n "barGradient" src/pages/Dashboard.tsx`
Expected: no output (no matches).

- [ ] **Step 4: Verify it compiles**

Run: `npm run build`
Expected: exits 0.

- [ ] **Step 5: Commit**

```bash
git add src/pages/Dashboard.tsx
git commit -m "style: flatten Dashboard chart bar fill, shrink chart card padding"
```

---

### Task 10: Manual visual check (whole Phase 1 surface)

**Files:** none (verification only)

- [ ] **Step 1: Start the dev server**

Run: `npm run dev`

- [ ] **Step 2: Check each surface in light and dark mode**

Open the app and toggle the theme button in the navbar. Confirm:
- Sidebar: flat background, no blur, active nav item is a light blue tint (not a gradient block)
- Navbar: notification bell dropdown header is flat gray, bell icon chip is light blue, profile avatar is solid blue
- Dashboard: stat cards are shorter, icon sits in a small tinted square, revenue bar chart is solid blue (not gradient)
- Table pages (e.g. Students): Filter/Export buttons and pagination arrows look and behave the same as before, just restyled

- [ ] **Step 3: Stop the dev server (Ctrl+C)**

No commit for this task — it's a checkpoint, not a code change.

---

## Notes for Phase 2

Phase 2 (not part of this plan) applies the same recipe — flat icon chips instead of gradients, `shadow-card` instead of `shadow-2xl`/`shadow-glass`, `Button`/`Badge` instead of hand-rolled classes, tighter padding — to the remaining ~14 pages (Students, Rooms, Payments, Applications, Staff, Attendance, Settings, Notifications, Profile, StaffProfile, StudentProfile, FloorDetail, ApplicationDetail, Login, NotFound). Write that plan after Phase 1 lands, using the finished `Button`/`Badge`/`StatsCard`/`Sidebar` as the concrete reference.
