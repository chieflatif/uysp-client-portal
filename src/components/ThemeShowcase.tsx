/**
 * Rebel HQ Oceanic Theme - Component Showcase
 * Demonstrates all available themed components
 */

import { theme } from '@/theme';

export function ThemeShowcase() {
  return (
    <div className={`min-h-screen ${theme.core.darkBg} p-12`}>
      <div className="max-w-6xl mx-auto space-y-12">
        {/* Header */}
        <div className="text-center space-y-4 border-b border-gray-700 pb-12">
          <h1 className={`text-5xl font-bold ${theme.core.white} mb-4`}>
            Rebel HQ <span className={theme.accents.primary.class}>Oceanic</span> Theme
          </h1>
          <p className={`text-xl ${theme.core.bodyText}`}>
            Design System & Component Showcase
          </p>
        </div>

        {/* Color Palette */}
        <section className="space-y-6">
          <h2 className={`text-3xl font-bold ${theme.core.white}`}>Color Palette</h2>
          
          <div className="grid grid-cols-4 gap-4">
            {/* Core Colors */}
            <div className={`${theme.components.card} text-center`}>
              <div className="bg-gray-900 h-32 rounded mb-4"></div>
              <p className={`text-xs ${theme.core.bodyText} mb-1`}>Primary Dark BG</p>
              <code className={`text-sm ${theme.accents.tertiary.class}`}>#111827</code>
            </div>

            <div className={`${theme.components.card} text-center`}>
              <div className="bg-white h-32 rounded mb-4"></div>
              <p className={`text-xs ${theme.core.bodyText} mb-1`}>Headline White</p>
              <code className={`text-sm ${theme.accents.tertiary.class}`}>#ffffff</code>
            </div>

            <div className={`${theme.components.card} text-center`}>
              <div className="bg-gray-300 h-32 rounded mb-4"></div>
              <p className={`text-xs ${theme.core.bodyText} mb-1`}>Body Text</p>
              <code className={`text-sm ${theme.accents.tertiary.class}`}>#d1d5db</code>
            </div>

            {/* Accents */}
            <div className={`${theme.components.card} text-center`}>
              <div className="bg-pink-700 h-32 rounded mb-4"></div>
              <p className={`text-xs ${theme.core.bodyText} mb-1`}>Primary (Red)</p>
              <code className={`text-sm ${theme.accents.tertiary.class}`}>#be185d</code>
            </div>

            <div className={`${theme.components.card} text-center`}>
              <div className="bg-indigo-600 h-32 rounded mb-4"></div>
              <p className={`text-xs ${theme.core.bodyText} mb-1`}>Secondary (Blue)</p>
              <code className={`text-sm ${theme.accents.tertiary.class}`}>#4f46e5</code>
            </div>

            <div className={`${theme.components.card} text-center`}>
              <div className="bg-cyan-400 h-32 rounded mb-4"></div>
              <p className={`text-xs ${theme.core.bodyText} mb-1`}>Tertiary (Cyan)</p>
              <code className={`text-sm ${theme.accents.tertiary.class}`}>#22d3ee</code>
            </div>
          </div>
        </section>

        {/* Buttons */}
        <section className="space-y-6">
          <h2 className={`text-3xl font-bold ${theme.core.white}`}>Buttons</h2>
          <div className="grid grid-cols-2 gap-4">
            <button className={theme.components.button.primary}>Primary Button</button>
            <button className={theme.components.button.secondary}>Secondary Button</button>
            <button className={theme.components.button.tertiary}>Tertiary Button</button>
            <button className={theme.components.button.ghost}>Ghost Button</button>
          </div>
        </section>

        {/* Badges */}
        <section className="space-y-6">
          <h2 className={`text-3xl font-bold ${theme.core.white}`}>Badges</h2>
          <div className="flex gap-4 flex-wrap">
            <span className={theme.components.badge.primary}>Primary Badge</span>
            <span className={theme.components.badge.secondary}>Secondary Badge</span>
            <span className={theme.components.badge.tertiary}>Tertiary Badge</span>
          </div>
        </section>

        {/* Text Styles */}
        <section className="space-y-6">
          <h2 className={`text-3xl font-bold ${theme.core.white}`}>Text Hierarchy</h2>
          <div className={theme.components.card}>
            <h3 className={`text-2xl font-bold ${theme.core.white} mb-4`}>
              Headline with <span className={theme.accents.primary.class}>Primary</span> accent
            </h3>
            <p className={`${theme.core.bodyText} mb-4`}>
              This is body text in the secondary color. It provides good contrast against the dark background.
            </p>
            <p className={`${theme.core.bodyText} text-sm`}>
              Smaller secondary text for captions and metadata.
            </p>
          </div>
        </section>

        {/* Cards */}
        <section className="space-y-6">
          <h2 className={`text-3xl font-bold ${theme.core.white}`}>Cards & Containers</h2>
          <div className="grid grid-cols-3 gap-4">
            <div className={theme.components.card}>
              <p className={`text-xs ${theme.accents.tertiary.class} font-semibold uppercase mb-2`}>
                Card Title
              </p>
              <p className={theme.core.bodyText}>Standard card with border and padding</p>
            </div>

            <div className={`${theme.components.card} border-l-4 border-pink-700`}>
              <p className={`text-xs ${theme.accents.primary.class} font-semibold uppercase mb-2`}>
                Accent Card
              </p>
              <p className={theme.core.bodyText}>Card with primary accent border</p>
            </div>

            <div className={`${theme.components.card} border-l-4 border-cyan-400`}>
              <p className={`text-xs ${theme.accents.tertiary.class} font-semibold uppercase mb-2`}>
                Highlight Card
              </p>
              <p className={theme.core.bodyText}>Card with tertiary accent border</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
