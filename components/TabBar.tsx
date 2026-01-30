
import React, { useState, useRef, useEffect } from 'react';
import { Plus, X, FileCode, FileJson, BookOpen, Save, Download, Server, Check, AlertCircle, FolderOpen, LogIn, LogOut, User, ZoomIn, ZoomOut } from 'lucide-react';
import { EditorTab, Language, ExampleSnippet, User as UserType } from '../types';
import { CPP_EXAMPLES, PYTHON_EXAMPLES } from '../constants';

interface TabBarProps {
  tabs: EditorTab[];
  activeTabId: string;
  onSwitch: (id: string) => void;
  onClose: (id: string, e: React.MouseEvent) => void;
  onAdd: (template?: ExampleSnippet) => void;
  onSaveToServer?: (tab: EditorTab) => Promise<boolean>;
  onOpenServerFiles?: () => void;
  onShowLogin?: () => void;
  onLogout?: () => void;
  user?: UserType | null;
  onFontIncrease?: () => void;
  onFontDecrease?: () => void;
}

const TabBar: React.FC<TabBarProps> = ({ 
  tabs, activeTabId, onSwitch, onClose, onAdd, onSaveToServer,
  onOpenServerFiles, onShowLogin, onLogout, user,
  onFontIncrease, onFontDecrease
}) => {
  const isMaxTabs = tabs.length >= 3;
  const [showExamples, setShowExamples] = useState(false);
  const [showSaveMenu, setShowSaveMenu] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const examplesRef = useRef<HTMLDivElement>(null);
  const saveMenuRef = useRef<HTMLDivElement>(null);

  const activeTab = tabs.find(t => t.id === activeTabId);
  const currentLanguage = activeTab ? activeTab.language : Language.CPP;
  const currentExamples = currentLanguage === Language.PYTHON ? PYTHON_EXAMPLES : CPP_EXAMPLES;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (examplesRef.current && !examplesRef.current.contains(event.target as Node)) {
        setShowExamples(false);
      }
      if (saveMenuRef.current && !saveMenuRef.current.contains(event.target as Node)) {
        setShowSaveMenu(false);
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

  // Download file locally
  const handleDownloadLocal = () => {
    if (!activeTab) return;
    
    const blob = new Blob([activeTab.code], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = activeTab.title;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    setSaveStatus('success');
    setTimeout(() => setSaveStatus('idle'), 2000);
    setShowSaveMenu(false);
  };

  // Save to server
  const handleSaveToServer = async () => {
    if (!activeTab || !onSaveToServer) return;
    
    setSaveStatus('saving');
    try {
      const success = await onSaveToServer(activeTab);
      setSaveStatus(success ? 'success' : 'error');
    } catch {
      setSaveStatus('error');
    }
    setTimeout(() => setSaveStatus('idle'), 2000);
    setShowSaveMenu(false);
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
        </div>
      )}

      {/* Actions (pushed to right if needed, but here just inline) */}
      <div className="flex items-center gap-1 ml-auto relative z-20">
        
        {/* Font Size Controls */}
        {onFontDecrease && onFontIncrease && (
          <>
            <button
              onClick={onFontDecrease}
              className="flex items-center justify-center p-1.5 rounded-md text-secondary hover:bg-surface hover:text-primary transition-colors"
              title="Decrease Font Size"
            >
              <ZoomOut size={16} />
            </button>
            <button
              onClick={onFontIncrease}
              className="flex items-center justify-center p-1.5 rounded-md text-secondary hover:bg-surface hover:text-primary transition-colors"
              title="Increase Font Size"
            >
              <ZoomIn size={16} />
            </button>
            <div className="w-px h-4 bg-border/50 mx-1" />
          </>
        )}

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
            <div className="absolute top-full right-0 mt-1 w-48 bg-surface border border-border rounded-lg shadow-xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-100">
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

        {/* Save Button */}
        <div ref={saveMenuRef} className="relative">
          <button
            onClick={() => setShowSaveMenu(!showSaveMenu)}
            className={`flex items-center justify-center p-1.5 rounded-md transition-colors ${
              saveStatus === 'success' 
                ? 'text-success bg-success/10' 
                : saveStatus === 'error' 
                  ? 'text-error bg-error/10' 
                  : saveStatus === 'saving'
                    ? 'text-primary animate-pulse'
                    : 'text-secondary hover:bg-surface hover:text-primary'
            }`}
            title="Save File"
          >
            {saveStatus === 'success' ? (
              <Check size={16} />
            ) : saveStatus === 'error' ? (
              <AlertCircle size={16} />
            ) : (
              <Save size={16} />
            )}
          </button>

          {/* Save Dropdown */}
          {showSaveMenu && (
            <div className="absolute top-full right-0 mt-1 w-52 bg-surface border border-border rounded-lg shadow-xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-100">
              <div className="px-3 py-2 text-xs font-semibold text-secondary uppercase bg-background/50 border-b border-border">
                保存文件
              </div>
              <div className="py-1">
                <button
                  onClick={handleDownloadLocal}
                  className="w-full text-left px-4 py-2.5 text-sm text-mainText hover:bg-background/80 hover:text-primary transition-colors flex items-center gap-3"
                >
                  <Download size={14} className="opacity-70" />
                  <div>
                    <div className="font-medium">下载到本地</div>
                    <div className="text-xs text-secondary">保存为 {activeTab?.title}</div>
                  </div>
                </button>
                <button
                  onClick={handleSaveToServer}
                  disabled={!onSaveToServer}
                  className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center gap-3 ${
                    onSaveToServer 
                      ? 'text-mainText hover:bg-background/80 hover:text-primary' 
                      : 'text-secondary/50 cursor-not-allowed'
                  }`}
                >
                  <Server size={14} className="opacity-70" />
                  <div>
                    <div className="font-medium">保存到服务器</div>
                    <div className="text-xs text-secondary">
                      {user ? '同步到云端存储' : '需要先登录'}
                    </div>
                  </div>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Open from Server Button */}
        <button
          onClick={onOpenServerFiles}
          className="flex items-center justify-center p-1.5 rounded-md text-secondary hover:bg-surface hover:text-primary transition-colors"
          title="从服务器打开文件"
        >
          <FolderOpen size={16} />
        </button>

        {/* Divider */}
        <div className="w-px h-4 bg-border/50 mx-1" />

        {/* Login/Logout Button */}
        {user ? (
          <div className="flex items-center gap-1">
            <div className="flex items-center gap-1.5 px-2 py-1 bg-success/10 rounded-md">
              <User size={14} className="text-success" />
              <span className="text-xs font-medium text-success">{user.username}</span>
            </div>
              <button
                onClick={onLogout}
                className="flex items-center justify-center p-1.5 rounded-md text-secondary hover:bg-error/10 hover:text-error transition-colors"
                title="退出登录"
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <button
              onClick={onShowLogin}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-secondary hover:bg-primary/10 hover:text-primary transition-colors"
              title="登录"
            >
              <LogIn size={16} />
              <span className="text-xs font-medium">登录</span>
            </button>
          )}
      </div>
    </div>
  );
};

export default TabBar;
