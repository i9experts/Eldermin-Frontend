import React, { useState, useEffect, useCallback } from 'react';
import { modulesApi, ModuleItem } from '../../services/modules.api';

const CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
  Foundation: { bg: '#EEF4FB', text: '#1B4F8A' },
  People: { bg: '#EDE9FE', text: '#6D28D9' },
  Finance: { bg: '#D1FAE5', text: '#047857' },
  Admissions: { bg: '#ECFDF5', text: '#059669' },
  Academics: { bg: '#E0F2FE', text: '#0369A1' },
  Students: { bg: '#FEF3DC', text: '#C8811A' },
  Intelligence: { bg: '#FCE7F3', text: '#BE185D' },
};

const TIER_LABELS: Record<string, { label: string; color: string }> = {
  starter: { label: 'Starter', color: '#16A34A' },
  academic: { label: 'Academic Excellence', color: '#1B4F8A' },
  enterprise: { label: 'Enterprise', color: '#F5A623' },
};

export default function ModuleMarketplace() {
  const [modules, setModules] = useState<ModuleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'available' | 'locked'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [confirmModal, setConfirmModal] = useState<{ module: ModuleItem; action: 'activate' | 'deactivate' } | null>(null);

  const fetchModules = useCallback(async () => {
    try {
      setLoading(true);
      const data = await modulesApi.list();
      setModules(data || []);
    } catch (err) {
      console.error('Failed to load modules:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchModules();
  }, [fetchModules]);

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  const handleActivate = async (mod: ModuleItem) => {
    setActionLoading(mod.id);
    try {
      await modulesApi.activate(mod.id);
      setToast({ type: 'success', message: `${mod.name} activated successfully` });
      await fetchModules();
    } catch (err: any) {
      const message = err?.response?.data?.message || `Failed to activate ${mod.name}`;
      setToast({ type: 'error', message });
    } finally {
      setActionLoading(null);
      setConfirmModal(null);
    }
  };

  const handleDeactivate = async (mod: ModuleItem) => {
    setActionLoading(mod.id);
    try {
      await modulesApi.deactivate(mod.id);
      setToast({ type: 'success', message: `${mod.name} deactivated` });
      await fetchModules();
    } catch (err: any) {
      const message = err?.response?.data?.message || `Failed to deactivate ${mod.name}`;
      setToast({ type: 'error', message });
    } finally {
      setActionLoading(null);
      setConfirmModal(null);
    }
  };

  const categories = ['all', ...Array.from(new Set((modules || []).map((m) => m.category)))];

  const filteredModules = (modules || []).filter((m) => {
    if (filter !== 'all' && m.status !== filter) return false;
    if (categoryFilter !== 'all' && m.category !== categoryFilter) return false;
    return true;
  });

  const counts = {
    all: modules.length,
    active: (modules || []).filter((m) => m.status === 'active').length,
    available: (modules || []).filter((m) => m.status === 'available').length,
    locked: (modules || []).filter((m) => m.status === 'locked').length,
  };

  return (
    <div style={{ padding: '24px 32px', maxWidth: 1280, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: '#0D1F35', marginBottom: 6, fontFamily: 'Inter, sans-serif' }}>
          Apps & Modules
        </h1>
        <p style={{ fontSize: 14, color: '#3D5A7A' }}>
          Manage which modules are active for your institution. Activate new modules anytime — deactivate ones you no longer need.
        </p>
      </div>

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 28 }}>
        <SummaryCard label="Total Modules" value={counts.all} color="#1B4F8A" bg="#EEF4FB" />
        <SummaryCard label="Active" value={counts.active} color="#16A34A" bg="#DCFCE7" />
        <SummaryCard label="Available" value={counts.available} color="#2563EB" bg="#DBEAFE" />
        <SummaryCard label="Locked" value={counts.locked} color="#D97706" bg="#FEF3DC" />
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 8 }}>
          {(['all', 'active', 'available', 'locked'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: '8px 16px',
                borderRadius: 100,
                fontSize: 13,
                fontWeight: 600,
                border: filter === f ? 'none' : '1.5px solid #DDE8F4',
                background: filter === f ? '#1B4F8A' : '#fff',
                color: filter === f ? '#fff' : '#3D5A7A',
                cursor: 'pointer',
                textTransform: 'capitalize',
              }}
            >
              {f} ({counts[f]})
            </button>
          ))}
        </div>
        <div style={{ width: 1, height: 24, background: '#DDE8F4', margin: '0 4px' }} />
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          style={{
            padding: '8px 14px',
            borderRadius: 9,
            border: '1.5px solid #DDE8F4',
            fontSize: 13,
            color: '#3D5A7A',
            background: '#fff',
            cursor: 'pointer',
          }}
        >
          {categories.map((c) => (
            <option key={c} value={c}>
              {c === 'all' ? 'All Categories' : c}
            </option>
          ))}
        </select>
      </div>

      {/* Module grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#7A9AB8' }}>Loading modules...</div>
      ) : filteredModules.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#7A9AB8' }}>No modules match this filter.</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          {filteredModules.map((mod) => (
            <ModuleCard
              key={mod.id}
              module={mod}
              isLoading={actionLoading === mod.id}
              onActivateClick={() => setConfirmModal({ module: mod, action: 'activate' })}
              onDeactivateClick={() => setConfirmModal({ module: mod, action: 'deactivate' })}
            />
          ))}
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmModal && (
        <div
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(13,31,53,0.5)', display: 'flex',
            alignItems: 'center', justifyContent: 'center', zIndex: 1000,
          }}
          onClick={() => setConfirmModal(null)}
        >
          <div
            style={{
              background: '#fff', borderRadius: 16, padding: 28, maxWidth: 440,
              width: '90%', boxShadow: '0 24px 80px rgba(13,31,53,0.25)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ fontSize: 32, marginBottom: 12 }}>{confirmModal.module.icon}</div>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: '#0D1F35', marginBottom: 8 }}>
              {confirmModal.action === 'activate' ? 'Activate' : 'Deactivate'} {confirmModal.module.name}?
            </h3>
            <p style={{ fontSize: 14, color: '#3D5A7A', lineHeight: 1.6, marginBottom: 16 }}>
              {confirmModal.action === 'activate'
                ? `This will enable ${confirmModal.module.name} for your institution. You can deactivate it anytime later.`
                : `This will disable ${confirmModal.module.name}. Any data won't be deleted, but the module will be hidden from your sidebar.`}
            </p>
            {confirmModal.action === 'activate' && confirmModal.module.recommendedNames.length > 0 && (
              <div style={{ background: '#EEF4FB', borderRadius: 10, padding: 12, marginBottom: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#1B4F8A', marginBottom: 6, textTransform: 'uppercase' }}>
                  Recommended alongside this
                </div>
                <div style={{ fontSize: 13, color: '#3D5A7A' }}>
                  {confirmModal.module.recommendedNames.join(', ')}
                </div>
              </div>
            )}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button
                onClick={() => setConfirmModal(null)}
                style={{
                  padding: '10px 20px', borderRadius: 9, border: '1.5px solid #DDE8F4',
                  background: 'transparent', color: '#3D5A7A', fontSize: 14, fontWeight: 600, cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={() =>
                  confirmModal.action === 'activate'
                    ? handleActivate(confirmModal.module)
                    : handleDeactivate(confirmModal.module)
                }
                style={{
                  padding: '10px 24px', borderRadius: 9, border: 'none',
                  background: confirmModal.action === 'activate' ? '#1B4F8A' : '#DC2626',
                  color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer',
                }}
              >
                {confirmModal.action === 'activate' ? 'Activate Module' : 'Deactivate Module'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast notification */}
      {toast && (
        <div
          style={{
            position: 'fixed', bottom: 24, right: 24,
            background: toast.type === 'success' ? '#16A34A' : '#DC2626',
            color: '#fff', padding: '14px 20px', borderRadius: 10,
            fontSize: 14, fontWeight: 600, boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
            zIndex: 1001, display: 'flex', alignItems: 'center', gap: 10,
          }}
        >
          <span>{toast.type === 'success' ? '✓' : '✕'}</span>
          {toast.message}
        </div>
      )}
    </div>
  );
}

function SummaryCard({ label, value, color, bg }: { label: string; value: number; color: string; bg: string }) {
  return (
    <div style={{ background: bg, borderRadius: 12, padding: 16 }}>
      <div style={{ fontSize: 24, fontWeight: 800, color, fontFamily: 'Inter, sans-serif' }}>{value}</div>
      <div style={{ fontSize: 12, color: '#3D5A7A', fontWeight: 600, marginTop: 2 }}>{label}</div>
    </div>
  );
}

function ModuleCard({
  module: mod,
  isLoading,
  onActivateClick,
  onDeactivateClick,
}: {
  module: ModuleItem;
  isLoading: boolean;
  onActivateClick: () => void;
  onDeactivateClick: () => void;
}) {
  const catColor = CATEGORY_COLORS[mod.category] || { bg: '#F7FAFD', text: '#3D5A7A' };
  const tier = TIER_LABELS[mod.pricingTier] || { label: mod.pricingTier, color: '#3D5A7A' };

  const statusBadge = {
    active: { bg: '#DCFCE7', text: '#16A34A', label: 'Active' },
    available: { bg: '#DBEAFE', text: '#2563EB', label: 'Available' },
    locked: { bg: '#FEF3DC', text: '#D97706', label: 'Locked' },
  }[mod.status];

  return (
    <div
      style={{
        background: '#fff',
        border: `1.5px solid ${mod.status === 'active' ? '#16A34A33' : '#DDE8F4'}`,
        borderRadius: 14,
        padding: 20,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        position: 'relative',
      }}
    >
      {mod.isCore && (
        <span
          style={{
            position: 'absolute', top: 12, right: 12, fontSize: 10, fontWeight: 700,
            color: '#1B4F8A', background: '#EEF4FB', padding: '2px 8px', borderRadius: 100,
          }}
        >
          CORE
        </span>
      )}

      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <div
          style={{
            width: 44, height: 44, borderRadius: 11, background: catColor.bg,
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0,
          }}
        >
          {mod.icon}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#0D1F35', marginBottom: 2 }}>{mod.name}</div>
          <span style={{ fontSize: 10, fontWeight: 600, color: catColor.text, background: catColor.bg, padding: '2px 8px', borderRadius: 100 }}>
            {mod.category}
          </span>
        </div>
      </div>

      <p style={{ fontSize: 12.5, color: '#3D5A7A', lineHeight: 1.6, margin: 0, minHeight: 56 }}>{mod.description}</p>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: statusBadge.text, background: statusBadge.bg, padding: '3px 10px', borderRadius: 100 }}>
          {statusBadge.label}
        </span>
        <span style={{ fontSize: 10, fontWeight: 600, color: tier.color }}>{tier.label} tier</span>
      </div>

      {mod.status === 'locked' && mod.missingDependencies.length > 0 && (
        <div style={{ fontSize: 11, color: '#D97706', background: '#FEF3DC', padding: '8px 10px', borderRadius: 8, lineHeight: 1.5 }}>
          <strong>Requires:</strong> {mod.missingDependencies.join(', ')}
        </div>
      )}

      <div style={{ marginTop: 'auto', paddingTop: 8 }}>
        {mod.status === 'active' ? (
          mod.isCore ? (
            <button
              disabled
              style={{
                width: '100%', padding: 10, borderRadius: 9, border: '1.5px solid #DDE8F4',
                background: '#F7FAFD', color: '#7A9AB8', fontSize: 13, fontWeight: 600, cursor: 'not-allowed',
              }}
            >
              Core Module
            </button>
          ) : (
            <button
              onClick={onDeactivateClick}
              disabled={isLoading}
              style={{
                width: '100%', padding: 10, borderRadius: 9, border: '1.5px solid #FCA5A5',
                background: '#fff', color: '#DC2626', fontSize: 13, fontWeight: 600,
                cursor: isLoading ? 'wait' : 'pointer',
              }}
            >
              {isLoading ? 'Deactivating...' : 'Deactivate'}
            </button>
          )
        ) : mod.status === 'available' ? (
          <button
            onClick={onActivateClick}
            disabled={isLoading}
            style={{
              width: '100%', padding: 10, borderRadius: 9, border: 'none',
              background: '#1B4F8A', color: '#fff', fontSize: 13, fontWeight: 700,
              cursor: isLoading ? 'wait' : 'pointer',
            }}
          >
            {isLoading ? 'Activating...' : 'Activate Module'}
          </button>
        ) : (
          <button
            disabled
            style={{
              width: '100%', padding: 10, borderRadius: 9, border: '1.5px solid #DDE8F4',
              background: '#F7FAFD', color: '#7A9AB8', fontSize: 13, fontWeight: 600, cursor: 'not-allowed',
            }}
          >
            🔒 Locked
          </button>
        )}
      </div>
    </div>
  );
}
