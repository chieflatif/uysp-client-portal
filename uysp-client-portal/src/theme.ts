/**
 * Rebel HQ Brand Style Guide - Oceanic Theme
 * 
 * Core Palette:
 * - Primary Dark BG: #111827 (bg-gray-900)
 * - Headline White: #ffffff (text-white)
 * - Body Text: #d1d5db (text-gray-300)
 * 
 * Oceanic Accent Palette:
 * - Primary Accent (Red): #be185d (text-pink-700) - Most important emphasis
 * - Secondary Accent (Blue): #4f46e5 (text-indigo-600) - Second level emphasis
 * - Tertiary Accent (Cyan): #22d3ee (text-cyan-400) - Final highlights
 */

export const theme = {
  // Core Palette
  core: {
    darkBg: 'bg-gray-900',
    darkBgHex: '#111827',
    white: 'text-white',
    whiteHex: '#ffffff',
    bodyText: 'text-gray-300',
    bodyTextHex: '#d1d5db',
  },

  // Oceanic Accent Palette
  accents: {
    primary: {
      name: 'Primary Accent (Red)',
      class: 'text-pink-700',
      hex: '#be185d',
      bgClass: 'bg-pink-700',
      usage: 'Most important emphasis - single key word or concept',
    },
    secondary: {
      name: 'Secondary Accent (Blue)',
      class: 'text-indigo-600',
      hex: '#4f46e5',
      bgClass: 'bg-indigo-600',
      usage: 'Second level emphasis - key benefits, interactive elements',
    },
    tertiary: {
      name: 'Tertiary Accent (Cyan)',
      class: 'text-cyan-400',
      hex: '#22d3ee',
      bgClass: 'bg-cyan-400',
      usage: 'Brightest accent - final points, attention-grabbing details',
    },
  },

  // Common Component Classes
  components: {
    button: {
      primary: 'bg-pink-700 hover:bg-pink-800 text-white font-semibold py-2 px-4 rounded transition',
      secondary: 'bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded transition',
      tertiary: 'bg-cyan-400 hover:bg-cyan-500 text-gray-900 font-semibold py-2 px-4 rounded transition',
      ghost: 'text-cyan-400 hover:text-cyan-300 border border-cyan-400 hover:border-cyan-300 font-semibold py-2 px-4 rounded transition',
    },
    card: 'bg-gray-800 border border-gray-700 rounded-lg p-6',
    badge: {
      primary: 'bg-pink-700 text-white px-3 py-1 rounded-full text-xs font-semibold',
      secondary: 'bg-indigo-600 text-white px-3 py-1 rounded-full text-xs font-semibold',
      tertiary: 'bg-cyan-400 text-gray-900 px-3 py-1 rounded-full text-xs font-semibold',
    },
    input: 'bg-gray-800 border border-gray-700 text-white placeholder-gray-500 rounded px-4 py-2 focus:outline-none focus:border-cyan-400',
  },
} as const;

export type Theme = typeof theme;
