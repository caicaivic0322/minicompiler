
import React, { useState, useEffect, useCallback, useRef } from 'react';
import Header from './components/Header';
import CodeEditor from './components/Editor';
import Console from './components/Console';
import TabBar from './components/TabBar';
import LoginModal from './components/LoginModal';
import SaveModal from './components/SaveModal';
import { Language, ConsoleMessage, ThemeKey, EditorTab, ExampleSnippet, User } from './types';
import { SNIPPETS, THEMES } from './constants';
import ServerFilesModal from './components/ServerFilesModal';
import { initPyodide, runPythonCode } from './services/pyodideService';
import { initCpp, runCppCode } from './services/cppService';

function App() {
  // Theme State
  const [theme, setTheme] = useState<ThemeKey>('dark');
  
  // Save Modal State
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [tabToSave, setTabToSave] = useState<EditorTab | null>(null);

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

  // Auth State
  const [user, setUser] = useState<User | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showFilesModal, setShowFilesModal] = useState(false);
  const [pendingSaveTab, setPendingSaveTab] = useState<EditorTab | null>(null);

  const addLog = (type: ConsoleMessage['type'], content: string) => {
    setMessages(prev => [...prev, { type, content, timestamp: Date.now() }]);
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

    // Check Server Health
    fetch('/api/health')
      .then(res => res.json())
      .then(data => addLog('system', `Server Status: ${data.status} (v${data.version})`))
      .catch(err => addLog('error', `Server Health Check Failed: ${err}`));

    // 恢复登录状态
    const savedToken = localStorage.getItem('authToken');
    const savedUser = localStorage.getItem('user');
    if (savedToken && savedUser) {
      setAuthToken(savedToken);
      setUser(JSON.parse(savedUser));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ... (keeping resize logic)


  // Save to Server Handler
  const handleSaveToServer = useCallback(async (tab: EditorTab): Promise<boolean> => {
    // 检查登录状态
    if (!authToken) {
      addLog('error', '请先登录后再保存到服务器');
      setPendingSaveTab(tab);
      setShowLoginModal(true);
      return false;
    }

    try {
      const response = await fetch('/api/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filename: tab.title,
          code: tab.code,
          language: tab.language,
          token: authToken,
        }),
      });
      
      if (response.ok) {
        addLog('success', `✓ 文件 "${tab.title}" 已保存到服务器`);
        return true;
      } else if (response.status === 401) {
        addLog('error', '登录已过期，请重新登录');
        handleLogout();
        setPendingSaveTab(tab); // Retry after re-login
        setShowLoginModal(true);
        return false;
      } else {
        const error = await response.text();
        addLog('error', `保存失败: ${error}`);
        return false;
      }
    } catch (err) {
      addLog('error', `保存到服务器失败: ${err}`);
      return false;
    }
  }, [authToken]);

  // Auto-save after login
  useEffect(() => {
    if (authToken && pendingSaveTab) {
      const tabToSave = pendingSaveTab;
      setPendingSaveTab(null); // Clear first to avoid loops
      addLog('system', '登录成功，正在自动保存...');
      handleSaveToServer(tabToSave);
    }
  }, [authToken, pendingSaveTab, handleSaveToServer]);

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



  // Login Handler
  const handleLogin = useCallback(async (username: string, password: string): Promise<{ success: boolean; message?: string }> => {
    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      if (response.ok) {
        const data = await response.json();
        setAuthToken(data.token);
        setUser({ username: data.username, isLoggedIn: true });
        
        // 保存到 localStorage
        localStorage.setItem('authToken', data.token);
        localStorage.setItem('user', JSON.stringify({ username: data.username, isLoggedIn: true }));
        
        addLog('success', `✓ 欢迎回来，${data.username}！`);
        return { success: true };
      } else {
        let message = '登录失败';
        try {
          const errorData = await response.json();
          message = errorData.message || message;
        } catch (e) {
          try {
            const text = await response.text();
            message = text || message;
          } catch (_) {
          }
        }
        addLog('error', `登录失败: ${message}`);
        return { success: false, message };
      }
    } catch (err) {
      addLog('error', `登录失败: ${err}`);
      return { success: false, message: '登录失败，请稍后重试' };
    }
  }, []);

  // Register Handler
  const handleRegister = useCallback(async (username: string, password: string): Promise<{ success: boolean; message?: string }> => {
    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      if (response.ok) {
        const data = await response.json();
        
        setAuthToken(data.token);
        setUser({ username: data.username, isLoggedIn: true });
        
        // 保存到 localStorage
        localStorage.setItem('authToken', data.token);
        localStorage.setItem('user', JSON.stringify({ username: data.username, isLoggedIn: true }));
        
        addLog('success', `✓ 注册成功，欢迎 ${data.username}！`);
        return { success: true };
      } else {
        let errorMessage = '注册失败';
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch (e) {
          try {
            const text = await response.text();
            errorMessage = text || errorMessage;
          } catch (_) {
          }
        }
        addLog('error', `注册失败: ${errorMessage}`);
        return { success: false, message: errorMessage };
      }
    } catch (err: any) {
      addLog('error', `注册请求失败: ${err.message}`);
      return { success: false, message: '注册失败，请稍后重试' };
    }
  }, []);

  // Logout Handler
  const handleLogout = useCallback(async () => {
    if (authToken) {
      try {
        await fetch('/api/logout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token: authToken }),
        });
      } catch (err) {
        console.error('Logout error:', err);
      }
    }
    
    setAuthToken(null);
    setUser(null);
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    addLog('system', '已退出登录');
  }, [authToken]);

  // Open file from server
  const handleOpenServerFile = useCallback((filename: string, code: string, language: Language) => {
    // 检查是否已达到最大标签数
    if (tabs.length >= 3) {
      addLog('error', '已达到最大标签数，请关闭一个标签后再打开');
      return;
    }

    const newId = Date.now().toString();
    const newTab: EditorTab = {
      id: newId,
      title: filename,
      code: code,
      language: language
    };
    setTabs(prev => [...prev, newTab]);
    setActiveTabId(newId);
    addLog('success', `✓ 已打开文件: ${filename}`);
  }, [tabs.length]);

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
            onSaveToServer={handleSaveToServer}
            onOpenServerFiles={() => setShowFilesModal(true)}
            onShowLogin={() => setShowLoginModal(true)}
            onLogout={handleLogout}
            user={user}
            onFontIncrease={handleEditorFontIncrease}
            onFontDecrease={handleEditorFontDecrease}
          />

          {/* Editor */}
          <CodeEditor
            language={activeTab.language}
            code={activeTab.code}
            onChange={handleUpdateCode}
            theme={theme}
            fontSize={editorFontSize}
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

      {/* Login Modal */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onLogin={handleLogin}
        onRegister={handleRegister}
      />

      {/* Server Files Modal */}
      <ServerFilesModal
        isOpen={showFilesModal}
        onClose={() => setShowFilesModal(false)}
        onOpenFile={handleOpenServerFile}
        isLoggedIn={!!user}
        authToken={authToken}
      />
    </div>
  );
}

export default App;
