import { useState } from "react";
import DashboardTab from "./DashboardTab";
import ChildrenTab from "./ChildrenTab";
import SettingsTab from "./SettingsTab";
import ChildProfileView from "./ChildProfileView";
import ExperienceLibraryTab from "./ExperienceLibraryTab";

type Tab = "dashboard" | "children" | "experiences" | "settings";

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: "dashboard", label: "Today", icon: "🌤️" },
  { id: "children", label: "My Children", icon: "🧒" },
  { id: "experiences", label: "Experience Library", icon: "🧩" },
  { id: "settings", label: "Settings", icon: "⚙️" },
];

export default function EarlyYearsPage() {
  const [tab, setTab] = useState<Tab>("dashboard");
  const [profileChild, setProfileChild] = useState<any>(null);

  return (
    <div className="p-6">
      <div className="mb-5">
        <h1 className="text-xl font-bold text-slate-900">Eldermin Early Years</h1>
        <p className="text-sm text-slate-500 mt-0.5">Whole Child Development & Learning System</p>
      </div>

      <div className="flex gap-1 mb-5 border-b border-slate-200">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
              tab === t.id ? "text-[#0C447C] border-[#0C447C]" : "text-slate-500 border-transparent hover:text-slate-700"
            }`}
          >
            <span>{t.icon}</span> {t.label}
          </button>
        ))}
      </div>

      {tab === "dashboard" && <DashboardTab />}
      {tab === "children" && <ChildrenTab onOpenProfile={setProfileChild} />}
      {tab === "experiences" && <ExperienceLibraryTab />}
      {tab === "settings" && <SettingsTab />}

      {profileChild && <ChildProfileView child={profileChild} onClose={() => setProfileChild(null)} />}
    </div>
  );
}
