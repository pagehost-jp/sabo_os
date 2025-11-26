// SABO OS 1.0 今日やること画面（メイン画面）

import { useState, useEffect } from 'react';
import { getTodayTask, completeTask, deferTask } from '../services/dataService';
import { SaboItem } from '../types';
import './SingleTaskView.css';

interface SingleTaskViewProps {
  onUpdate: () => void;
}

export default function SingleTaskView({ onUpdate }: SingleTaskViewProps) {
  const [task, setTask] = useState<SaboItem | null>(null);

  useEffect(() => {
    loadTask();
  }, []);

  const loadTask = () => {
    const todayTask = getTodayTask();
    setTask(todayTask);
  };

  const handleComplete = () => {
    if (!task) return;

    completeTask(task.id);
    onUpdate();
    loadTask();
  };

  const handleDefer = () => {
    if (!task) return;

    deferTask(task.id);
    onUpdate();
    loadTask();
  };

  if (!task) {
    return (
      <div className="single-task-view">
        <h2 className="task-title">今日やること</h2>
        <div className="task-empty">
          <p>🎉</p>
          <p>やることがありません！</p>
          <p className="task-empty-hint">新しいタスクを入力してください</p>
        </div>
      </div>
    );
  }

  return (
    <div className="single-task-view">
      <h2 className="task-title">今日やること</h2>

      <div className="task-card">
        <div className="task-summary">📝 {task.summary}</div>
        <div className="task-scope">
          {task.scope === 'today' && '📅 今日'}
          {task.scope === 'this_week' && '📆 今週'}
          {task.scope === 'someday' && '📌 いつか'}
        </div>
      </div>

      <div className="task-actions">
        <button className="btn-complete" onClick={handleComplete}>
          完了
        </button>
        <button className="btn-defer" onClick={handleDefer}>
          あとで
        </button>
      </div>
    </div>
  );
}
