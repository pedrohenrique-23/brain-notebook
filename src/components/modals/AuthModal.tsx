import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { X, UserPlus, LogIn, LogOut, Eye, EyeOff } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  // false quando o modal funciona como tela de login obrigatória (sem fechar)
  dismissible?: boolean;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, dismissible = true }) => {
  const { user, signIn, signUp, signOut } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  // Depois de todos os hooks (regras dos Hooks)
  if (!isOpen) return null;

  const switchMode = (next: 'login' | 'register') => {
    setMode(next);
    setShowPassword(false);
    setErrorMessage(null);
    setInfoMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) return;
    if (mode === 'register' && !name.trim()) return;

    setIsSubmitting(true);
    setErrorMessage(null);
    setInfoMessage(null);
    try {
      if (mode === 'register') {
        const { hasSession } = await signUp(name, email, password);
        if (!hasSession) {
          // Projeto com confirmação de e-mail ativa: a sessão só existe após o link
          setInfoMessage('Conta criada! Confirme o cadastro pelo link enviado ao seu e-mail e depois faça login.');
          setMode('login');
          setPassword('');
          setShowPassword(false);
          return;
        }
      } else {
        await signIn(email, password);
      }
      onClose();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Erro inesperado na autenticação.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignOut = async () => {
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      await signOut();
      onClose();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Erro ao sair da conta.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (user) {
    return (
      <div className="modal-backdrop" onClick={onClose}>
        <div className="modal-sheet" style={{ maxWidth: '440px' }} onClick={(e) => e.stopPropagation()}>
          <div className="modal-sheet-header">
            <h2 className="modal-sheet-title">Sua Conta</h2>
            <button type="button" className="btn-ghost" onClick={onClose} aria-label="Fechar">
              <X size={20} />
            </button>
          </div>
          <div className="modal-sheet-body">
            <p style={{ fontSize: '0.85rem', color: 'var(--ink-secondary)' }}>
              Conectado como <strong>{user.name}</strong> ({user.email}).
            </p>
            {errorMessage && (
              <p role="alert" style={{ color: 'var(--accent-terracotta)', fontSize: '0.8rem' }}>
                {errorMessage}
              </p>
            )}
            <button
              type="button"
              className="btn-ink-primary"
              onClick={handleSignOut}
              disabled={isSubmitting}
              style={{ width: '100%', justifyContent: 'center', marginTop: '0.5rem' }}
            >
              <LogOut size={16} /> {isSubmitting ? 'Saindo...' : 'Sair da conta'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-backdrop" onClick={dismissible ? onClose : undefined}>
      <div className="modal-sheet" style={{ maxWidth: '440px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-sheet-header">
          <h2 className="modal-sheet-title">
            {mode === 'login' ? 'Entrar no Caderno' : 'Criar Conta'}
          </h2>
          {dismissible && (
            <button type="button" className="btn-ghost" onClick={onClose} aria-label="Fechar">
              <X size={20} />
            </button>
          )}
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
              <label className="form-label" htmlFor="auth-password">Senha</label>
              <div style={{ position: 'relative' }}>
                <input
                  id="auth-password"
                  type={showPassword ? 'text' : 'password'}
                  className="form-input"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={6}
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  required
                  style={{ paddingRight: '2.5rem', width: '100%' }}
                />
                <button
                  type="button"
                  className="btn-ghost"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                  aria-pressed={showPassword}
                  style={{
                    position: 'absolute',
                    right: '0.5rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {errorMessage && (
              <p role="alert" style={{ color: 'var(--accent-terracotta)', fontSize: '0.8rem' }}>
                {errorMessage}
              </p>
            )}
            {infoMessage && (
              <p role="status" style={{ color: 'var(--ink-secondary)', fontSize: '0.8rem' }}>
                {infoMessage}
              </p>
            )}

            <button type="submit" className="btn-ink-primary" disabled={isSubmitting} style={{ width: '100%', justifyContent: 'center', marginTop: '0.5rem' }}>
              {mode === 'login' ? (
                <>
                  <LogIn size={16} /> {isSubmitting ? 'Entrando...' : 'Entrar'}
                </>
              ) : (
                <>
                  <UserPlus size={16} /> {isSubmitting ? 'Cadastrando...' : 'Cadastrar'}
                </>
              )}
            </button>

            <div style={{ textAlign: 'center', marginTop: '0.75rem', fontSize: '0.82rem', color: 'var(--ink-muted)' }}>
              {mode === 'login' ? (
                <>
                  Não tem conta?{' '}
                  <button
                    type="button"
                    onClick={() => switchMode('register')}
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
                    onClick={() => switchMode('login')}
                    style={{ color: 'var(--accent-terracotta)', fontWeight: 600, textDecoration: 'underline' }}
                  >
                    Fazer login
                  </button>
                </>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};