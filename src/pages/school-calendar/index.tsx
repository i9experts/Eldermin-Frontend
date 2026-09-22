import { useState } from 'react';
import { CalendarDays, Megaphone } from 'lucide-react';
import { ModuleHeader } from '../../components/layout/ModuleHeader';
import { TabBar } from '../../components/layout/TabBar';
import CalendarTab from './CalendarTab';
import CircularsTab from './CircularsTab';

type Tab = 'calendar' | 'circulars';
const TABS: { id: Tab; label: string; icon: any }[] = [
  { id: 'calendar', label: 'Academic Calendar', icon: CalendarDays },
  { id: 'circulars', label: 'Circulars & Notices', icon: Megaphone },
];

export default function SchoolCalendarPage() {
  const [active, setActive] = useState<Tab>('calendar');

  return (
    <div className="flex flex-col h-full bg-gray-50">
      <div className="bg-white border-b border-gray-100">
        <ModuleHeader
          icon={CalendarDays}
          title="School Calendar"
          subtitle="Academic calendar, circulars and notices — for admins, staff, parents and students"
        />
        <div className="px-6">
          <TabBar tabs={TABS} activeId={active} onChange={(id) => setActive(id as Tab)} />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-6">
        {active === 'calendar' ? <CalendarTab /> : <CircularsTab />}
      </div>
    </div>
  );
}
