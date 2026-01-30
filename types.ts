
export enum Language {
  PYTHON = 'python',
  CPP = 'cpp',
}

export type ThemeKey = 'warm' | 'cold' | 'dark' | 'light';

export interface ExecutionResult {
  output: string;
  error?: string;
  executionTime?: number;
}

export interface CodeSnippet {
  language: Language;
  code: string;
}

export interface EditorTab {
  id: string;
  title: string;
  code: string;
  language: Language;
}

export interface ConsoleMessage {
  type: 'info' | 'error' | 'success' | 'system';
  content: string;
  timestamp: number;
}

export interface ExampleSnippet {
  name: string;
  code: string;
  language: Language;
}

export interface ServerFile {
  name: string;
  size: number;
  modified: string;
}

export interface User {
  username: string;
  isLoggedIn: boolean;
}
