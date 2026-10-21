import api from '../lib/api';

export interface AssignHomeTaskPayload {
  studentIds: string[];
  title: string;
  description?: string;
  traitKey?: string;
  assignedDate: string;
  dueDate?: string;
}

const homeTasksService = {
  assign: async (payload: AssignHomeTaskPayload) => {
    const { data } = await api.post('/home-tasks/assign', payload);
    return data;
  },
  getClassTasks: async (params: { grade: string; section?: string }) => {
    const { data } = await api.get('/home-tasks/class', { params });
    return data;
  },
  review: async (taskId: string, payload: { reviewRating: number; reviewNotes?: string }) => {
    const { data } = await api.patch(`/home-tasks/${taskId}/review`, payload);
    return data;
  },
};

export default homeTasksService;
