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
}

const CodeEditor: React.FC<CodeEditorProps> = ({ language, code, onChange, theme, fontSize }) => {
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
    <div className="h-full w-full overflow-hidden rounded-lg border border-border shadow-xl bg-surface transition-colors duration-300">
      <Editor
        height="100%"
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
        }}
      />
    </div>
  );
};

export default CodeEditor;