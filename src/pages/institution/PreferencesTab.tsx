import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Card, FormField, FSelect, Btn } from "./shared";
import { useOrgProfile, useUpdateProfile } from "../../hooks/useOrganization";
import { formatDate, formatDateShort, type DateFormatPreference } from "../../utils/date";

const DATE_FORMAT_VALUES: DateFormatPreference[] = ["DD/MM/YYYY", "MM/DD/YYYY"];

export default function PreferencesTab() {
  const { data: profile, isLoading } = useOrgProfile();
  const updateProfile = useUpdateProfile();
  const [dateFormat, setDateFormat] = useState<DateFormatPreference>("DD/MM/YYYY");

  useEffect(() => {
    if (profile?.dateFormat) setDateFormat(profile.dateFormat);
  }, [profile?.dateFormat]);

  const dirty = profile && dateFormat !== (profile.dateFormat || "DD/MM/YYYY");
  const sample = new Date();

  const save = () => {
    updateProfile.mutate(
      { dateFormat },
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
        <div className="mt-5 flex justify-end">
          <Btn onClick={save} className={!dirty ? "opacity-50 pointer-events-none" : ""}>
            {updateProfile.isPending ? "Saving…" : "Save Changes"}
          </Btn>
        </div>
      </Card>
    </div>
  );
}
