import React from 'react';
import { User } from '../../types';
import { BookOpen, CheckSquare, Calendar, StickyNote, Target, LogOut, Menu, User as UserIcon, Moon } from 'lucide-react';

interface NotebookLayoutProps {
  currentPage: string;
  onPageChange: (page: string) => void;
  currentUser: User;
  taskCount: number;
  habitCount: number;
  sleepCount?: number;
  noteCount: number;
  goalCount: number;
  onOpenAuth: () => void;
  children: React.ReactNode;
}

export const NotebookLayout: React.FC<NotebookLayoutProps> = ({
  currentPage,
  onPageChange,
  currentUser,
  taskCount,
  habitCount,
  sleepCount = 0,
  noteCount,
  goalCount,
  onOpenAuth,
  children,
}) => {
  const navItems = [
    { id: 'home', number: '01', label: 'Início', icon: BookOpen, count: null },
    { id: 'tasks', number: '02', label: 'Tarefas', icon: CheckSquare, count: taskCount },
    { id: 'habits', number: '03', label: 'Hábitos', icon: Calendar, count: habitCount },
    { id: 'sleep', number: '04', label: 'Sono', icon: Moon, count: sleepCount },
    { id: 'notes', number: '05', label: 'Anotações', icon: StickyNote, count: noteCount },
    { id: 'goals', number: '06', label: 'Metas', icon: Target, count: goalCount },
  ];

  return (
    <div className="app-wrapper">
      <div className="notebook-container">
        {/* Lombada/costura decorativa do caderno */}
        <div className="notebook-spine" />

        {/* SIDEBAR: SUMÁRIO DO CADERNO */}
        <aside className="notebook-sidebar">
          <div className="sidebar-header">
            <h1 className="notebook-title">Meu Caderno</h1>
            <div className="notebook-subtitle">Diário & Bullet Journal</div>
          </div>

          <div className="sidebar-nav-title">SUMÁRIO</div>

          <ul className="sidebar-nav-list">
            {navItems.map((item) => {
              const isActive = currentPage === item.id;
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    className={`nav-item-btn ${isActive ? 'active' : ''}`}
                    onClick={() => onPageChange(item.id)}
                  >
                    <span className="nav-number">{item.number}</span>
                    <span className="nav-label">{item.label}</span>
                    {item.count !== null && item.count > 0 && (
                      <span className="nav-badge-count">{item.count}</span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>

          <div className="sidebar-divider" />

          {/* PERFIL DO USUÁRIO & AÇÕES */}
          <div className="sidebar-footer">
            <div className="user-badge" onClick={onOpenAuth} style={{ cursor: 'pointer' }} title="Minha conta">
              <div className="user-info">
                <span className="user-name">{currentUser.name}</span>
                <span className="user-email">{currentUser.email}</span>
              </div>
              <UserIcon size={16} style={{ color: 'var(--ink-muted)' }} />
            </div>

            <button type="button" className="footer-btn" onClick={onOpenAuth}>
              <LogOut size={16} />
              <span>Sair da Conta</span>
            </button>
          </div>
        </aside>

        {/* ÁREA PRINCIPAL: FOLHAS DO CADERNO */}
        <main className="notebook-main">
          {/* BARRA SUPERIOR MOBILE */}
          <div className="mobile-top-bar">
            <div>
              <span style={{ fontFamily: 'var(--font-script)', fontSize: '1.75rem', fontWeight: 700, color: 'var(--ink-primary)' }}>
                Meu Caderno
              </span>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button type="button" className="btn-ghost" onClick={onOpenAuth} title="Conta">
                <UserIcon size={18} />
              </button>
            </div>
          </div>

          {children}
        </main>
      </div>

      {/* BARRA DE NAVEGAÇÃO INFERIOR PARA DISPOSITIVOS MÓVEIS */}
      <nav className="mobile-nav-bar">
        <div className="mobile-nav-items">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                type="button"
                className={`mobile-nav-btn ${isActive ? 'active' : ''}`}
                onClick={() => onPageChange(item.id)}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
};
