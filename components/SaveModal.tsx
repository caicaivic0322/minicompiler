import React, { useState, useEffect } from 'react';
import { X, Save, FileText } from 'lucide-react';

interface SaveModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (filename: string) => void;
  initialFilename: string;
}

const SaveModal: React.FC<SaveModalProps> = ({ isOpen, onClose, onConfirm, initialFilename }) => {
  const [filename, setFilename] = useState(initialFilename);

  useEffect(() => {
    setFilename(initialFilename);
  }, [initialFilename, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (filename.trim()) {
      onConfirm(filename.trim());
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      
      <div className="relative bg-surface border border-border rounded-xl shadow-2xl w-full max-w-sm overflow-hidden transform transition-all scale-100">
        <div className="flex items-center justify-between px-6 py-4 bg-background/50 border-b border-border">
          <h2 className="text-lg font-bold text-mainText flex items-center gap-2">
            <Save size={18} className="text-primary" />
            保存文件
          </h2>
          <button onClick={onClose} className="text-secondary hover:text-mainText">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-secondary">文件名</label>
            <div className="relative">
              <FileText className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary" size={18} />
              <input
                type="text"
                value={filename}
                onChange={(e) => setFilename(e.target.value)}
                placeholder="例如: main.cpp"
                className="w-full bg-background border border-border rounded-lg pl-10 pr-4 py-3 text-mainText focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                autoFocus
              />
            </div>
          </div>
          
          <div className="flex gap-3 justify-end mt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-secondary hover:text-mainText hover:bg-background rounded-lg transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium bg-primary text-background rounded-lg hover:brightness-110 transition-colors"
            >
              确认保存
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SaveModal;
