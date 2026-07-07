import { useState } from "react";
import { Badge, Btn, Modal, FormField, FInput, FSelect } from "./shared";

// TODO: fetch from API when task management backend is available
type Task = { title: string; doc: string; assigned: string; assignedName: string; priority: string; due: string };
const TASKS_TODO: Task[] = [];
const TASKS_IN_PROGRESS: Task[] = [];
const TASKS_WAITING: Task[] = [];
const TASKS_OVERDUE: Task[] = [];

interface Column {
  id: string;
  title: string;
  color: string;
  tasks: Task[];
  count: number;
}

const TASKS_COMPLETED: Task[] = [];

export default function TasksTab() {
  const [newTask, setNewTask] = useState(false);
  const [viewTask, setViewTask] = useState<Task | null>(null);
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [editForm, setEditForm] = useState<Task | null>(null);

  const columns: Column[] = [
    { id: "todo",        title: "To Do",        color: "#94a3b8",  tasks: TASKS_TODO,        count: TASKS_TODO.length },
    { id: "inprogress",  title: "In Progress",  color: "#3b82f6",  tasks: TASKS_IN_PROGRESS, count: TASKS_IN_PROGRESS.length },
    { id: "waiting",     title: "Waiting",      color: "#EF9F27",  tasks: TASKS_WAITING,     count: TASKS_WAITING.length },
    { id: "completed",   title: "Completed",    color: "#16a34a",  tasks: TASKS_COMPLETED,   count: TASKS_COMPLETED.length },
    { id: "overdue",     title: "Overdue",      color: "#dc2626",  tasks: TASKS_OVERDUE,      count: TASKS_OVERDUE.length },
  ];

  const totalTasks = columns.reduce((a, c) => a + c.count, 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Task Management</h1>
          <p className="text-sm text-slate-500 mt-0.5">Kanban board — document-related tasks across the school</p>
        </div>
        <div className="flex gap-2">
          <Btn variant="secondary" size="sm">📊 List View</Btn>
          <Btn variant="primary" size="sm" onClick={() => setNewTask(true)}>+ New Task</Btn>
        </div>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-5 gap-3 mb-5">
        {columns.map((col) => (
          <div key={col.id} className="bg-white rounded-xl border border-slate-100 shadow-sm p-3">
            <div className="text-xs font-semibold text-slate-500">{col.title}</div>
            <div className="text-2xl font-bold mt-1" style={{ color: col.color }}>{col.count}</div>
          </div>
        ))}
      </div>

      {/* Kanban board */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
        {columns.map((col) => (
          <div key={col.id} className="flex flex-col">
            <div className="flex items-center gap-2 mb-2 px-1">
              <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: col.color }} />
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">{col.title}</span>
              <span className="ml-auto text-xs bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-full font-semibold">{col.count}</span>
            </div>
            <div className="flex-1 space-y-2 min-h-[200px] rounded-xl p-2" style={{ background: col.id === "overdue" ? "#fff5f5" : col.id === "completed" ? "#f0fdf4" : "#f8fafc" }}>
              {col.tasks.map((task, i) => (
                <div
                  key={i}
                  onClick={() => setViewTask(task)}
                  className="bg-white rounded-lg border border-slate-100 shadow-sm p-3 cursor-pointer hover:shadow-md transition-shadow"
                >
                  <div className="text-xs font-semibold text-slate-800 leading-tight mb-1">{task.title}</div>
                  <div className="text-xs text-slate-400 mb-2 truncate">📄 {task.doc}</div>
                  <div className="flex items-center justify-between gap-1">
                    <Badge status={task.priority} />
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                      style={{ background: "#dbeafe", color: "#1d4ed8" }}
                      title={task.assignedName}
                    >{task.assigned}</div>
                  </div>
                  <div className={`text-xs mt-2 font-medium ${col.id === "overdue" ? "text-red-600" : "text-slate-400"}`}>
                    {col.id === "overdue" ? "⚠ " : ""}Due: {task.due}
                  </div>
                </div>
              ))}
              {col.tasks.length === 0 && (
                <div className="text-xs text-slate-300 text-center py-6">No tasks</div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-3 text-xs text-slate-400 text-right">{totalTasks} total tasks</div>

      {/* New Task Modal */}
      <Modal open={newTask} onClose={() => setNewTask(false)} title="Create New Task" size="md">
        <FormField label="Task Title" required><FInput placeholder="e.g. Upload Grade 5 Academic Plan" /></FormField>
        <FormField label="Related Document"><FInput placeholder="Link to document…" /></FormField>
        <FormField label="Assigned To" required>
          <FSelect options={["Ms. Fatima Qureshi", "Sr. Aisha Malik", "Ms. Amna Siddiqui", "Mr. Zahid", "Ms. Sara Anwar", "Principal Yusuf"]} />
        </FormField>
        <FormField label="Priority" required><FSelect options={["Critical", "High", "Medium", "Low"]} /></FormField>
        <FormField label="Due Date" required><FInput type="date" /></FormField>
        <FormField label="Status"><FSelect options={["To Do", "In Progress", "Waiting", "Completed"]} /></FormField>
        <FormField label="Notes">
          <textarea className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C447C]" rows={2} placeholder="Additional notes…" />
        </FormField>
        <div className="flex gap-2 justify-end mt-2">
          <Btn variant="secondary" size="sm" onClick={() => setNewTask(false)}>Cancel</Btn>
          <Btn variant="primary" size="sm">Create Task</Btn>
        </div>
      </Modal>

      {/* Edit Task Modal */}
      <Modal open={!!editTask} onClose={() => { setEditTask(null); setEditForm(null); }} title="Edit Task" size="md">
        {editForm && (
          <div className="p-5 space-y-3">
            <FormField label="Task Title" required>
              <FInput value={editForm.title} onChange={(e) => setEditForm((prev) => prev ? { ...prev, title: e.target.value } : prev)} placeholder="e.g. Upload Grade 5 Academic Plan" />
            </FormField>
            <FormField label="Related Document">
              <FInput value={editForm.doc} onChange={(e) => setEditForm((prev) => prev ? { ...prev, doc: e.target.value } : prev)} placeholder="Link to document…" />
            </FormField>
            <FormField label="Assigned To" required>
              <FSelect
                options={["Ms. Fatima Qureshi", "Sr. Aisha Malik", "Ms. Amna Siddiqui", "Mr. Zahid", "Ms. Sara Anwar", "Principal Yusuf"]}
                value={editForm.assignedName}
                onChange={(e) => setEditForm((prev) => prev ? { ...prev, assignedName: e.target.value, assigned: e.target.value.charAt(0) } : prev)}
              />
            </FormField>
            <FormField label="Priority" required>
              <FSelect
                options={["Critical", "High", "Medium", "Low"]}
                value={editForm.priority}
                onChange={(e) => setEditForm((prev) => prev ? { ...prev, priority: e.target.value } : prev)}
              />
            </FormField>
            <FormField label="Due Date" required>
              <FInput type="date" value={editForm.due} onChange={(e) => setEditForm((prev) => prev ? { ...prev, due: e.target.value } : prev)} />
            </FormField>
            <div className="flex gap-2 justify-end pt-2 border-t border-slate-100">
              <Btn variant="secondary" size="sm" onClick={() => { setEditTask(null); setEditForm(null); }}>Cancel</Btn>
              <Btn variant="primary" size="sm" onClick={() => { setEditTask(null); setEditForm(null); }}>✓ Save Changes</Btn>
            </div>
          </div>
        )}
      </Modal>

      {/* Task Detail Modal */}
      <Modal open={!!viewTask} onClose={() => setViewTask(null)} title="Task Details" size="sm">
        {viewTask && (
          <div className="space-y-3">
            <div>
              <div className="text-xs text-slate-500 font-semibold uppercase tracking-wide mb-1">Title</div>
              <div className="text-sm font-semibold text-slate-800">{viewTask.title}</div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="text-xs text-slate-500 font-semibold uppercase tracking-wide mb-1">Priority</div>
                <Badge status={viewTask.priority} />
              </div>
              <div>
                <div className="text-xs text-slate-500 font-semibold uppercase tracking-wide mb-1">Due Date</div>
                <div className="text-xs font-medium text-slate-700">{viewTask.due}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500 font-semibold uppercase tracking-wide mb-1">Assigned To</div>
                <div className="text-xs text-slate-700">{viewTask.assignedName}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500 font-semibold uppercase tracking-wide mb-1">Document</div>
                <div className="text-xs text-slate-700 truncate">{viewTask.doc}</div>
              </div>
            </div>
            <div className="flex gap-2 justify-end pt-2 border-t border-slate-100">
              <Btn variant="secondary" size="sm" onClick={() => setViewTask(null)}>Close</Btn>
              <Btn variant="primary" size="sm" onClick={() => { setEditForm({ ...viewTask! }); setEditTask(viewTask); setViewTask(null); }}>Edit Task</Btn>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
