import React, { useState } from 'react';
import { X, Copy, Check, Database } from 'lucide-react';
import { SUPABASE_SQL_MIGRATION } from '../../services/storage';

interface SupabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SupabaseModal: React.FC<SupabaseModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const [copied, setCopied] = useState(false);

  const handleCopySql = async () => {
    try {
      await navigator.clipboard.writeText(SUPABASE_SQL_MIGRATION);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error(err);
      alert('Não foi possível copiar. Selecione o script abaixo e copie manualmente.');
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-sheet" style={{ maxWidth: '680px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-sheet-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <Database size={22} style={{ color: 'var(--accent-terracotta)' }} />
            <h2 className="modal-sheet-title">Configurações & Supabase</h2>
          </div>
          <button type="button" className="btn-ghost" onClick={onClose} aria-label="Fechar">
            <X size={20} />
          </button>
        </div>

        <div className="modal-sheet-body">
          <p style={{ fontSize: '0.88rem', color: 'var(--ink-secondary)', lineHeight: 1.5 }}>
            Os dados do <strong>Caderno Digital</strong> ficam no <strong>Supabase</strong>, isolados por
            usuário com Row Level Security. A conexão usa as variáveis <code>VITE_SUPABASE_URL</code> e{' '}
            <code>VITE_SUPABASE_PUBLISHABLE_KEY</code> do arquivo <code>.env</code>.
          </p>

          <div style={{ borderTop: '1px dashed var(--border-paper)', paddingTop: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
              <div>
                <h4 style={{ fontWeight: 600, fontSize: '0.92rem', color: 'var(--ink-primary)' }}>
                  Script SQL DDL & Políticas RLS
                </h4>
                <p style={{ fontSize: '0.78rem', color: 'var(--ink-muted)' }}>
                  Copie e execute no <em>SQL Editor</em> do seu Supabase para criar as 6 tabelas com isolamento multiusuário.
                </p>
              </div>
              <button
                type="button"
                className="btn-ink-secondary"
                onClick={handleCopySql}
                style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', padding: '0.4rem 0.75rem' }}
              >
                {copied ? <Check size={16} /> : <Copy size={16} />}
                {copied ? 'Copiado!' : 'Copiar SQL'}
              </button>
            </div>

            <pre className="sql-box">
              <code>{SUPABASE_SQL_MIGRATION}</code>
            </pre>
          </div>
        </div>

        <div className="modal-sheet-footer">
          <button type="button" className="btn-ink-secondary" onClick={onClose}>
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
