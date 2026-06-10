import { useQuery } from '@tanstack/react-query';
import teachingService from '../../../services/teaching.service';

export function TeachingDashboardTab() {
  const { data: stats } = useQuery({
    queryKey: ['teaching-dashboard'],
    queryFn: teachingService.getDashboard,
  });

  const cards = [
    { label: 'Total Teachers',       value: stats?.totalTeachers       ?? 0, color: '#0C447C' },
    { label: 'Active Today',          value: stats?.activeTeachers       ?? 0, color: '#1D9E75' },
    { label: 'Pending Lesson Plans',  value: stats?.pendingPlans         ?? 0, color: '#BA7517' },
    { label: 'Overdue Assignments',   value: stats?.overdueAssignments   ?? 0, color: '#E24B4A' },
    { label: 'Total Lesson Plans',    value: stats?.totalLessonPlans     ?? 0, color: '#7F77DD' },
    { label: 'Total Assignments',     value: stats?.totalAssignments     ?? 0, color: '#378ADD' },
    { label: 'Behaviour Notes',       value: stats?.behaviourNotes       ?? 0, color: '#D85A30' },
    { label: 'Positive Notes',        value: stats?.positiveNotes        ?? 0, color: '#1D9E75' },
  ];

  return (
    <div style={{ padding: '16px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '24px' }}>
        {cards.map(card => (
          <div key={card.label} style={{ background: '#fff', border: '0.5px solid #e5e7eb', borderRadius: '8px', padding: '16px', borderTop: `3px solid ${card.color}` }}>
            <div style={{ fontSize: '11px', color: '#888', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{card.label}</div>
            <div style={{ fontSize: '28px', fontWeight: 500, color: card.color }}>{card.value}</div>
          </div>
        ))}
      </div>
      <div style={{ padding: '24px', background: '#f8f9fa', borderRadius: '8px', color: '#666', textAlign: 'center' }}>
        Live data loaded from MongoDB. Add teachers, lesson plans, and assignments to see charts populate.
      </div>
    </div>
  );
}
