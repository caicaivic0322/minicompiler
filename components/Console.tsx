import React, { useRef, useEffect } from 'react';
import { ConsoleMessage } from '../types';
import { Terminal, Eraser } from 'lucide-react';

interface ConsoleProps {
  messages: ConsoleMessage[];
  onClear: () => void;
  isRunning: boolean;
  fontSize: number;
  onIncreaseFontSize: () => void;
  onDecreaseFontSize: () => void;
  onWheelZoom: (e: React.WheelEvent) => void;
}

const Console: React.FC<ConsoleProps> = ({ messages, onClear, isRunning, fontSize, onIncreaseFontSize, onDecreaseFontSize, onWheelZoom }) => {
  const endRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new message
  useEffect(() => {
    if (endRef.current) {
      endRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  return (
    <div 
      className="flex flex-col h-full bg-surface border border-border rounded-lg shadow-xl overflow-hidden transition-colors duration-300"
      onWheel={onWheelZoom}
    >
      {/* Console Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-background/50 border-b border-border">
        <div className="flex items-center gap-2 text-secondary">
          <Terminal size={16} />
          <span className="text-sm font-medium tracking-wide">TERMINAL</span>
        </div>
        <div className="flex items-center gap-2">
          {/* Font Size Controls */}
          <div className="flex items-center gap-1">
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
          <button
            onClick={onClear}
            className="text-secondary hover:text-primary transition-colors p-1 rounded hover:bg-background"
            title="Clear Console"
          >
            <Eraser size={16} />
          </button>
        </div>
      </div>

      {/* Console Output */}
      <div className="flex-1 p-4 overflow-y-auto font-mono space-y-1 scroll-smooth" style={{ fontSize: `${fontSize}px` }}>
        {messages.length === 0 && !isRunning && (
          <div className="text-secondary italic mt-2 opacity-60 select-none">
            Ready to execute. Press Run to start.
          </div>
        )}

        {messages.map((msg, idx) => (
          <div key={idx} className={`whitespace-pre-wrap break-words ${msg.type === 'error' ? 'text-error' :
            msg.type === 'success' ? 'text-success' :
              msg.type === 'system' ? 'text-primary opacity-80 italic' :
                'text-mainText'
            }`}>
            <span className="opacity-40 mr-2 text-xs select-none text-mainText">
              {new Date(msg.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
            {msg.content}
          </div>
        ))}

        {isRunning && (
          <div className="flex items-center gap-2 text-primary mt-2 animate-pulse">
            <div className="w-2 h-2 bg-primary rounded-full"></div>
            <span>Executing...</span>
          </div>
        )}
        <div ref={endRef} />
      </div>
    </div>
  );
};

export default Console;
