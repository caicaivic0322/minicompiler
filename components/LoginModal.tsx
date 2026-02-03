import React, { useState } from 'react';
import { X, User, Lock, LogIn, Loader2, UserPlus, ArrowRight } from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (username: string, password: string) => Promise<{ success: boolean; message?: string }>;
  onRegister: (username: string, password: string) => Promise<{ success: boolean; message?: string }>;
}

const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, onLogin, onRegister }) => {
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!username.trim() || !password.trim()) {
      setError('请输入用户名和密码');
      return;
    }

    if (!isLoginMode && password !== confirmPassword) {
      setError('两次输入的密码不一致');
      return;
    }

    setIsLoading(true);
    try {
      const result = await (isLoginMode ? onLogin(username, password) : onRegister(username, password));
      if (result.success) {
        setUsername('');
        setPassword('');
        setConfirmPassword('');
        onClose();
      } else {
        const fallback = isLoginMode ? '用户名或密码错误' : '注册失败，请稍后重试';
        setError(result.message || fallback);
      }
    } catch (err) {
      setError('操作失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLoginMode(!isLoginMode);
    setError('');
    setUsername('');
    setPassword('');
    setConfirmPassword('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-surface/95 backdrop-blur-md border border-border rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all scale-100">
        
        {/* Decorative Background Elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-accent/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-secondary hover:text-mainText hover:bg-background/50 rounded-full transition-colors z-10"
        >
          <X size={20} />
        </button>

        <div className="p-8 pb-6">
          {/* Header & Tabs */}
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-2">
              {isLoginMode ? '欢迎回来' : '创建账号'}
            </h2>
            <p className="text-secondary text-sm mb-6">
              {isLoginMode ? '登录已有账号以保存云端代码' : '注册新账号开启云端同步之旅'}
            </p>

            {/* Tab Switcher */}
            <div className="flex p-1 bg-background/50 rounded-xl border border-border/50 relative">
              <div 
                className="absolute h-[calc(100%-8px)] top-1 w-[calc(50%-4px)] bg-surface shadow-sm rounded-lg transition-all duration-300 ease-out"
                style={{ left: isLoginMode ? '4px' : 'calc(50%)' }}
              />
              <button
                type="button"
                onClick={() => !isLoginMode && toggleMode()}
                className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-lg relative z-10 transition-colors ${isLoginMode ? 'text-primary' : 'text-secondary hover:text-mainText'}`}
              >
                <LogIn size={16} />
                登录
              </button>
              <button
                type="button"
                onClick={() => isLoginMode && toggleMode()}
                className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-lg relative z-10 transition-colors ${!isLoginMode ? 'text-primary' : 'text-secondary hover:text-mainText'}`}
              >
                <UserPlus size={16} />
                注册
              </button>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="px-4 py-3 bg-error/10 border border-error/20 rounded-xl text-error text-sm flex items-center gap-2 animate-in slide-in-from-top-2">
                <span className="w-1.5 h-1.5 rounded-full bg-error flex-shrink-0" />
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div className="group">
                <label className="text-xs font-semibold text-secondary ml-1 mb-1.5 block">用户名</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-secondary group-focus-within:text-primary transition-colors" size={18} />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="请输入用户名"
                    className="w-full bg-background/50 border border-border rounded-xl pl-10 pr-4 py-3 text-mainText placeholder-secondary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="group">
                <label className="text-xs font-semibold text-secondary ml-1 mb-1.5 block">密码</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-secondary group-focus-within:text-primary transition-colors" size={18} />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="请输入密码"
                    className="w-full bg-background/50 border border-border rounded-xl pl-10 pr-4 py-3 text-mainText placeholder-secondary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    disabled={isLoading}
                  />
                </div>
              </div>

              {!isLoginMode && (
                <div className="group animate-in slide-in-from-top-4 fade-in duration-300">
                  <label className="text-xs font-semibold text-secondary ml-1 mb-1.5 block">确认密码</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-secondary group-focus-within:text-primary transition-colors" size={18} />
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="再次输入密码"
                      className="w-full bg-background/50 border border-border rounded-xl pl-10 pr-4 py-3 text-mainText placeholder-secondary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                      disabled={isLoading}
                    />
                  </div>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 px-4 py-3.5 bg-gradient-to-r from-primary to-primary/90 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-primary/20 hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none mt-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin" size={18} />
                  {isLoginMode ? '登录中...' : '注册中...'}
                </>
              ) : (
                <>
                  {isLoginMode ? '立即登录' : '立即注册'}
                  <ArrowRight size={18} className="opacity-80" />
                </>
              )}
            </button>
          </form>
        </div>
        
        {/* Footer */}
        <div className="px-8 py-4 bg-background/30 border-t border-border/50 text-center">
          <p className="text-xs text-secondary">
            {isLoginMode ? '还没有账号？' : '已有账号？'}
            <button 
              onClick={toggleMode}
              className="ml-1 text-primary hover:text-accent font-medium transition-colors hover:underline"
            >
              {isLoginMode ? '去注册' : '去登录'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginModal;
