import api from '../lib/api';

export interface ReadingLevel {
  _id: string;
  schoolSlug: string;
  name: string;
  description?: string;
  order: number;
  color?: string;
  isActive: boolean;
}

export interface ReaderKeyword {
  word: string;
  meaning: string;
  example?: string;
  pageNumber?: number;
}

export interface ReaderPage {
  pageNumber: number;
  text: string;
  imageUrl?: string;
}

export interface Reader {
  _id: string;
  schoolSlug: string;
  levelId: string;
  title: string;
  author?: string;
  synopsis?: string;
  coverImageUrl?: string;
  coverImageKey?: string;
  audioUrl?: string;
  audioKey?: string;
  pages: ReaderPage[];
  keywords: ReaderKeyword[];
  estimatedMinutes?: number;
  isActive: boolean;
}

export interface CompletedReader {
  readerId: string;
  completedAt: string;
  keywordsLookedUp: string[];
  pointsAwarded: number;
}

export interface StudentReadingProgress {
  studentId: string;
  schoolSlug: string;
  currentLevelId?: string | null;
  assignedBy?: string;
  assignedAt?: string;
  completedReaders: CompletedReader[];
}

export async function uploadReaderCover(file: File) {
  const formData = new FormData();
  formData.append('file', file);
  const { data } = await api.post('/upload/single/reader-covers', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data.data as { url: string; key: string };
}

export async function uploadReaderAudio(file: File) {
  const formData = new FormData();
  formData.append('file', file);
  const { data } = await api.post('/upload/single/reader-audio', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data.data as { url: string; key: string };
}

const guidedReadingService = {
  listLevels: async (): Promise<ReadingLevel[]> => (await api.get('/guided-reading/levels')).data,
  createLevel: async (payload: Partial<ReadingLevel>): Promise<ReadingLevel> => (await api.post('/guided-reading/levels', payload)).data,
  updateLevel: async (id: string, payload: Partial<ReadingLevel>): Promise<ReadingLevel> => (await api.put(`/guided-reading/levels/${id}`, payload)).data,
  removeLevel: async (id: string) => (await api.delete(`/guided-reading/levels/${id}`)).data,

  listReaders: async (levelId?: string): Promise<Reader[]> => (await api.get('/guided-reading/readers', { params: levelId ? { levelId } : undefined })).data,
  getReader: async (id: string): Promise<Reader> => (await api.get(`/guided-reading/readers/${id}`)).data,
  createReader: async (payload: Partial<Reader>): Promise<Reader> => (await api.post('/guided-reading/readers', payload)).data,
  updateReader: async (id: string, payload: Partial<Reader>): Promise<Reader> => (await api.put(`/guided-reading/readers/${id}`, payload)).data,
  removeReader: async (id: string) => (await api.delete(`/guided-reading/readers/${id}`)).data,

  assignStudentLevel: async (studentId: string, levelId: string) => (await api.post(`/guided-reading/students/${studentId}/level`, { levelId })).data,
  getStudentProgress: async (studentId: string): Promise<StudentReadingProgress> => (await api.get(`/guided-reading/students/${studentId}/progress`)).data,
};

export default guidedReadingService;
