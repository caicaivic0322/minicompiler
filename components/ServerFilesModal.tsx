
import React, { useState, useEffect } from 'react';
import { X, FolderOpen, FileCode, FileJson, Loader2, RefreshCw, Trash2 } from 'lucide-react';
import { ServerFile, Language } from '../types';

interface ServerFilesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenFile: (filename: string, code: string, language: Language) => void;
  isLoggedIn: boolean;
  authToken?: string | null;
}

const ServerFilesModal: React.FC<ServerFilesModalProps> = ({ isOpen, onClose, onOpenFile, isLoggedIn, authToken }) => {
  const [files, setFiles] = useState<ServerFile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedFile, setSelectedFile] = useState<string | null>(null);

  const fetchFiles = async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await fetch('/api/files');
      if (response.ok) {
        const data = await response.json();
        setFiles(data);
      } else {
        setError('获取文件列表失败');
      }
    } catch (err) {
      setError('无法连接服务器');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchFiles();
    }
  }, [isOpen]);

  const handleOpenFile = async (filename: string) => {
    setSelectedFile(filename);
    try {
      const response = await fetch(`/api/file/${encodeURIComponent(filename)}`);
      if (response.ok) {
        const data = await response.json();
        const language = filename.endsWith('.py') ? Language.PYTHON : Language.CPP;
        onOpenFile(filename, data.code, language);
        onClose();
      } else {
        setError('打开文件失败');
      }
    } catch (err) {
      setError('读取文件失败');
    } finally {
      setSelectedFile(null);
    }
  };

  const handleDeleteFile = async (filename: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`确定要删除 "${filename}" 吗？`)) return;
    
    try {
      const response = await fetch(`/api/file/${encodeURIComponent(filename)}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      if (response.ok) {
        fetchFiles();
      } else {
        setError('删除文件失败');
      }
    } catch (err) {
      setError('删除文件失败');
    }
  };

  const getFileIcon = (filename: string) => {
    return filename.endsWith('.py') 
      ? <FileJson size={16} className="text-primary" />
      : <FileCode size={16} className="text-accent" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-surface border border-border rounded-xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden animate-in zoom-in-95 fade-in duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-background/50 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <FolderOpen className="text-primary" size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-mainText">服务器文件</h2>
              <p className="text-xs text-secondary">
                {files.length > 0 ? `${files.length} 个文件` : '暂无文件'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchFiles}
              disabled={isLoading}
              className="p-2 text-secondary hover:text-primary hover:bg-background rounded-lg transition-colors disabled:opacity-50"
              title="刷新"
            >
              <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-secondary hover:text-mainText hover:bg-background rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="max-h-[400px] overflow-y-auto">
          {error && (
            <div className="px-6 py-3 bg-error/10 border-b border-error/20 text-error text-sm">
              {error}
            </div>
          )}

          {isLoading && files.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-secondary">
              <Loader2 className="animate-spin mb-3" size={32} />
              <p>加载中...</p>
            </div>
          ) : files.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-secondary">
              <FolderOpen size={48} className="mb-3 opacity-50" />
              <p>暂无保存的文件</p>
              <p className="text-xs mt-1">保存文件后将显示在这里</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {files.map((file) => (
                <button
                  key={file.name}
                  onClick={() => handleOpenFile(file.name)}
                  disabled={selectedFile === file.name}
                  className="w-full flex items-center gap-4 px-6 py-4 hover:bg-background/50 transition-colors group text-left disabled:opacity-50"
                >
                  <div className="flex-shrink-0">
                    {selectedFile === file.name ? (
                      <Loader2 className="animate-spin text-primary" size={16} />
                    ) : (
                      getFileIcon(file.name)
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-mainText truncate">{file.name}</div>
                    <div className="text-xs text-secondary">
                      {formatFileSize(file.size)} · {formatDate(file.modified)}
                    </div>
                  </div>
                  {isLoggedIn && (
                    <button
                      onClick={(e) => handleDeleteFile(file.name, e)}
                      className="p-2 text-secondary hover:text-error hover:bg-error/10 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                      title="删除文件"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ServerFilesModal;
