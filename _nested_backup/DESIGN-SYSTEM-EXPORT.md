# Rebel HQ Design System - Quick Reference

**Export for**: New application  
**Framework**: Tailwind CSS (v4)  
**Theme**: Oceanic (Dark mode)

---

## Color Palette

### Core Colors
```css
/* Background */
--bg-primary: #111827;        /* bg-gray-900 - Main background */
--bg-secondary: #1f2937;      /* bg-gray-800 - Cards, panels */
--bg-tertiary: #374151;       /* bg-gray-700 - Borders, dividers */

/* Text */
--text-primary: #ffffff;      /* text-white - Headlines */
--text-secondary: #d1d5db;    /* text-gray-300 - Body text */
--text-tertiary: #9ca3af;     /* text-gray-400 - Muted text */
```

### Accent Colors (Oceanic Palette)
```css
/* Primary Accent - Pink/Magenta */
--accent-primary: #be185d;    /* text-pink-700 - Most important emphasis */

/* Secondary Accent - Indigo */
--accent-secondary: #4f46e5;  /* text-indigo-600 - Interactive elements */

/* Tertiary Accent - Cyan */
--accent-tertiary: #22d3ee;   /* text-cyan-400 - Highlights, links */
```

### Status Colors
```css
--success: #10b981;           /* text-green-500 */
--warning: #f59e0b;           /* text-orange-500 */
--error: #ef4444;             /* text-red-500 */
--info: #3b82f6;              /* text-blue-500 */
```

---

## Typography

### Font Stack
```css
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', sans-serif;
```

### Text Sizes
```css
--text-xs: 0.75rem;      /* 12px */
--text-sm: 0.875rem;     /* 14px */
--text-base: 1rem;       /* 16px - Body */
--text-lg: 1.125rem;     /* 18px */
--text-xl: 1.25rem;      /* 20px */
--text-2xl: 1.5rem;      /* 24px */
--text-3xl: 1.875rem;    /* 30px */
--text-4xl: 2.25rem;     /* 36px - Main headlines */
```

---

## Component Patterns

### Card
```tsx
<div className="bg-gray-800 rounded-lg p-6 border border-gray-700 shadow-lg">
  {/* Content */}
</div>
```

### Button - Primary
```tsx
<button className="px-6 py-3 bg-cyan-400 text-gray-900 rounded-lg font-semibold hover:bg-cyan-300 transition">
  Primary Action
</button>
```

### Button - Secondary
```tsx
<button className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition">
  Secondary Action
</button>
```

### Button - Outline
```tsx
<button className="px-6 py-3 border border-cyan-400 text-cyan-400 rounded-lg font-semibold hover:bg-cyan-400 hover:text-gray-900 transition">
  Outline Action
</button>
```

### Input Field
```tsx
<input className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 focus:outline-none transition" />
```

### Badge - Priority
```tsx
/* Critical */
<span className="px-3 py-1 bg-pink-700 text-white rounded-full text-xs font-bold">
  🔴 Critical
</span>

/* High */
<span className="px-3 py-1 bg-orange-600 text-white rounded-full text-xs font-bold">
  🟠 High
</span>

/* Medium */
<span className="px-3 py-1 bg-indigo-600 text-white rounded-full text-xs font-bold">
  🟡 Medium
</span>
```

### Table
```tsx
<div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
  <table className="w-full">
    <thead className="bg-gray-900 border-b border-gray-700">
      <tr>
        <th className="px-6 py-4 text-left text-xs font-semibold text-cyan-400 uppercase tracking-wider">
          Column
        </th>
      </tr>
    </thead>
    <tbody className="divide-y divide-gray-700">
      <tr className="hover:bg-gray-700 transition cursor-pointer">
        <td className="px-6 py-4 text-white">
          Cell content
        </td>
      </tr>
    </tbody>
  </table>
</div>
```

---

## Layout Patterns

### Page Container
```tsx
<div className="min-h-screen bg-gray-900 p-8">
  <div className="max-w-7xl mx-auto space-y-6">
    {/* Page content */}
  </div>
</div>
```

### Navigation Bar
```tsx
<nav className="bg-gray-900 border-b border-gray-700 sticky top-0 z-50">
  <div className="max-w-7xl mx-auto px-8">
    <div className="flex justify-between items-center h-16">
      {/* Nav content */}
    </div>
  </div>
</nav>
```

### Stats Grid
```tsx
<div className="grid grid-cols-1 md:grid-cols-4 gap-6">
  <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 border-l-4 border-l-cyan-400">
    <p className="text-xs text-gray-400 uppercase font-semibold mb-2">Metric Name</p>
    <p className="text-3xl font-bold text-white">1,234</p>
  </div>
</div>
```

---

## Quick Copy-Paste

### Tailwind Config
```javascript
module.exports = {
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: '#be185d',     // Pink
        secondary: '#4f46e5',   // Indigo
        tertiary: '#22d3ee',    // Cyan
      },
    },
  },
}
```

### CSS Variables (Alternative)
```css
:root {
  --color-bg-primary: #111827;
  --color-bg-secondary: #1f2937;
  --color-text-primary: #ffffff;
  --color-text-secondary: #d1d5db;
  --color-accent-pink: #be185d;
  --color-accent-indigo: #4f46e5;
  --color-accent-cyan: #22d3ee;
}
```

---

## Usage Guidelines

**Accent Hierarchy**:
1. **Cyan** (#22d3ee) - Primary interactive elements, links, buttons
2. **Indigo** (#4f46e5) - Secondary actions, tags
3. **Pink** (#be185d) - Critical alerts, important emphasis

**Dark Mode Only**: This design system is dark mode. For light mode, invert:
- Background: #ffffff
- Text: #111827
- Borders: #e5e7eb

---

## Complete Theme Object (Copy This)

```typescript
export const theme = {
  core: {
    darkBg: 'bg-gray-900',
    white: 'text-white',
    bodyText: 'text-gray-300',
  },
  accents: {
    primary: { class: 'text-pink-700', bgClass: 'bg-pink-700', hex: '#be185d' },
    secondary: { class: 'text-indigo-600', bgClass: 'bg-indigo-600', hex: '#4f46e5' },
    tertiary: { class: 'text-cyan-400', bgClass: 'bg-cyan-400', hex: '#22d3ee' },
  },
  components: {
    card: 'bg-gray-800 rounded-lg p-6 border border-gray-700 shadow-lg',
    input: 'w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 focus:outline-none transition',
    button: {
      primary: 'px-6 py-3 bg-cyan-400 text-gray-900 rounded-lg font-semibold hover:bg-cyan-300 transition',
      secondary: 'px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition',
      ghost: 'px-6 py-3 text-gray-300 hover:bg-gray-800 hover:text-white rounded-lg font-semibold transition',
    },
  },
};
```

---

**That's it! Give this to the next AI agent building your new app.**

