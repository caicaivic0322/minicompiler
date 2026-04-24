import { ConsoleMessage } from '../types';

export const getCompilerOutputMessageType = (content: string): ConsoleMessage['type'] => {
  const trimmed = content.trimStart();

  if (trimmed.startsWith('[System]')) return 'system';
  if (
    trimmed.startsWith('[Error]') ||
    trimmed.startsWith('[Compile Error]') ||
    trimmed.startsWith('[Runtime Error]')
  ) {
    return 'error';
  }

  return 'info';
};

export const getConsoleMessageGroups = (
  messages: ConsoleMessage[],
  showDiagnostics: boolean,
) => {
  const diagnosticMessages = messages.filter((message) => message.type === 'system');
  const visibleMessages = showDiagnostics
    ? messages
    : messages.filter((message) => message.type !== 'system');

  return {
    visibleMessages,
    diagnosticMessages,
  };
};
