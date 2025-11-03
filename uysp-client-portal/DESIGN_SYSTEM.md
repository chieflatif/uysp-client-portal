# 🎨 Rebel HQ Oceanic Theme - Design System

## Overview

The UYSP Client Portal uses the official **Rebel HQ Oceanic Theme** for consistent branding and professional visual identity across all interfaces.

---

## 📋 Core Brand Palette

### Primary Dark Background
- **Hex**: `#111827`
- **Tailwind**: `bg-gray-900`
- **Usage**: Main background for all digital assets

### Headline White
- **Hex**: `#ffffff`
- **Tailwind**: `text-white`
- **Usage**: Primary headlines and major text elements

### Body Text
- **Hex**: `#d1d5db`
- **Tailwind**: `text-gray-300`
- **Usage**: Sub-headlines, body copy, secondary text

---

## 🌊 Oceanic Accent Palette

### Primary Accent (Red)
- **Hex**: `#be185d`
- **Tailwind**: `text-pink-700` / `bg-pink-700`
- **Usage**: Most important emphasis, single key concept
- **Example**: Main CTA buttons, critical alerts

### Secondary Accent (Blue)
- **Hex**: `#4f46e5`
- **Tailwind**: `text-indigo-600` / `bg-indigo-600`
- **Usage**: Second-level emphasis, interactive elements
- **Example**: Secondary buttons, form inputs

### Tertiary Accent (Cyan)
- **Hex**: `#22d3ee`
- **Tailwind**: `text-cyan-400` / `bg-cyan-400`
- **Usage**: Brightest accent, final highlights, callouts
- **Example**: Filter buttons, active states, success feedback

---

## 🎯 Design Hierarchy

The colors are applied strategically to create visual hierarchy:

1. **Primary Accent (Red)** - Use sparingly for THE most important element
2. **Secondary Accent (Blue)** - Use for important interactive elements
3. **Tertiary Accent (Cyan)** - Use for active states, highlights, success
4. **Core Colors** - Use for all other text and backgrounds

---

## 🔌 Component Library

### Buttons

#### Primary Button (Red)
```tsx
className="bg-pink-700 hover:bg-pink-800 text-white font-semibold py-2 px-4 rounded transition"
// Usage: Main CTAs, most important actions
```

#### Secondary Button (Blue)
```tsx
className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded transition"
// Usage: Secondary actions, forms
```

#### Tertiary Button (Cyan)
```tsx
className="bg-cyan-400 hover:bg-cyan-500 text-gray-900 font-semibold py-2 px-4 rounded transition"
// Usage: Active states, filter toggles
```

#### Ghost Button (Outlined)
```tsx
className="text-cyan-400 hover:text-cyan-300 border border-cyan-400 hover:border-cyan-300 font-semibold py-2 px-4 rounded transition"
// Usage: Optional actions, secondary interactions
```

### Badges

#### Primary Badge (Red)
```tsx
className="bg-pink-700 text-white px-3 py-1 rounded-full text-xs font-semibold"
// Usage: High priority, critical status
```

#### Secondary Badge (Blue)
```tsx
className="bg-indigo-600 text-white px-3 py-1 rounded-full text-xs font-semibold"
// Usage: Medium priority, secondary status
```

#### Tertiary Badge (Cyan)
```tsx
className="bg-cyan-400 text-gray-900 px-3 py-1 rounded-full text-xs font-semibold"
// Usage: Highlights, success states
```

### Cards

#### Standard Card
```tsx
className="bg-gray-800 border border-gray-700 rounded-lg p-6"
```

#### Card with Accent Border
```tsx
className="bg-gray-800 border border-gray-700 border-l-4 border-l-pink-700 rounded-lg p-6"
// Accent options: border-l-pink-700, border-l-indigo-600, border-l-cyan-400
```

### Form Inputs
```tsx
className="bg-gray-800 border border-gray-700 text-white placeholder-gray-500 rounded px-4 py-2 focus:outline-none focus:border-cyan-400"
```

---

## 📐 Layout & Spacing

### Container Width
- Maximum width: `max-w-7xl` (80rem)
- Padding: `p-8` for page-level, `p-6` for sections

### Spacing Scale
- Gaps between elements: `gap-3` to `gap-6`
- Margins: `mb-2`, `mb-4`, `mb-6`, `mb-8` (increasing importance)

### Border Radius
- Standard: `rounded-lg` (8px)
- Badges: `rounded-full` (50%)
- Cards: `rounded-lg` (8px)

---

## 🎨 Usage Guidelines

### Text Emphasis Hierarchy

**Most Important Word**: Use Primary Accent (Red)
```tsx
<h1>Your <span className="text-pink-700">Leads</span></h1>
```

**Secondary Emphasis**: Use Secondary Accent (Blue)
```tsx
<p>Track your <span className="text-indigo-600">qualified leads</span></p>
```

**Highlights/Callouts**: Use Tertiary Accent (Cyan)
```tsx
<p className="text-cyan-400">New: AI Lead Scoring</p>
```

### Color Usage by Component Type

| Component | Primary | Secondary | Tertiary | Note |
|-----------|---------|-----------|----------|------|
| Main CTA | Red | — | — | Reserve for primary action |
| Secondary CTA | — | Blue | — | Secondary forms, dialogs |
| Active State | — | — | Cyan | Filter buttons, active tabs |
| Alert/Error | Red | — | — | Critical issues |
| Success | — | — | Cyan | Confirmations, successes |
| Info | — | Blue | — | Informational messages |

---

## 🖼️ Example: Leads Page Structure

```tsx
// Page Background
<div className="bg-gray-900 min-h-screen">
  
  // Page Title
  <h1 className="text-white text-4xl">
    Your <span className="text-pink-700">Leads</span>
  </h1>
  
  // Subtitle
  <p className="text-gray-300">Manage and track qualified leads</p>
  
  // Filter Buttons
  <button className="bg-cyan-400 text-gray-900"> {/* Active */}
    All Leads
  </button>
  <button className="bg-gray-800 text-gray-300"> {/* Inactive */}
    High ICP
  </button>
  
  // Card with Data
  <div className="bg-gray-800 border border-gray-700 border-l-4 border-l-indigo-600">
    <h3 className="text-white font-bold">Lead Name</h3>
    <p className="text-gray-300">Company • Email</p>
    <span className="bg-pink-700 text-white px-3 py-1 rounded-full">
      High Priority
    </span>
  </div>
  
</div>
```

---

## ⚡ Quick Start for New Components

1. **Import theme**: `import { theme } from '@/lib/theme'`
2. **Use core colors** for backgrounds and body text
3. **Reserve accents** for emphasis:
   - Red: Most important (1 per page max)
   - Blue: Secondary emphasis (2-3 per page)
   - Cyan: Highlights (as needed)
4. **Test contrast** - Always check readability
5. **Be consistent** - Use same colors for similar elements

---

## 🔍 Accessibility Notes

- Cyan (#22d3ee) on gray-900 has good contrast for interactive elements
- White text on gray-900 provides 18.5:1 contrast ratio (AAA)
- Gray-300 on gray-900 provides 7.5:1 contrast ratio (AA)
- All accent colors maintain sufficient contrast for WCAG AA compliance

---

## 📱 Responsive Design

The theme works seamlessly across all screen sizes:
- Mobile: `p-4` to `p-6`, `gap-2` to `gap-4`
- Tablet: `p-6` to `p-8`, `gap-3` to `gap-6`
- Desktop: `p-8`, `gap-6` standard

---

## 🎓 Template

Use this template when creating new pages:

```tsx
'use client';

import { theme } from '@/lib/theme';

export default function NewPage() {
  return (
    <div className={`min-h-screen ${theme.core.darkBg} p-8`}>
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <h1 className={`text-4xl font-bold ${theme.core.white}`}>
          Page <span className={theme.accents.primary.class}>Title</span>
        </h1>
        
        {/* Content */}
        <div className={theme.components.card}>
          <p className={theme.core.bodyText}>Your content here</p>
        </div>
        
        {/* CTA */}
        <button className={theme.components.button.primary}>
          Primary Action
        </button>
        
      </div>
    </div>
  );
}
```

---

## 🚀 Ready to Build

All components are themed and ready to use. Just import `theme` from `@/lib/theme` and apply the color classes to create beautiful, consistent UIs!
