import React, { useState } from 'react';
import { X, Copy, Check, Database, Download, Upload } from 'lucide-react';
import { getSupabaseConfig, saveSupabaseConfig, SUPABASE_SQL_MIGRATION } from '../../services/storage';

interface SupabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDataRefresh: () => void;
}

export const SupabaseModal: React.FC<SupabaseModalProps> = ({
  isOpen,
  onClose,
  onDataRefresh,
}) => {
  if (!isOpen) return null;

  const currentConfig = getSupabaseConfig();
  const [url, setUrl] = useState(currentConfig.url);
  const [anonKey, setAnonKey] = useState(currentConfig.anonKey);
  const [copied, setCopied] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    saveSupabaseConfig(url, anonKey);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_MIGRATION);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleExportBackup = () => {
    const backupData: Record<string, any> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('caderno_')) {
        try {
          backupData[key] = JSON.parse(localStorage.getItem(key) || '{}');
        } catch {
          backupData[key] = localStorage.getItem(key);
        }
      }
    }
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const downloadUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = `caderno-digital-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(downloadUrl);
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        Object.keys(data).forEach((key) => {
          if (key.startsWith('caderno_')) {
            localStorage.setItem(key, typeof data[key] === 'string' ? data[key] : JSON.stringify(data[key]));
          }
        });
        alert('Backup restaurado com sucesso no Caderno!');
        onDataRefresh();
        onClose();
      } catch (err) {
        alert('Erro ao carregar o arquivo JSON de backup.');
      }
    };
    reader.readAsText(file);
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
            O <strong>Caderno Digital</strong> foi estruturado de acordo com a arquitetura definida na V1:
            isolamento de dados por <code>user_id</code>, persistência local imediata e total compatibilidade com
            o PostgreSQL do <strong>Supabase</strong> para a evolução SaaS.
          </p>

          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
            <div className="form-group">
              <label className="form-label">URL do Projeto Supabase</label>
              <input
                type="text"
                className="form-input"
                placeholder="https://xyzcompany.supabase.co"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Chave Anônima Pública (anon key)</label>
              <input
                type="password"
                className="form-input"
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                value={anonKey}
                onChange={(e) => setAnonKey(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.25rem' }}>
              <span style={{ fontSize: '0.8rem', color: savedSuccess ? 'var(--accent-sage)' : 'var(--ink-muted)' }}>
                {savedSuccess ? 'Configurações salvas!' : (url && anonKey ? 'Conectado ao Supabase' : 'Modo local ativo com persistência')}
              </span>
              <button type="submit" className="btn-ink-primary">
                Salvar Credenciais
              </button>
            </div>
          </form>

          <div style={{ borderTop: '1px dashed var(--border-paper)', paddingTop: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
              <div>
                <h4 style={{ fontWeight: 600, fontSize: '0.92rem', color: 'var(--ink-primary)' }}>
                  Script SQL DDL & Políticas RLS
                </h4>
                <p style={{ fontSize: '0.78rem', color: 'var(--ink-muted)' }}>
                  Copie e execute no <em>SQL Editor</em> do seu Supabase para criar as 5 tabelas com isolamento multiusuário.
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

          <div style={{ borderTop: '1px dashed var(--border-paper)', paddingTop: '1.25rem' }}>
            <h4 style={{ fontWeight: 600, fontSize: '0.92rem', color: 'var(--ink-primary)', marginBottom: '0.35rem' }}>
              Backup e Exportação dos Dados do Caderno
            </h4>
            <p style={{ fontSize: '0.78rem', color: 'var(--ink-muted)', marginBottom: '0.75rem' }}>
              Baixe um arquivo JSON com todas as suas tarefas, hábitos, anotações e metas, ou restaure em outro dispositivo.
            </p>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                type="button"
                className="btn-ink-secondary"
                onClick={handleExportBackup}
                style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
              >
                <Download size={16} /> Exportar Backup (JSON)
              </button>

              <label className="btn-ink-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }}>
                <Upload size={16} /> Importar Backup
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportBackup}
                  style={{ display: 'none' }}
                />
              </label>
            </div>
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
