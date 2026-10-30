import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Card, FormField, FSelect, Btn } from "./shared";
import { useOrgProfile, useUpdateProfile } from "../../hooks/useOrganization";
import { formatDate, formatDateShort, type DateFormatPreference } from "../../utils/date";
import { formatHijri } from "../../utils/hijri";

const DATE_FORMAT_VALUES: DateFormatPreference[] = ["DD/MM/YYYY", "MM/DD/YYYY"];

export default function PreferencesTab() {
  const { data: profile, isLoading } = useOrgProfile();
  const updateProfile = useUpdateProfile();
  const [dateFormat, setDateFormat] = useState<DateFormatPreference>("DD/MM/YYYY");
  const [showHijriDates, setShowHijriDates] = useState(false);
  const [hijriDayAdjustment, setHijriDayAdjustment] = useState(0);

  const profileShowHijriDates = !!profile?.showHijriDates;
  const profileHijriDayAdjustment = profile?.hijriDayAdjustment || 0;

  useEffect(() => {
    if (profile?.dateFormat) setDateFormat(profile.dateFormat);
    setShowHijriDates(profileShowHijriDates);
    setHijriDayAdjustment(profileHijriDayAdjustment);
  }, [profile?.dateFormat, profileShowHijriDates, profileHijriDayAdjustment]);

  const dirty = profile && (
    dateFormat !== (profile.dateFormat || "DD/MM/YYYY")
    || showHijriDates !== profileShowHijriDates
    || hijriDayAdjustment !== profileHijriDayAdjustment
  );
  const sample = new Date();

  const save = () => {
    updateProfile.mutate(
      { dateFormat, showHijriDates, hijriDayAdjustment },
      {
        onSuccess: () => toast.success("Preferences saved"),
        onError: (e: any) => toast.error(e?.response?.data?.message || "Failed to save preferences"),
      },
    );
  };

  if (isLoading) return <div className="text-sm text-slate-400 py-10 text-center">Loading…</div>;

  return (
    <div className="max-w-2xl space-y-6">
      <Card className="p-6">
        <h3 className="text-sm font-semibold text-slate-800 mb-1">Date Format</h3>
        <p className="text-xs text-slate-500 mb-4">
          Controls how dates are displayed and printed across the whole app — dashboards, tables,
          reports, and fee challans/invoices — for every user at this school. Day-first
          (DD/MM/YYYY) is the standard in Pakistan and most countries; MM/DD/YYYY is the
          US convention.
        </p>
        <FormField label="Display format">
          <FSelect
            value={dateFormat}
            onChange={(e) => setDateFormat(e.target.value as DateFormatPreference)}
            options={DATE_FORMAT_VALUES}
          />
        </FormField>
        <div className="mt-4 flex items-center gap-6 text-xs text-slate-500">
          <div>
            <div className="text-slate-400 mb-0.5">Short</div>
            <div className="font-medium text-slate-700">{formatDate(sample, dateFormat)}</div>
          </div>
          <div>
            <div className="text-slate-400 mb-0.5">Long</div>
            <div className="font-medium text-slate-700">{formatDateShort(sample, dateFormat)}</div>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-sm font-semibold text-slate-800 mb-1">Islamic (Hijri) Calendar</h3>
        <p className="text-xs text-slate-500 mb-4">
          Shows the equivalent Hijri date alongside the Gregorian one on the School Calendar,
          Circulars and Consent Requests — off by default, for schools that would like an Islamic
          calendar reference (e.g. for Ramadan, Eid, or other Islamic occasions). This is a
          calendar reference, not a moon-sighting ruling.
        </p>
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={showHijriDates}
            onChange={(e) => setShowHijriDates(e.target.checked)}
            className="rounded border-slate-300"
          />
          Show Hijri dates
        </label>
        {showHijriDates && (
          <div className="mt-4">
            <FormField label="Day adjustment (if your local calendar runs a day or two differently)">
              <FSelect
                value={String(hijriDayAdjustment)}
                onChange={(e) => setHijriDayAdjustment(Number(e.target.value))}
                options={["-2", "-1", "0", "1", "2"]}
              />
            </FormField>
            <div className="mt-3 text-xs text-slate-500">
              Today: <span className="font-medium text-slate-700">{formatHijri(sample, hijriDayAdjustment)}</span>
            </div>
          </div>
        )}
      </Card>

      <div className="flex justify-end">
        <Btn onClick={save} className={!dirty ? "opacity-50 pointer-events-none" : ""}>
          {updateProfile.isPending ? "Saving…" : "Save Changes"}
        </Btn>
      </div>
    </div>
  );
}
