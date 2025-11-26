
import React, { useState, useRef, useEffect } from 'react';
import { Plus, X, FileCode, FileJson, BookOpen } from 'lucide-react';
import { EditorTab, Language, ExampleSnippet } from '../types';
import { CPP_EXAMPLES, PYTHON_EXAMPLES } from '../constants';

interface TabBarProps {
  tabs: EditorTab[];
  activeTabId: string;
  onSwitch: (id: string) => void;
  onClose: (id: string, e: React.MouseEvent) => void;
  onAdd: (template?: ExampleSnippet) => void;
}

const TabBar: React.FC<TabBarProps> = ({ tabs, activeTabId, onSwitch, onClose, onAdd }) => {
  const isMaxTabs = tabs.length >= 3;
  const [showExamples, setShowExamples] = useState(false);
  const examplesRef = useRef<HTMLDivElement>(null);

  const activeTab = tabs.find(t => t.id === activeTabId);
  const currentLanguage = activeTab ? activeTab.language : Language.CPP;
  const currentExamples = currentLanguage === Language.PYTHON ? PYTHON_EXAMPLES : CPP_EXAMPLES;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (examplesRef.current && !examplesRef.current.contains(event.target as Node)) {
        setShowExamples(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getIcon = (lang: Language) => {
    return lang === Language.PYTHON ? <FileJson size={14} className="text-primary" /> : <FileCode size={14} className="text-accent" />;
  };

  const handleSnippetClick = (snippet: ExampleSnippet) => {
    onAdd(snippet);
    setShowExamples(false);
  };

  return (
    <div className="flex items-center gap-1 mb-0 px-1 overflow-visible select-none relative">
      <div className="flex items-center gap-1 overflow-x-auto no-scrollbar max-w-[calc(100%-80px)]">
        {tabs.map((tab) => {
          const isActive = tab.id === activeTabId;
          return (
            <div
              key={tab.id}
              onClick={() => onSwitch(tab.id)}
              className={`
                group flex items-center gap-2 px-3 py-2 rounded-t-lg border-t border-x cursor-pointer transition-all min-w-[120px] max-w-[160px] relative
                ${isActive
                  ? 'bg-surface border-border text-mainText font-medium z-10 -mb-[1px] border-b-transparent shadow-sm'
                  : 'bg-background border-transparent text-secondary hover:bg-surface/50 hover:text-mainText'
                }
              `}
            >
              {getIcon(tab.language)}
              <span className="truncate text-xs flex-1">{tab.title}</span>

              {tabs.length > 1 && (
                <button
                  onClick={(e) => onClose(tab.id, e)}
                  className={`
                    p-0.5 rounded-full opacity-0 group-hover:opacity-100 hover:bg-border transition-all
                    ${isActive ? 'opacity-100' : ''}
                  `}
                  title="Close Tab"
                >
                  <X size={12} />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {!isMaxTabs && (
        <div className="flex items-center ml-1 relative z-20">
          <button
            onClick={() => onAdd()}
            className="flex items-center justify-center p-1.5 rounded-md text-secondary hover:bg-surface hover:text-primary transition-colors"
            title="New Tab (Default)"
          >
            <Plus size={16} />
          </button>

          <div ref={examplesRef} className="relative">
            <button
              onClick={() => setShowExamples(!showExamples)}
              className="flex items-center justify-center p-1.5 rounded-md text-secondary hover:bg-surface hover:text-accent transition-colors"
              title={`${currentLanguage === Language.PYTHON ? 'Python' : 'C++'} Examples Library`}
            >
              <BookOpen size={16} />
            </button>

            {/* Examples Dropdown */}
            {showExamples && (
              <div className="absolute top-full left-0 mt-1 w-48 bg-surface border border-border rounded-lg shadow-xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-3 py-2 text-xs font-semibold text-secondary uppercase bg-background/50 border-b border-border">
                  {currentLanguage === Language.PYTHON ? 'Python' : 'C++'} Examples
                </div>
                <div className="py-1 max-h-[300px] overflow-y-auto">
                  {currentExamples.map((example, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSnippetClick(example)}
                      className="w-full text-left px-4 py-2 text-sm text-mainText hover:bg-background/80 hover:text-primary transition-colors flex items-center gap-2"
                    >
                      {currentLanguage === Language.PYTHON ? <FileJson size={12} className="opacity-70" /> : <FileCode size={12} className="opacity-70" />}
                      {example.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TabBar;
