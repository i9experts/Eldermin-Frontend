// ============================================================
// TAB BAR — shared module-level tab navigation.
//
// Canonical conventions (previously three incompatible styles
// across modules, now just one):
//   - underline active-indicator (border-b-2, navy #1e3a5f)
//   - icons always rendered via the `size={14}` lucide-react prop
//     (never `className="w-4 h-4"`)
//   - one badge convention: a small red circle for "needs
//     attention" counts, or a purple "highlight" pill for a
//     called-out feature tab (e.g. an AI-powered tab) — nothing
//     else (no amber pills, no indigo pills, no red pills)
//   - horizontal scroll with edge chevrons, preserved from the
//     modules that already needed it (Institution Setup,
//     Finance — both have 12+ tabs that overflow on narrow /
//     laptop-width screens)
// ============================================================

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface TabBarItem {
  id: string;
  label: string;
  icon: LucideIcon;
  /** Badge shown after the label. Omit, 0, or falsy hides the badge. */
  count?: number | string;
  /** 'default' = red "needs attention" circle. 'highlight' = purple feature pill. */
  badgeVariant?: 'default' | 'highlight';
}

export interface TabBarProps {
  tabs: TabBarItem[];
  activeId: string;
  onChange: (id: string) => void;
  className?: string;
  /** Optional extra control anchored to the right of the scrollable tab strip (e.g. a help/knowledge-base button). */
  rightSlot?: React.ReactNode;
}

export const TabBar: React.FC<TabBarProps> = ({ tabs, activeId, onChange, className = '', rightSlot }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollButtons = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    updateScrollButtons();
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener('scroll', updateScrollButtons);
    window.addEventListener('resize', updateScrollButtons);
    let ro: ResizeObserver | undefined;
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(updateScrollButtons);
      ro.observe(el);
    }
    return () => {
      el.removeEventListener('scroll', updateScrollButtons);
      window.removeEventListener('resize', updateScrollButtons);
      ro?.disconnect();
    };
  }, [updateScrollButtons, tabs.length]);

  const scrollTabs = (direction: 1 | -1) => {
    scrollRef.current?.scrollBy({ left: direction * 220, behavior: 'smooth' });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
    let nextIndex: number | null = null;
    if (e.key === 'ArrowRight') nextIndex = (index + 1) % tabs.length;
    else if (e.key === 'ArrowLeft') nextIndex = (index - 1 + tabs.length) % tabs.length;
    else if (e.key === 'Home') nextIndex = 0;
    else if (e.key === 'End') nextIndex = tabs.length - 1;
    if (nextIndex === null) return;
    e.preventDefault();
    const nextTab = tabs[nextIndex];
    onChange(nextTab.id);
    const btn = scrollRef.current?.querySelectorAll<HTMLButtonElement>('[role="tab"]')[nextIndex];
    btn?.focus();
  };

  return (
    <div className={`relative flex items-center gap-1 ${className}`}>
      {canScrollLeft && (
        <button
          type="button"
          onClick={() => scrollTabs(-1)}
          aria-label="Scroll tabs left"
          className="absolute left-0 top-0 bottom-0 z-20 flex items-center pl-1 pr-3 bg-gradient-to-r from-white via-white to-transparent"
        >
          <ChevronLeft size={16} className="text-gray-400" />
        </button>
      )}

      <div
        ref={scrollRef}
        role="tablist"
        className="flex gap-0.5 overflow-x-auto scrollbar-hide"
      >
        {tabs.map((tab, index) => {
          const Icon = tab.icon;
          const active = tab.id === activeId;
          const showBadge = tab.count !== undefined && tab.count !== null && tab.count !== 0 && tab.count !== '';
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={active}
              tabIndex={active ? 0 : -1}
              onClick={() => onChange(tab.id)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              className={`flex items-center gap-2 px-4 py-3 text-xs font-medium border-b-2 whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1e3a5f]/40 focus-visible:ring-offset-1 ${
                active
                  ? 'border-[#1e3a5f] text-[#1e3a5f]'
                  : 'border-transparent text-gray-400 hover:text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Icon size={14} className={active ? 'text-[#1e3a5f]' : 'text-gray-400'} aria-hidden="true" />
              <span>{tab.label}</span>
              {showBadge && (
                <span
                  className={`inline-flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full text-[9px] font-bold leading-none ${
                    tab.badgeVariant === 'highlight'
                      ? 'bg-purple-100 text-purple-600'
                      : 'bg-red-500 text-white'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {canScrollRight && (
        <button
          type="button"
          onClick={() => scrollTabs(1)}
          aria-label="Scroll tabs right"
          className="absolute right-0 top-0 bottom-0 z-20 flex items-center pr-1 pl-3 bg-gradient-to-l from-white via-white to-transparent"
        >
          <ChevronRight size={16} className="text-gray-400" />
        </button>
      )}

      {rightSlot && <div className="flex-shrink-0 pl-1">{rightSlot}</div>}
    </div>
  );
};

export default TabBar;
