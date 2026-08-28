// ============================================================
// KNOWLEDGE BASE SERVICE — API client for /kb/* endpoints
// Eldermin ERP
//
// KB content is GLOBAL platform content (not tenant-scoped) — the
// backend does not filter by school, so these calls return the same
// content regardless of which school the logged-in user belongs to.
// ============================================================

import api from '../lib/api';

export interface KbArticle {
  _id?: string;
  module: string;
  tabKey: string;
  title: string;
  tagline: string;
  body: string;
  steps: string[];
  order: number;
}

const kbService = {
  /** GET /kb/articles/:module/:tabKey — the article for one specific tab */
  getKbArticle: async (module: string, tabKey: string): Promise<KbArticle> => {
    const { data } = await api.get(`/kb/articles/${module}/${tabKey}`);
    return data;
  },

  /** GET /kb/articles?module=hr — all articles for a module, sorted by order */
  listKbArticles: async (module?: string): Promise<KbArticle[]> => {
    const { data } = await api.get('/kb/articles', { params: module ? { module } : undefined });
    return data;
  },

  /** GET /kb/search?q=... — matches across every module, not just the current one */
  searchKb: async (query: string): Promise<KbArticle[]> => {
    if (!query || !query.trim()) return [];
    const { data } = await api.get('/kb/search', { params: { q: query } });
    return data;
  },

  // ── Content management (super admin only) ─────────────────────────────
  createKbArticle: async (payload: Partial<KbArticle>): Promise<KbArticle> => {
    const { data } = await api.post('/kb/articles', payload);
    return data;
  },
  updateKbArticle: async (id: string, payload: Partial<KbArticle>): Promise<KbArticle> => {
    const { data } = await api.patch(`/kb/articles/${id}`, payload);
    return data;
  },
  deleteKbArticle: async (id: string): Promise<{ deleted: boolean }> => {
    const { data } = await api.delete(`/kb/articles/${id}`);
    return data;
  },
};

export default kbService;
