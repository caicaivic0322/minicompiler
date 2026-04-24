import { EditorTab, Language } from '../types';

export const EDITOR_SESSION_STORAGE_KEY = 'minicompiler.editorSession.v1';

export interface EditorSessionSnapshot {
  version: 1;
  tabs: EditorTab[];
  activeTabId: string;
  stdin: string;
}

const MAX_PERSISTED_TABS = 3;
const PYTHON_STARTUP_TAB_ID = 'python-startup';

const isLanguage = (value: unknown): value is Language => {
  return value === Language.PYTHON || value === Language.CPP;
};

const sanitizeTab = (tab: any): EditorTab | null => {
  if (!tab || typeof tab !== 'object') return null;
  if (typeof tab.id !== 'string' || !tab.id.trim()) return null;
  if (typeof tab.title !== 'string' || !tab.title.trim()) return null;
  if (typeof tab.code !== 'string') return null;
  if (!isLanguage(tab.language)) return null;

  return {
    id: tab.id,
    title: tab.title,
    code: tab.code,
    language: tab.language,
  };
};

const sanitizeTabs = (tabs: unknown): EditorTab[] => {
  if (!Array.isArray(tabs)) return [];
  return tabs
    .map(sanitizeTab)
    .filter((tab): tab is EditorTab => Boolean(tab))
    .slice(0, MAX_PERSISTED_TABS);
};

export const serializeEditorSession = (
  tabs: EditorTab[],
  activeTabId: string,
  stdin: string,
): EditorSessionSnapshot => {
  const safeTabs = sanitizeTabs(tabs);
  const safeActiveTabId = safeTabs.some((tab) => tab.id === activeTabId)
    ? activeTabId
    : safeTabs[0]?.id || '';

  return {
    version: 1,
    tabs: safeTabs,
    activeTabId: safeActiveTabId,
    stdin: typeof stdin === 'string' ? stdin : '',
  };
};

export const parseEditorSession = (raw: string | null): EditorSessionSnapshot | null => {
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw);
    if (!parsed || parsed.version !== 1) return null;

    const tabs = sanitizeTabs(parsed.tabs);
    if (tabs.length === 0) return null;

    return serializeEditorSession(
      tabs,
      typeof parsed.activeTabId === 'string' ? parsed.activeTabId : tabs[0].id,
      typeof parsed.stdin === 'string' ? parsed.stdin : '',
    );
  } catch {
    return null;
  }
};

const createUniquePythonTab = (defaultPythonTab: EditorTab, tabs: EditorTab[]) => {
  if (!tabs.some((tab) => tab.id === defaultPythonTab.id)) {
    return defaultPythonTab;
  }

  return {
    ...defaultPythonTab,
    id: PYTHON_STARTUP_TAB_ID,
  };
};

export const preferPythonStartupSession = (
  session: EditorSessionSnapshot,
  defaultPythonTab: EditorTab,
): EditorSessionSnapshot => {
  const pythonTab = session.tabs.find((tab) => tab.language === Language.PYTHON);
  if (pythonTab) {
    return {
      ...session,
      activeTabId: pythonTab.id,
    };
  }

  const startupTab = createUniquePythonTab(defaultPythonTab, session.tabs);
  return {
    ...session,
    tabs: [startupTab, ...session.tabs].slice(0, MAX_PERSISTED_TABS),
    activeTabId: startupTab.id,
  };
};
