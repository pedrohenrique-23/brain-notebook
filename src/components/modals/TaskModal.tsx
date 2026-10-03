import React, { useState } from 'react';
import { Task, TaskCategory, TaskPriority, TaskStatus } from '../../types';
import { X } from 'lucide-react';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (taskData: Omit<Task, 'id' | 'created_at' | 'updated_at'> & { id?: string }) => void;
  taskToEdit?: Task | null;
  userId: string;
}

export const TaskModal: React.FC<TaskModalProps> = ({
  isOpen,
  onClose,
  onSave,
  taskToEdit,
  userId,
}) => {
  if (!isOpen) return null;

  const [title, setTitle] = useState(taskToEdit?.title || '');
  const [description, setDescription] = useState(taskToEdit?.description || '');
  const [status, setStatus] = useState<TaskStatus>(taskToEdit?.status || 'pending');
  const [priority, setPriority] = useState<TaskPriority>(taskToEdit?.priority || 'medium');
  const [dueDate, setDueDate] = useState(taskToEdit?.due_date || new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState<TaskCategory>(taskToEdit?.category || 'Pessoal');
  const [recurrence, setRecurrence] = useState<'none' | 'daily' | 'weekly' | 'monthly'>(taskToEdit?.recurrence || 'none');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onSave({
      id: taskToEdit?.id,
      user_id: userId,
      title: title.trim(),
      description: description.trim(),
      status,
      priority,
      due_date: dueDate || undefined,
      category,
      recurrence,
    });
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="modal-sheet-header">
          <h2 className="modal-sheet-title">
            {taskToEdit ? 'Editar Tarefa' : 'Nova Tarefa'}
          </h2>
          <button type="button" className="btn-ghost" onClick={onClose} aria-label="Fechar">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-sheet-body">
            <div className="form-group">
              <label className="form-label">Título da Tarefa *</label>
              <input
                type="text"
                className="form-input"
                placeholder="Ex: Ler a Bíblia (Gênesis 12-15)"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                autoFocus
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Descrição / Detalhes</label>
              <textarea
                className="form-textarea"
                placeholder="Anotações adicionais ou checklist da tarefa..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Status (Bullet Journal)</label>
                <select
                  className="form-select"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as TaskStatus)}
                >
                  <option value="pending">○ Pendente</option>
                  <option value="in_progress">◐ Em andamento</option>
                  <option value="completed">● Concluída</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Prioridade</label>
                <select
                  className="form-select"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as TaskPriority)}
                >
                  <option value="low">Baixa</option>
                  <option value="medium">Média</option>
                  <option value="high">Alta</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Data Limite</label>
                <input
                  type="date"
                  className="form-input"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Categoria</label>
                <select
                  className="form-select"
                  value={category}
                  onChange={(e) => setCategory(e.target.value as TaskCategory)}
                >
                  <option value="Pessoal">Pessoal</option>
                  <option value="Trabalho">Trabalho</option>
                  <option value="Estudos">Estudos</option>
                  <option value="Saúde">Saúde</option>
                  <option value="Espiritual">Espiritual</option>
                  <option value="Geral">Geral</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Recorrência</label>
              <select
                className="form-select"
                value={recurrence}
                onChange={(e) => setRecurrence(e.target.value as any)}
              >
                <option value="none">Nenhuma (Única)</option>
                <option value="daily">Diária</option>
                <option value="weekly">Semanal</option>
                <option value="monthly">Mensal</option>
              </select>
            </div>
          </div>

          <div className="modal-sheet-footer">
            <button type="button" className="btn-ink-secondary" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn-ink-primary">
              {taskToEdit ? 'Atualizar Tarefa' : 'Registrar Tarefa'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
