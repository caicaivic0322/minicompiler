
import React from 'react';
import { Play, Code2, Cpu, Palette } from 'lucide-react';
import { Language, ThemeKey } from '../types';
import { THEMES } from '../constants';

interface HeaderProps {
  language: Language;
  setLanguage: (lang: Language) => void;
  onRun: () => void;
  isRunning: boolean;
  theme: ThemeKey;
  setTheme: (theme: ThemeKey) => void;
}

const Header: React.FC<HeaderProps> = ({ language, setLanguage, onRun, isRunning, theme, setTheme }) => {
  return (
    <header className="flex flex-col md:flex-row items-center justify-between px-6 py-3 bg-background border-b border-border gap-4 transition-colors duration-300">
      {/* Brand */}
      <div className="flex items-center gap-3 self-start md:self-auto">
        <div className="p-2 bg-primary/10 rounded-lg">
          <Cpu className="text-primary" size={24} />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-mainText">极简编译器</h1>
          <p className="text-xs text-secondary font-medium tracking-wider uppercase">dev by Vic</p>
        </div>
        {/* Avatar */}
        <div className="ml-2 w-8 h-8 md:w-10 md:h-10 rounded-full overflow-hidden border border-border ring-2 ring-primary/20 shadow-sm animate-in fade-in zoom-in duration-300">
          <img src="/avatar.jpg" alt="User Avatar" className="w-full h-full object-cover" />
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
        
        {/* Theme Selector */}
        <div className="relative group">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
            <Palette size={16} className="text-secondary" />
          </div>
          <select
            value={theme}
            onChange={(e) => setTheme(e.target.value as ThemeKey)}
            className="appearance-none bg-surface border border-border text-mainText text-sm rounded-md pl-10 pr-8 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50 hover:border-primary/50 transition-all cursor-pointer min-w-[140px]"
          >
            {Object.entries(THEMES).map(([key, config]) => (
              <option key={key} value={key}>{config.name}</option>
            ))}
          </select>
          <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-secondary text-xs">
            ▼
          </div>
        </div>

        {/* Language Selector */}
        <div className="relative group">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
            <Code2 size={16} className="text-secondary" />
          </div>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as Language)}
            disabled={isRunning}
            className="appearance-none bg-surface border border-border text-mainText text-sm rounded-md pl-10 pr-8 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50 hover:border-primary/50 transition-all cursor-pointer disabled:opacity-50 min-w-[150px]"
            title="Switch Language for Current Tab"
          >
            <option value={Language.PYTHON}>Python</option>
            <option value={Language.CPP}>C++</option>
          </select>
          <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-secondary text-xs">
            ▼
          </div>
        </div>

        {/* Run Button */}
        <button
          onClick={onRun}
          disabled={isRunning}
          className={`
            flex items-center justify-center gap-2 px-5 py-2 rounded-md font-semibold text-sm transition-all shadow-lg 
            ${isRunning 
              ? 'bg-surface text-secondary cursor-not-allowed border border-border' 
              : 'bg-primary text-background hover:brightness-110 hover:shadow-primary/40 active:transform active:scale-95'}
          `}
        >
          {isRunning ? (
            <>
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
              Running
            </>
          ) : (
            <>
              <Play size={16} fill="currentColor" />
              Run
            </>
          )}
        </button>

      </div>
    </header>
  );
};

export default Header;
