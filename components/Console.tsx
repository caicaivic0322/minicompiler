import React, { useRef, useEffect } from 'react';
import { ConsoleMessage } from '../types';
import { Terminal, Eraser, ZoomIn, ZoomOut } from 'lucide-react';

interface ConsoleProps {
  messages: ConsoleMessage[];
  onClear: () => void;
  isRunning: boolean;
  fontSize: number;
  onFontIncrease: () => void;
  onFontDecrease: () => void;
}

const Console: React.FC<ConsoleProps> = ({ 
  messages, 
  onClear, 
  isRunning, 
  fontSize,
  onFontIncrease,
  onFontDecrease
}) => {
  const endRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new message
  useEffect(() => {
    if (endRef.current) {
      endRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  return (
    <div className="flex flex-col h-full bg-surface border border-border rounded-lg shadow-xl overflow-hidden transition-colors duration-300">
      {/* Console Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-background/50 border-b border-border">
        <div className="flex items-center gap-2 text-secondary">
          <Terminal size={16} />
          <span className="text-sm font-medium tracking-wide">TERMINAL</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onFontDecrease}
            className="text-secondary hover:text-primary transition-colors p-1 rounded hover:bg-background"
            title="Decrease Font Size"
          >
            <ZoomOut size={16} />
          </button>
          <button
            onClick={onFontIncrease}
            className="text-secondary hover:text-primary transition-colors p-1 rounded hover:bg-background"
            title="Increase Font Size"
          >
            <ZoomIn size={16} />
          </button>
          <div className="w-px h-4 bg-border/50 mx-1"></div>
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
      <div 
        className="flex-1 p-4 overflow-y-auto font-mono space-y-1 scroll-smooth"
        style={{ fontSize: `${fontSize}px`, lineHeight: `${fontSize * 1.6}px` }}
      >
        {messages.length === 0 && !isRunning && (
          <div className="text-secondary italic mt-2 opacity-60 select-none">
            Ready to execute. Press Run to start.
          </div>
        )}

        {messages.map((msg, idx) => (
          <div 
            key={idx} 
            className={`whitespace-pre-wrap break-words px-3 py-1.5 rounded-md transition-all ${
              msg.type === 'error' 
                ? 'text-error bg-error/10 border-l-2 border-error' 
                : msg.type === 'success' 
                  ? 'text-secondary bg-surface/60 border-l-2 border-border' 
                  : msg.type === 'system' 
                    ? 'text-mainText' 
                  : 'text-success bg-success/10 border-l-2 border-success font-medium'
            }`}
          >
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
