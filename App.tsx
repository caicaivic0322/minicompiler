
import React, { useState, useEffect, useCallback, useRef, Suspense, lazy } from 'react';
import Header from './components/Header';
import Console from './components/Console';
import TabBar from './components/TabBar';
import SaveModal from './components/SaveModal';
import { Language, ConsoleMessage, ThemeKey, EditorTab, ExampleSnippet } from './types';
import { SNIPPETS, THEMES, buildApiUrl } from './constants';
import { initPyodide, runPythonCode } from './services/pyodideService';
import { initCpp, runCppCode } from './services/cppService';

const CodeEditor = lazy(() => import('./components/Editor'));

function App() {
  // Theme State
  const [theme, setTheme] = useState<ThemeKey>('cream');
  const [isEditorLoaded, setIsEditorLoaded] = useState(false);
  const editorLoadTimerRef = useRef<number | null>(null);
  const hasInitializedRef = useRef(false);
  
  // Rename Modal State
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [tabToRenameId, setTabToRenameId] = useState<string | null>(null);

  // Tab State
  const [tabs, setTabs] = useState<EditorTab[]>([
    { id: '1', title: 'main.cpp', code: SNIPPETS[Language.CPP], language: Language.CPP }
  ]);
  const [activeTabId, setActiveTabId] = useState<string>('1');

  const activeTab = tabs.find(t => t.id === activeTabId) || tabs[0];

  // Console State
  const [messages, setMessages] = useState<ConsoleMessage[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [runtimeStatus, setRuntimeStatus] = useState({
    python: false,
    cpp: false
  });

  // Font Size State
  const [editorFontSize, setEditorFontSize] = useState(14);
  const [ioFontSize, setIoFontSize] = useState(13);

  const handleEditorFontIncrease = () => setEditorFontSize(prev => Math.min(prev + 1, 32));
  const handleEditorFontDecrease = () => setEditorFontSize(prev => Math.max(prev - 1, 10));

  const handleConsoleFontIncrease = () => setIoFontSize(prev => Math.min(prev + 1, 32));
  const handleConsoleFontDecrease = () => setIoFontSize(prev => Math.max(prev - 1, 10));

  // Resizing State
  const [consoleWidth, setConsoleWidth] = useState(40);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Input State
  const [stdin, setStdin] = useState('');

  const addLog = (type: ConsoleMessage['type'], content: string) => {
    setMessages(prev => {
      if (type === 'system') {
        const last = prev[prev.length - 1];
        if (last && last.type === 'system' && last.content === content) {
          return prev;
        }
      }
      return [...prev, { type, content, timestamp: Date.now() }];
    });
  };

  const handleClearConsole = () => {
    setMessages([]);
  };

  // Apply Theme CSS Variables
  useEffect(() => {
    const root = document.documentElement;
    const themeColors = THEMES[theme].colors;

    Object.entries(themeColors).forEach(([key, value]) => {
      // @ts-ignore
      root.style.setProperty(key, value);
    });
  }, [theme]);

  // ... (keeping other useEffects the same)

  // Initialize Runtimes & Restore Session
  useEffect(() => {
    if (hasInitializedRef.current) return;
    hasInitializedRef.current = true;

    const initializeRuntimes = async () => {
      initCpp()
        .then(() => {
          setRuntimeStatus(prev => {
            if (prev.cpp) return prev;
            addLog('system', 'C++ (JSCPP) runtime ready.');
            return { ...prev, cpp: true };
          });
        })
        .catch(err => {
          console.error(err);
          addLog('error', 'Failed to load C++ runtime.');
        });

      initPyodide()
        .then(() => {
          setRuntimeStatus(prev => {
            if (prev.python) return prev;
            addLog('system', 'Python (Pyodide) runtime ready.');
            return { ...prev, python: true };
          });
        })
        .catch(err => {
          console.error(err);
        });
    };

    addLog('system', 'Initializing compilers...');
    initializeRuntimes();

    // Check Server Health
    fetch(buildApiUrl('/api/health'))
      .then(res => {
        if (!res.ok) return null;
        return res.json();
      })
      .then(data => {
        if (!data) return;
        addLog('system', `Server Status: ${data.status} (v${data.version})`);
      })
      .catch(() => {
        // Keep output clean if server health check fails (e.g. no backend running).
      });

  }, []);

  useEffect(() => {
    if (isEditorLoaded) {
      if (editorLoadTimerRef.current !== null) {
        window.clearTimeout(editorLoadTimerRef.current);
        editorLoadTimerRef.current = null;
      }
      return;
    }
    editorLoadTimerRef.current = window.setTimeout(() => {
      setIsEditorLoaded(true);
    }, 1500);

    return () => {
      if (editorLoadTimerRef.current !== null) {
        window.clearTimeout(editorLoadTimerRef.current);
        editorLoadTimerRef.current = null;
      }
    };
  }, [isEditorLoaded]);

  // ... (keeping resize logic)


  // Vertical Resizing State (Input/Terminal)
  const [inputHeight, setInputHeight] = useState(120);
  const [isResizingInput, setIsResizingInput] = useState(false);
  const inputResizeRef = useRef<HTMLDivElement>(null);

  const startInputResize = useCallback(() => setIsResizingInput(true), []);
  const stopInputResize = useCallback(() => setIsResizingInput(false), []);

  const resizeInput = useCallback((e: MouseEvent) => {
    if (isResizingInput) {
      if (inputResizeRef.current) {
        const rect = inputResizeRef.current.getBoundingClientRect();
        const newHeight = e.clientY - rect.top;
        if (newHeight >= 60 && newHeight <= 400) { // Min/Max constraints
          setInputHeight(newHeight);
        }
      }
    }
  }, [isResizingInput]);

  useEffect(() => {
    if (isResizingInput) {
      window.addEventListener('mousemove', resizeInput);
      window.addEventListener('mouseup', stopInputResize);
      document.body.style.cursor = 'row-resize';
      document.body.style.userSelect = 'none';
    } else {
      window.removeEventListener('mousemove', resizeInput);
      window.removeEventListener('mouseup', stopInputResize);
      // Only reset if not horizontally resizing
      if (!isDragging) {
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      }
    }
    return () => {
      window.removeEventListener('mousemove', resizeInput);
      window.removeEventListener('mouseup', stopInputResize);
    };
  }, [isResizingInput, resizeInput, stopInputResize, isDragging]);

  // Horizontal Resizing Handlers (Existing)
  const startResizing = useCallback(() => setIsDragging(true), []);
  const stopResizing = useCallback(() => setIsDragging(false), []);

  const resize = useCallback((e: MouseEvent) => {
    if (isDragging && containerRef.current) {
      const containerRect = containerRef.current.getBoundingClientRect();
      const newWidthPixels = containerRect.right - e.clientX;
      const newWidthPercent = (newWidthPixels / containerRect.width) * 100;

      if (newWidthPercent >= 20 && newWidthPercent <= 80) {
        setConsoleWidth(newWidthPercent);
      }
    }
  }, [isDragging]);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', resize);
      window.addEventListener('mouseup', stopResizing);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    } else {
      window.removeEventListener('mousemove', resize);
      window.removeEventListener('mouseup', stopResizing);
      if (!isResizingInput) {
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      }
    }
    return () => {
      window.removeEventListener('mousemove', resize);
      window.removeEventListener('mouseup', stopResizing);
    };
  }, [isDragging, resize, stopResizing, isResizingInput]);

  // Tab Management
  const handleAddTab = (templateSnippet?: ExampleSnippet) => {
    if (tabs.length >= 3) return;

    let targetLanguage: Language;
    let initialCode: string;
    let extension: string;

    if (templateSnippet) {
      // If a template is provided (e.g., from Library), use it specifically
      targetLanguage = templateSnippet.language;
      initialCode = templateSnippet.code;
      extension = targetLanguage === Language.PYTHON ? 'py' : 'cpp';
    } else {
      // Default behavior: inherit from active tab
      targetLanguage = activeTab ? activeTab.language : Language.CPP;
      initialCode = SNIPPETS[targetLanguage];
      extension = targetLanguage === Language.PYTHON ? 'py' : 'cpp';
    }

    const newId = Date.now().toString();
    const newTab: EditorTab = {
      id: newId,
      title: `script_${tabs.length + 1}.${extension}`,
      code: initialCode,
      language: targetLanguage
    };
    setTabs([...tabs, newTab]);
    setActiveTabId(newId);
  };

  const handleCloseTab = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (tabs.length <= 1) return;

    const newTabs = tabs.filter(t => t.id !== id);
    setTabs(newTabs);

    if (activeTabId === id) {
      setActiveTabId(newTabs[newTabs.length - 1].id);
    }
  };

  const handleUpdateCode = (newCode: string | undefined) => {
    if (newCode === undefined) return;
    setTabs(prev => prev.map(t => t.id === activeTabId ? { ...t, code: newCode } : t));
  };

  const handleLanguageChange = (newLang: Language) => {
    // Update language for active tab
    // Also update filename extension if it's generic
    setTabs(prev => prev.map(t => {
      if (t.id === activeTabId) {
        let newTitle = t.title;
        // Simple heuristic to change extension
        if (newLang === Language.PYTHON && t.title.endsWith('.cpp')) {
          newTitle = t.title.replace('.cpp', '.py');
        } else if (newLang === Language.CPP && t.title.endsWith('.py')) {
          newTitle = t.title.replace('.py', '.cpp');
        }
        return {
          ...t,
          language: newLang,
          title: newTitle,
          code: SNIPPETS[newLang] // Switch code to default snippet for the new language
        };
      }
      return t;
    }));
  };


  const executeCode = useCallback(async () => {
    if (isRunning) return;
    setIsRunning(true);
    handleClearConsole();

    // Only run active tab code
    const currentCode = activeTab.code;
    const currentLang = activeTab.language;
    const startTime = performance.now();

    try {
      if (currentLang === Language.PYTHON) {
        if (!runtimeStatus.python) {
          addLog('system', 'Waiting for Python runtime...');
          await initPyodide();
        }
        addLog('system', `>> Executing ${activeTab.title} (Python)...`);
        await runPythonCode(currentCode, (text) => {
          if (text.trim() !== '') addLog('info', text.trimEnd());
        });
      } else if (currentLang === Language.CPP) {
        if (!runtimeStatus.cpp) {
          addLog('system', 'Ensuring C++ runtime is loaded...');
        }
        addLog('system', `>> Compiling & Running ${activeTab.title} (C++)...`);
        await runCppCode(currentCode, stdin, (text) => {
          const cleanText = text.replace(/\n$/, '');
          if (cleanText) addLog('info', cleanText);
        });
      }

      const duration = (performance.now() - startTime).toFixed(2);
      addLog('success', `\nProgram exited successfully in ${duration}ms.`);
    } catch (err) {
      addLog('error', `Execution Error: ${err}`);
    } finally {
      setIsRunning(false);
    }
  }, [activeTab, runtimeStatus, isRunning]);



  const handleRenameActiveTab = useCallback((filename: string) => {
    if (!tabToRenameId) return;
    const normalized = filename.trim();
    if (!normalized) return;

    const ext = normalized.toLowerCase().match(/\.[a-z0-9]+$/)?.[0];
    const nextLanguage = ext === '.py' ? Language.PYTHON : ext === '.cpp' ? Language.CPP : null;

    setTabs(prev => prev.map(t => {
      if (t.id !== tabToRenameId) return t;
      return {
        ...t,
        title: normalized,
        language: nextLanguage ?? t.language,
      };
    }));
    addLog('success', `✓ 文件已重命名为 "${normalized}"`);
  }, [tabToRenameId]);

  return (
    <div className="flex flex-col h-screen bg-background text-mainText transition-colors duration-300">
      <Header
        language={activeTab.language}
        setLanguage={handleLanguageChange}
        onRun={executeCode}
        isRunning={isRunning}
        theme={theme}
        setTheme={setTheme}
      />

      <main
        ref={containerRef}
        className="flex-1 flex flex-col lg:flex-row overflow-hidden p-4 pt-2 gap-4 lg:gap-0"
      >
        {/* Editor Section */}
        <section
          className={`flex-1 flex flex-col min-h-[400px] lg:min-h-0 relative min-w-0 ${isDragging ? 'pointer-events-none' : ''}`}
        >
          {/* Tabs */}
          <TabBar
            tabs={tabs}
            activeTabId={activeTabId}
            onSwitch={setActiveTabId}
            onClose={handleCloseTab}
            onAdd={handleAddTab}
            onRename={() => {
              setTabToRenameId(activeTabId);
              setShowRenameModal(true);
            }}
            onFontIncrease={handleEditorFontIncrease}
            onFontDecrease={handleEditorFontDecrease}
          />

          {/* Editor */}
          {isEditorLoaded ? (
            <Suspense
              fallback={
                <div className="h-full w-full rounded-lg border border-border shadow-xl bg-surface flex items-center justify-center">
                  <div className="text-sm text-secondary">编辑器加载中...</div>
                </div>
              }
            >
              <CodeEditor
                language={activeTab.language}
                code={activeTab.code}
                onChange={handleUpdateCode}
                theme={theme}
                fontSize={editorFontSize}
              />
            </Suspense>
          ) : (
            <div className="h-full w-full rounded-lg border border-border shadow-xl bg-surface transition-colors duration-300 relative">
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-sm text-secondary">点击开始编辑</div>
              </div>
              <button
                type="button"
                onClick={() => setIsEditorLoaded(true)}
                className="absolute inset-0 w-full h-full cursor-text"
                aria-label="点击加载编辑器"
              />
            </div>
          )}
        </section>

        {/* Resizer Handle (Desktop Only) */}
        <div
          className="hidden lg:flex w-4 cursor-col-resize items-center justify-center hover:bg-surface transition-colors flex-shrink-0 z-10 pt-8"
          onMouseDown={startResizing}
          title="Drag to resize"
        >
          <div className={`w-1 h-8 rounded-full transition-colors ${isDragging ? 'bg-primary' : 'bg-border/50'}`} />
        </div>

        {/* Output Section */}
        <section
          className={`flex-shrink-0 flex flex-col min-h-[300px] lg:min-h-0 relative w-full lg:w-[var(--console-width)] ${isDragging ? 'pointer-events-none' : ''}`}
          style={{ '--console-width': `${consoleWidth}%` } as React.CSSProperties}
        >
          {/* Spacer to align with tabs visually */}
          <div className="h-9 hidden lg:block"></div>




          {/* Input Field */}
          <div
            ref={inputResizeRef}
            style={{ height: inputHeight }}
            className="bg-surface border border-border rounded-lg shadow-sm overflow-hidden transition-colors duration-300 flex flex-col"
          >
            <div className="px-4 py-2 bg-background/30 border-b border-border flex items-center gap-2 flex-shrink-0">
              <span className="text-xs font-medium text-secondary uppercase tracking-wider">Input</span>
            </div>
            <div className="p-2 flex-1">
              <textarea
                value={stdin}
                onChange={(e) => setStdin(e.target.value)}
                placeholder="Enter input for your program here..."
                className="w-full h-full bg-transparent text-mainText placeholder-secondary/50 focus:outline-none font-mono resize-none"
                style={{ fontSize: `${ioFontSize}px`, lineHeight: `${ioFontSize * 1.6}px` }}
              />
            </div>
          </div>

          {/* Vertical Resize Handle */}
          <div
            className="h-4 w-full cursor-row-resize flex items-center justify-center hover:bg-surface/50 transition-colors flex-shrink-0 z-10"
            onMouseDown={startInputResize}
            title="Drag to resize input"
          >
            <div className={`w-8 h-1 rounded-full transition-colors ${isResizingInput ? 'bg-primary' : 'bg-border/50'}`} />
          </div>

          <Console
            messages={messages}
            onClear={handleClearConsole}
            isRunning={isRunning}
            fontSize={ioFontSize}
            onFontIncrease={handleConsoleFontIncrease}
            onFontDecrease={handleConsoleFontDecrease}
          />
        </section>
      </main>

      {/* Rename Modal */}
      <SaveModal
        isOpen={showRenameModal}
        onClose={() => {
          setShowRenameModal(false);
          setTabToRenameId(null);
        }}
        onConfirm={handleRenameActiveTab}
        initialFilename={activeTab?.title || ''}
      />
    </div>
  );
}

export default App;
