import React, { useState } from 'react';
import { User } from '../../types';
import { registerUser, setCurrentUser, DEFAULT_USER } from '../../services/storage';
import { X, UserPlus, LogIn } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: User) => void;
  currentUser: User | null;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  currentUser,
}) => {
  if (!isOpen) return null;

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'register') {
      if (!name.trim() || !email.trim()) return;
      const newUser = registerUser(name, email);
      onLoginSuccess(newUser);
      onClose();
    } else {
      if (!email.trim()) return;
      // Login simples da V1 simulando sessão do Supabase Auth
      const user: User = {
        id: `usr_${email.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()}`,
        name: email.split('@')[0] || 'Usuário',
        email: email.trim().toLowerCase(),
      };
      setCurrentUser(user);
      onLoginSuccess(user);
      onClose();
    }
  };

  const handleQuickDemo = () => {
    setCurrentUser(DEFAULT_USER);
    onLoginSuccess(DEFAULT_USER);
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-sheet" style={{ maxWidth: '440px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-sheet-header">
          <h2 className="modal-sheet-title">
            {mode === 'login' ? 'Entrar no Caderno' : 'Criar Conta'}
          </h2>
          <button type="button" className="btn-ghost" onClick={onClose} aria-label="Fechar">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-sheet-body">
            <p style={{ fontSize: '0.85rem', color: 'var(--ink-secondary)', marginBottom: '0.25rem' }}>
              {mode === 'login'
                ? 'Acesse seu caderno pessoal para ver suas tarefas, hábitos e metas.'
                : 'Crie seu caderno exclusivo. Cada usuário possui seus dados 100% isolados.'}
            </p>

            {mode === 'register' && (
              <div className="form-group">
                <label className="form-label">Seu Nome</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Pedro Silva"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  autoFocus
                />
              </div>
            )}

            <div className="form-group">
              <label className="form-label">E-mail</label>
              <input
                type="email"
                className="form-input"
                placeholder="seu.email@exemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus={mode === 'login'}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Senha</label>
              <input
                type="password"
                className="form-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="btn-ink-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '0.5rem' }}>
              {mode === 'login' ? (
                <>
                  <LogIn size={16} /> Entrar
                </>
              ) : (
                <>
                  <UserPlus size={16} /> Cadastrar
                </>
              )}
            </button>

            <div style={{ textAlign: 'center', marginTop: '0.75rem', fontSize: '0.82rem', color: 'var(--ink-muted)' }}>
              {mode === 'login' ? (
                <>
                  Não tem conta?{' '}
                  <button
                    type="button"
                    onClick={() => setMode('register')}
                    style={{ color: 'var(--accent-terracotta)', fontWeight: 600, textDecoration: 'underline' }}
                  >
                    Criar nova conta
                  </button>
                </>
              ) : (
                <>
                  Já tem conta?{' '}
                  <button
                    type="button"
                    onClick={() => setMode('login')}
                    style={{ color: 'var(--accent-terracotta)', fontWeight: 600, textDecoration: 'underline' }}
                  >
                    Fazer login
                  </button>
                </>
              )}
            </div>

            <div style={{ borderTop: '1px dashed var(--border-paper)', paddingTop: '1rem', marginTop: '0.5rem', textAlign: 'center' }}>
              <button
                type="button"
                className="btn-ghost"
                onClick={handleQuickDemo}
                style={{ fontSize: '0.8rem', color: 'var(--ink-secondary)' }}
              >
                Alternar para conta de demonstração (Pedro Silva)
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
