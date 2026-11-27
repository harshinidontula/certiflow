import React from 'react';
import { useTheme } from '../context/ThemeContext';

export const ThemeToggle: React.FC = () => {
  const { cycleTheme } = useTheme();

  return (
    <button
      onClick={cycleTheme}
      className="relative p-2.5 rounded-xl border transition-all duration-200 hover:scale-105 active:scale-95 flex items-center justify-center cursor-pointer shadow-xs group"
      style={{
        backgroundColor: 'var(--bg-surface)',
        borderColor: 'var(--border-color)',
        color: 'var(--text-primary)',
      }}
      aria-label="🌓"
      title="🌓"
    >
      {/* Half Moon Symbol */}
      <svg
        className="w-5 h-5 transition-transform duration-300 group-hover:rotate-12"
        viewBox="0 0 24 24"
        fill="currentColor"
        stroke="none"
      >
        {/* Crisp Half Moon: left half shaded, right half open border */}
        <path d="M12 3a9 9 0 0 0 0 18v-18z" />
        <path
          d="M12 3a9 9 0 0 1 0 18"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    </button>
  );
};
