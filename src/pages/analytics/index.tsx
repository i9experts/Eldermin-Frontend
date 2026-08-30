// ============================================================
// ANALYTICS — AI INSIGHTS TAB (Claude-powered) + MAIN INDEX
// Eldermin ERP | React + TypeScript
// ============================================================

import React, { useState, useCallback } from 'react';
import {
  Zap, RefreshCw, TrendingUp, AlertTriangle, CheckCircle,
  Brain, Lightbulb, Target, BarChart2, Users, DollarSign,
  BookOpen, Heart, GraduationCap, Activity, Calendar,
  ChevronRight, Download, Filter, Home,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { fetchAllAnalytics, COLORS, SkeletonCard, generateAIInsights } from './types';
import { OverviewTab, AcademicIntelligenceTab } from './OverviewAcademicTabs';
import {
  StudentIntelligenceTab, FinancialIntelligenceTab,
  AdmissionsIntelligenceTab, BehaviourIntelligenceTab,
} from './IntelligenceTabs';
import { ModuleHeader } from '../../components/layout/ModuleHeader';
import { TabBar } from '../../components/layout/TabBar';
import { Button } from '../../components/ui/button';

// ============================================================
// AI INSIGHTS TAB
// ============================================================
interface AIInsight {
  category: string;
  title: string;
  finding: string;
  recommendation: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  module: string;
}

const priorityConfig = {
  critical: { color: 'border-l-red-500 bg-red-50', badge: 'bg-red-100 text-red-700', label: 'Critical' },
  high: { color: 'border-l-orange-500 bg-orange-50', badge: 'bg-orange-100 text-orange-700', label: 'High' },
  medium: { color: 'border-l-amber-500 bg-amber-50', badge: 'bg-amber-100 text-amber-700', label: 'Medium' },
  low: { color: 'border-l-blue-500 bg-blue-50', badge: 'bg-blue-100 text-blue-700', label: 'Low' },
};

export const AIInsightsTab: React.FC<{ analyticsData: any }> = ({ analyticsData }) => {
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzed, setAnalyzed] = useState(false);
  const [error, setError] = useState('');
  const [selectedModule, setSelectedModule] = useState('all');

  const generateInsights = useCallback(async () => {
    setIsAnalyzing(true);
    setError('');

    try {
      const d = analyticsData;

      // Build data summary for Claude
      const summary = {
        students: {
          total: d?.studentStats?.students?.active || 0,
          male: d?.studentStats?.students?.male || 0,
          female: d?.studentStats?.students?.female || 0,
          todayAttendance: d?.studentStats?.todayAttendance || {},
          feeOutstanding: d?.studentStats?.fees?.outstanding || 0,
        },
        admissions: {
          leads: d?.admissionDash?.stats?.totalLeads || 0,
          applications: d?.admissionDash?.stats?.totalApplications || 0,
          enrolled: d?.admissionDash?.stats?.enrolled || 0,
          conversionRate: d?.admissionDash?.stats?.conversionRate || 0,
          avgProcessingDays: d?.admissionDash?.stats?.averageProcessingDays || 0,
          topSources: (d?.admissionDash?.sourceBreakdown || []).slice(0, 3),
        },
        finance: {
          totalCollected: d?.financeDash?.summary?.totalCollected || 0,
          totalOutstanding: d?.financeDash?.summary?.totalOutstanding || 0,
          collectedThisMonth: d?.financeDash?.summary?.collectedThisMonth || 0,
          expensesThisMonth: d?.financeDash?.summary?.expensesThisMonth || 0,
        },
        assessments: {
          total: d?.assessmentDash?.stats?.total || 0,
          published: d?.assessmentDash?.stats?.published || 0,
          totalMarksEntered: d?.assessmentDash?.stats?.totalMarksEntered || 0,
          subjectPerformance: (d?.assessmentAnalytics?.subjectWise || []).slice(0, 5),
          atRiskStudents: (d?.assessmentAnalytics?.weakStudents || []).length,
        },
        behaviour: {
          totalIncidents: d?.behaviourDash?.stats?.totalIncidents || 0,
          positiveIncidents: d?.behaviourDash?.stats?.positiveIncidents || 0,
          negativeIncidents: d?.behaviourDash?.stats?.negativeIncidents || 0,
          unresolvedCritical: d?.behaviourDash?.stats?.unresolvedCritical || 0,
          activeInterventions: d?.behaviourDash?.stats?.activeInterventions || 0,
          overdueFollowUps: d?.behaviourDash?.stats?.overdueFollowUps || 0,
          studentsAtRisk: (d?.behaviourDash?.studentsAtRisk || []).length,
          tarbiyahAvgScore: d?.behaviourDash?.tarbiyahSummary?.avgScore || 0,
        },
      };

      const result = await generateAIInsights(summary);
      setInsights(result.insights || []);
      setAnalyzed(true);
    } catch (err) {
      setError('Could not generate insights. Please try again.');
      console.error(err);
    } finally {
      setIsAnalyzing(false);
    }
  }, [analyticsData]);

  const filtered = selectedModule === 'all'
    ? insights
    : insights.filter(i => i.category.toLowerCase() === selectedModule.toLowerCase());

  const categories = ['all', ...new Set(insights.map(i => i.category))];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#1e3a5f] via-indigo-800 to-purple-900 rounded-xl p-6 text-white">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Brain size={20} className="text-purple-300" />
              <span className="text-purple-300 text-xs font-semibold uppercase tracking-wider">AI-Powered</span>
            </div>
            <h2 className="text-xl font-bold">Intelligence Analysis</h2>
            <p className="text-indigo-200 text-xs mt-1 max-w-lg">
              Claude AI analyzes your school's live data across all modules — students, finance, admissions, behaviour, and academics — to surface actionable insights.
            </p>
          </div>
          <button
            onClick={generateInsights}
            disabled={isAnalyzing}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all
              ${isAnalyzing
                ? 'bg-white/20 text-white/60 cursor-not-allowed'
                : 'bg-white text-[#1e3a5f] hover:bg-indigo-50 shadow-lg'}`}
          >
            {isAnalyzing
              ? <><RefreshCw size={15} className="animate-spin" /> Analyzing...</>
              : <><Zap size={15} /> {analyzed ? 'Re-analyze' : 'Generate Insights'}</>}
          </button>
        </div>

        {/* What Claude analyzes */}
        <div className="grid grid-cols-6 gap-2 mt-5">
          {[
            { icon: <Users size={13} />, label: 'Students' },
            { icon: <DollarSign size={13} />, label: 'Finance' },
            { icon: <GraduationCap size={13} />, label: 'Admissions' },
            { icon: <BookOpen size={13} />, label: 'Academics' },
            { icon: <Heart size={13} />, label: 'Tarbiyah' },
            { icon: <Activity size={13} />, label: 'Behaviour' },
          ].map(m => (
            <div key={m.label} className="flex items-center gap-1.5 bg-white/10 rounded-lg px-2.5 py-1.5 text-[10px] text-indigo-200">
              {m.icon} {m.label}
            </div>
          ))}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3 text-xs text-red-700">
          <AlertTriangle size={14} className="flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Loading */}
      {isAnalyzing && (
        <div className="space-y-4">
          <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 text-center">
            <RefreshCw size={20} className="animate-spin text-indigo-500 mx-auto mb-2" />
            <p className="text-sm font-medium text-indigo-700">Claude is analyzing your school data...</p>
            <p className="text-xs text-indigo-400 mt-1">Reviewing students, finance, admissions, behaviour & academics</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-100 p-5 animate-pulse">
                <div className="h-3 bg-gray-200 rounded w-20 mb-3" />
                <div className="h-5 bg-gray-200 rounded w-48 mb-3" />
                <div className="space-y-1.5">
                  <div className="h-2.5 bg-gray-100 rounded" />
                  <div className="h-2.5 bg-gray-100 rounded w-5/6" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Not yet analyzed */}
      {!analyzed && !isAnalyzing && (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
          <Brain size={48} className="mx-auto text-gray-200 mb-4" />
          <h3 className="text-sm font-semibold text-gray-600">Ready to Analyze</h3>
          <p className="text-xs text-gray-400 mt-2 max-w-sm mx-auto">
            Click "Generate Insights" to get Claude AI's analysis of your school's performance across all modules.
          </p>
          <button onClick={generateInsights}
            className="mt-5 flex items-center gap-2 bg-[#1e3a5f] text-white text-xs px-5 py-2.5 rounded-lg hover:bg-[#16304f] font-medium mx-auto">
            <Zap size={13} /> Generate AI Insights
          </button>
        </div>
      )}

      {/* Insights */}
      {analyzed && !isAnalyzing && insights.length > 0 && (
        <div className="space-y-4">
          {/* Summary Strip */}
          <div className="grid grid-cols-4 gap-3">
            {(['critical', 'high', 'medium', 'low'] as const).map(p => {
              const count = insights.filter(i => i.priority === p).length;
              const cfg = priorityConfig[p];
              return (
                <div key={p} className={`rounded-xl p-3 border-l-4 ${cfg.color} flex items-center gap-3`}>
                  <div>
                    <p className="text-lg font-bold text-gray-800">{count}</p>
                    <p className="text-[10px] text-gray-500 capitalize">{p} priority</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Category Filter */}
          <div className="flex gap-2 flex-wrap">
            {categories.map(c => (
              <button key={c} onClick={() => setSelectedModule(c)}
                className={`text-xs px-3 py-1.5 rounded-lg border font-medium capitalize transition-all
                  ${selectedModule === c ? 'bg-[#1e3a5f] text-white border-[#1e3a5f]' :
                    'bg-white text-gray-600 border-gray-200 hover:border-gray-300'}`}>
                {c === 'all' ? `All Insights (${insights.length})` : `${c} (${insights.filter(i => i.category === c).length})`}
              </button>
            ))}
          </div>

          {/* Insight Cards */}
          <div className="grid grid-cols-1 gap-4">
            {filtered.map((insight, i) => {
              const cfg = priorityConfig[insight.priority];
              return (
                <div key={i} className={`bg-white rounded-xl border-l-4 p-5 shadow-sm hover:shadow-md transition-all ${cfg.color.split(' ')[0]}`}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${cfg.badge}`}>
                        {cfg.label}
                      </span>
                      <span className="text-[10px] font-medium text-[#1e3a5f] bg-blue-50 px-2 py-0.5 rounded-full">
                        {insight.category}
                      </span>
                      <span className="text-[10px] text-gray-400">→ {insight.module}</span>
                    </div>
                  </div>
                  <h3 className="text-sm font-bold text-gray-800 mb-2">{insight.title}</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[10px] font-semibold text-gray-400 uppercase mb-1">Finding</p>
                      <p className="text-xs text-gray-700 leading-relaxed">{insight.finding}</p>
                    </div>
                    <div className="bg-white/70 rounded-lg p-3 border border-gray-100">
                      <p className="text-[10px] font-semibold text-[#1e3a5f] uppercase mb-1 flex items-center gap-1">
                        <Lightbulb size={9} /> Recommendation
                      </p>
                      <p className="text-xs text-gray-700 leading-relaxed">{insight.recommendation}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================
// MAIN ANALYTICS INDEX
// ============================================================
const CURRENT_YEAR = '2025-26';
const CURRENT_MONTH = new Date().toISOString().slice(0, 7); // 2025-02

const TABS = [
  { key: 'overview', label: 'Overview', icon: Home },
  { key: 'academic', label: 'Academic Intelligence', icon: BookOpen },
  { key: 'students', label: 'Student Intelligence', icon: Users },
  { key: 'financial', label: 'Financial Intelligence', icon: DollarSign },
  { key: 'admissions', label: 'Admissions Intelligence', icon: GraduationCap },
  { key: 'behaviour', label: 'Behaviour Intelligence', icon: Heart },
  { key: 'ai', label: 'AI Insights', icon: Brain, highlight: true },
] as const;

type TabKey = typeof TABS[number]['key'];

const AnalyticsDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [academicYear, setAcademicYear] = useState(CURRENT_YEAR);

  const { data, isLoading, refetch, dataUpdatedAt } = useQuery({
    queryKey: ['analytics', 'all', academicYear],
    queryFn: () => fetchAllAnalytics(academicYear, CURRENT_MONTH),
    staleTime: 2 * 60 * 1000, // 2 mins
    refetchOnWindowFocus: false,
  });

  const lastUpdated = dataUpdatedAt
    ? new Date(dataUpdatedAt).toLocaleTimeString()
    : 'Never';

  const renderTab = () => {
    switch (activeTab) {
      case 'overview': return <OverviewTab data={data} isLoading={isLoading} />;
      case 'academic': return <AcademicIntelligenceTab data={data} isLoading={isLoading} />;
      case 'students': return <StudentIntelligenceTab data={data} isLoading={isLoading} />;
      case 'financial': return <FinancialIntelligenceTab data={data} isLoading={isLoading} />;
      case 'admissions': return <AdmissionsIntelligenceTab data={data} isLoading={isLoading} />;
      case 'behaviour': return <BehaviourIntelligenceTab data={data} isLoading={isLoading} />;
      case 'ai': return <AIInsightsTab analyticsData={data} />;
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100">
        <ModuleHeader
          icon={BarChart2}
          title="Analytics & Intelligence"
          subtitle={`Live data from all modules · Last updated ${lastUpdated}`}
          actions={
            <>
              {/* Academic Year Filter */}
              <select value={academicYear} onChange={e => setAcademicYear(e.target.value)}
                className="text-xs border border-gray-200 rounded-lg px-3 py-2 text-gray-600 focus:outline-none">
                <option value="2025-26">2025–26</option>
                <option value="2024-25">2024–25</option>
              </select>

              {/* Refresh */}
              <Button variant="outline" size="sm" className="text-xs" onClick={() => refetch()}>
                <RefreshCw size={13} className={`mr-1.5 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </>
          }
        />

        {/* Tabs */}
        <div className="px-6">
          <TabBar
            tabs={TABS.map(tab => ({
              id: tab.key,
              label: tab.label,
              icon: tab.icon,
              count: (tab as any).highlight ? 'AI' : undefined,
              badgeVariant: (tab as any).highlight ? 'highlight' as const : 'default' as const,
            }))}
            activeId={activeTab}
            onChange={(id) => setActiveTab(id as TabKey)}
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {renderTab()}
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
