import { ConsoleMessage } from '../types';

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
