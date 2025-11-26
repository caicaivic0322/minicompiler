
import React, { useState, useEffect, useCallback, useRef } from 'react';
import Header from './components/Header';
import CodeEditor from './components/Editor';
import Console from './components/Console';
import TabBar from './components/TabBar';
import { Language, ConsoleMessage, ThemeKey, EditorTab, ExampleSnippet } from './types';
import { SNIPPETS, THEMES } from './constants';
import { initPyodide, runPythonCode } from './services/pyodideService';
import { initCpp, runCppCode } from './services/cppService';

function App() {
  // Theme State
  const [theme, setTheme] = useState<ThemeKey>('light');

  // Font Size State - Separate for Editor and Output
  const [editorFontSize, setEditorFontSize] = useState(14);
  const [outputFontSize, setOutputFontSize] = useState(14);

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

  // Resizing State
  const [consoleWidth, setConsoleWidth] = useState(40);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Input State
  const [stdin, setStdin] = useState('');

  // Font Size Controls - Separate for Editor and Output
  // Editor Font Size
  const increaseEditorFontSize = () => {
    setEditorFontSize(prev => Math.min(prev + 1, 30));
  };

  const decreaseEditorFontSize = () => {
    setEditorFontSize(prev => Math.max(prev - 1, 10));
  };

  // Output Font Size (includes Console and Input)
  const increaseOutputFontSize = () => {
    setOutputFontSize(prev => Math.min(prev + 1, 30));
  };

  const decreaseOutputFontSize = () => {
    setOutputFontSize(prev => Math.max(prev - 1, 10));
  };

  // Handle wheel zoom for editor (slower speed)
  const handleEditorWheelZoom = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      if (e.deltaY < 0) {
        increaseEditorFontSize();
      } else {
        decreaseEditorFontSize();
      }
    }
  };

  // Handle wheel zoom for output (slower speed)
  const handleOutputWheelZoom = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      if (e.deltaY < 0) {
        increaseOutputFontSize();
      } else {
        decreaseOutputFontSize();
      }
    }
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

  // Initialize Runtimes
  useEffect(() => {
    const initializeRuntimes = async () => {
      initCpp()
        .then(() => {
          setRuntimeStatus(prev => ({ ...prev, cpp: true }));
          addLog('system', 'C++ (JSCPP) runtime ready.');
        })
        .catch(err => {
          console.error(err);
          addLog('error', 'Failed to load C++ runtime.');
        });

      initPyodide()
        .then(() => {
          setRuntimeStatus(prev => ({ ...prev, python: true }));
          addLog('system', 'Python (Pyodide) runtime ready.');
        })
        .catch(err => {
          console.error(err);
        });
    };

    addLog('system', 'Initializing compilers...');
    initializeRuntimes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Vertical Resizing State (Input/Terminal)
  const [inputHeight, setInputHeight] = useState(120);
  const [isResizingInput, setIsResizingInput] = useState(false);
  const inputResizeRef = useRef<HTMLDivElement>(null);

  const startInputResize = useCallback(() => setIsResizingInput(true), []);
  const stopInputResize = useCallback(() => setIsResizingInput(false), []);

  const resizeInput = useCallback((e: MouseEvent) => {
    if (isResizingInput) {
      // Calculate new height based on mouse Y position relative to the container bottom
      // This is a bit tricky because the container grows from top.
      // Simpler: Delta Y.
      // Or: Get the input container's top and calculate height = mouse Y - top.
      // Let's rely on movementY for simplicity or absolute position if possible.
      // Better: Calculate height based on mouse position relative to the input container's top.
      // But we don't have a ref to the input container easily available here without adding one.
      // Let's use movementY for now, or better:
      // We know the resize handle is at the bottom of the input.
      // So height = e.clientY - inputContainer.getBoundingClientRect().top

      // Let's assume we can get the input container via a ref or ID.
      // For now, let's use a simple approach:
      // We need to know where the resize started? No, absolute position is better.

      // Let's add a ref to the input container in the JSX part later.
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

  const addLog = (type: ConsoleMessage['type'], content: string) => {
    setMessages(prev => [...prev, { type, content, timestamp: Date.now() }]);
  };

  const handleClearConsole = () => {
    setMessages([]);
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
          />

          {/* Editor */}
          <CodeEditor
            language={activeTab.language}
            code={activeTab.code}
            onChange={handleUpdateCode}
            theme={theme}
            fontSize={editorFontSize}
            onIncreaseFontSize={increaseEditorFontSize}
            onDecreaseFontSize={decreaseEditorFontSize}
            onWheelZoom={handleEditorWheelZoom}
          />
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
                style={{ fontSize: `${outputFontSize}px` }}
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
            fontSize={outputFontSize}
            onIncreaseFontSize={increaseOutputFontSize}
            onDecreaseFontSize={decreaseOutputFontSize}
            onWheelZoom={handleOutputWheelZoom}
          />
        </section>
      </main>
    </div>
  );
}

export default App;
