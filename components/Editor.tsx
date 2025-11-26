import React, { useEffect, useRef } from 'react';
import Editor, { OnMount } from '@monaco-editor/react';
import { Language, ThemeKey } from '../types';
import { THEMES } from '../constants';

interface CodeEditorProps {
  language: Language;
  code: string;
  onChange: (value: string | undefined) => void;
  theme: ThemeKey;
  fontSize: number;
  onIncreaseFontSize: () => void;
  onDecreaseFontSize: () => void;
  onWheelZoom: (e: React.WheelEvent) => void;
}

const CodeEditor: React.FC<CodeEditorProps> = ({ language, code, onChange, theme, fontSize, onIncreaseFontSize, onDecreaseFontSize, onWheelZoom }) => {
  const monacoRef = useRef<any>(null);

  const handleEditorDidMount: OnMount = (editor, monaco) => {
    monacoRef.current = monaco;
    applyTheme(theme);
  };

  const applyTheme = (themeKey: ThemeKey) => {
    if (monacoRef.current) {
      const themeConfig = THEMES[themeKey].monaco;
      monacoRef.current.editor.defineTheme('custom-theme', themeConfig);
      monacoRef.current.editor.setTheme('custom-theme');
    }
  };

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  return (
    <div 
      className="h-full w-full overflow-hidden rounded-lg border border-border shadow-xl bg-surface transition-colors duration-300 flex flex-col"
      onWheel={onWheelZoom}
    >
      {/* Editor Font Size Controls */}
      <div className="flex items-center justify-end gap-1 px-3 py-2 bg-background/50 border-b border-border">
        <button
          onClick={onDecreaseFontSize}
          className="p-1.5 rounded hover:bg-background transition-colors text-secondary hover:text-primary"
          title="Decrease Font Size"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <line x1="8" y1="12" x2="16" y2="12"/>
          </svg>
        </button>
        <span className="px-2 text-xs font-mono text-secondary min-w-[30px] text-center">{fontSize}</span>
        <button
          onClick={onIncreaseFontSize}
          className="p-1.5 rounded hover:bg-background transition-colors text-secondary hover:text-primary"
          title="Increase Font Size"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <line x1="8" y1="12" x2="16" y2="12"/>
            <line x1="12" y1="8" x2="12" y2="16"/>
          </svg>
        </button>
      </div>
      
      <Editor
        height="calc(100% - 36px)"
        language={language}
        value={code}
        onChange={onChange}
        onMount={handleEditorDidMount}
        options={{
          minimap: { enabled: false },
          fontSize: fontSize,
          fontFamily: '"Fira Code", monospace',
          fontLigatures: true,
          scrollBeyondLastLine: false,
          smoothScrolling: true,
          cursorBlinking: 'smooth',
          cursorSmoothCaretAnimation: 'on',
          padding: { top: 16, bottom: 16 },
          renderLineHighlight: 'all',
          lineNumbersMinChars: 3,
          automaticLayout: true,
          // Enable touch support for two-finger scrolling and zooming
          touch: {
            enableBasicTouchEvents: true,
            enableTouchBar: false,
          },
        }}
      />
    </div>
  );
};

export default CodeEditor;