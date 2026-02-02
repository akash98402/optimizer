
import React, { useState, useEffect } from 'react';
import { Task, TaskCategory, TaskStatus } from '../types';

interface TaskFormProps {
  onSave: (task: Task) => void;
  onCancel: () => void;
  editingTask?: Task | null;
}

const TaskForm: React.FC<TaskFormProps> = ({ onSave, onCancel, editingTask }) => {
  const [formData, setFormData] = useState({
    title: '',
    category: TaskCategory.ASSIGNMENT,
    deadline: '',
    effortHours: 1,
    academicWeight: 0.1
  });

  useEffect(() => {
    if (editingTask) {
      setFormData({
        title: editingTask.title,
        category: editingTask.category,
        deadline: editingTask.deadline,
        effortHours: editingTask.effortHours,
        academicWeight: editingTask.academicWeight
      });
    }
  }, [editingTask]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newTask: Task = {
      id: editingTask?.id || crypto.randomUUID(),
      ...formData,
      status: editingTask?.status || TaskStatus.PENDING,
      priorityScore: 0 // Recalculated by parent
    };
    onSave(newTask);
  };

  const inputClass = "w-full bg-white text-black placeholder-gray-400 border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none transition-all";

  return (
    <div className="bg-white p-8 rounded-3xl shadow-2xl border border-gray-100 max-w-xl mx-auto">
      <h3 className="text-2xl font-black mb-6 text-[#111827]">
        {editingTask ? '📝 Edit Task' : '➕ Add New Task'}
      </h3>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1.5 uppercase tracking-wide">Task Title</label>
          <input
            type="text"
            required
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className={inputClass}
            placeholder="e.g. Physics Lab Report"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5 uppercase tracking-wide">Category</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value as TaskCategory })}
              className={inputClass}
            >
              {Object.values(TaskCategory).map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5 uppercase tracking-wide">Deadline</label>
            <input
              type="datetime-local"
              required
              value={formData.deadline}
              onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
              className={inputClass}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5 uppercase tracking-wide">Effort (1-10h)</label>
            <input
              type="number"
              min="1"
              max="10"
              required
              value={formData.effortHours}
              onChange={(e) => setFormData({ ...formData, effortHours: Number(e.target.value) })}
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5 uppercase tracking-wide">Weight (0.1 - 1.0)</label>
            <input
              type="number"
              step="0.1"
              min="0.1"
              max="1.0"
              required
              value={formData.academicWeight}
              onChange={(e) => setFormData({ ...formData, academicWeight: Number(e.target.value) })}
              className={inputClass}
            />
          </div>
        </div>

        <div className="flex gap-4 pt-4">
          <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-black py-3 px-4 rounded-xl transition-all shadow-lg shadow-blue-100">
            {editingTask ? 'Update Task' : 'Create Task'}
          </button>
          <button type="button" onClick={onCancel} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 px-4 rounded-xl transition-all">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default TaskForm;
