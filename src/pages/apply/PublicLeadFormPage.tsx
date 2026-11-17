import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import leadCaptureFormService, { PublicLeadFormSubmission } from '../../services/leadCaptureForm.service';

// Public, unauthenticated admission-inquiry form - reached only via a
// school's own shareable link (see Admissions → Leads → "Get Shareable
// Link"), so it deliberately carries none of the app's Layout/Sidebar
// chrome. Fixed field set mirroring the internal "Add Lead" form rather
// than a customizable form builder (none exists anywhere in this app).
// Grade/campus are free text here (not the authenticated GradeLevelDropdown/
// CampusDropdown, which call endpoints a logged-out visitor can't reach).
export default function PublicLeadFormPage() {
  const { token } = useParams<{ token: string }>();

  const { data, isLoading, error } = useQuery({
    queryKey: ['public-lead-form', token],
    queryFn: () => leadCaptureFormService.getFormInfo(token as string),
    enabled: !!token,
    retry: false,
  });

  const [form, setForm] = useState({
    firstName: '', lastName: '', phone: '', email: '',
    gradeInterested: '', campusPreference: '', notes: '',
    website: '', // honeypot
  });
  const [errorMsg, setErrorMsg] = useState('');
  const set = (k: keyof typeof form, v: string) => setForm(f => ({ ...f, [k]: v }));

  const submitMut = useMutation({
    mutationFn: () => leadCaptureFormService.submit(token as string, form as PublicLeadFormSubmission),
    onError: (e: any) => setErrorMsg(e?.response?.data?.message || 'Something went wrong. Please try again.'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (!form.firstName.trim() || !form.lastName.trim() || !form.phone.trim() || !form.gradeInterested.trim()) {
      setErrorMsg('Please fill in all required fields.');
      return;
    }
    submitMut.mutate();
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center text-slate-400 text-sm">Loading…</div>;
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center text-center px-4 bg-slate-50">
        <div>
          <div className="text-4xl mb-2">🔍</div>
          <div className="font-semibold text-slate-700">This application link is no longer active</div>
          <p className="text-sm text-slate-500 mt-1">Please contact the school directly, or ask them for an updated link.</p>
        </div>
      </div>
    );
  }

  if (submitMut.isSuccess) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 max-w-md w-full p-8 text-center">
          <div className="text-5xl mb-3">✅</div>
          <div className="text-xl font-bold text-slate-900 mb-1">Thank you!</div>
          <p className="text-sm text-slate-600">
            Your inquiry for <strong>{data.schoolName}</strong> has been received. A member of our admissions
            team will be in touch with you soon.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4">
      <div className="max-w-xl mx-auto">
        <div className="text-center mb-6">
          {data.schoolLogo && (
            <img src={data.schoolLogo} alt={data.schoolName} className="h-14 mx-auto mb-3 object-contain" />
          )}
          <h1 className="text-xl font-bold text-slate-900">{data.schoolName}</h1>
          <p className="text-sm text-slate-500 mt-1">Admission Inquiry Form</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-4">
          {/* Honeypot - hidden from real visitors via CSS, bots that fill every field tend to fill this one */}
          <div className="absolute -left-[9999px]" aria-hidden="true">
            <label htmlFor="website">Website</label>
            <input
              id="website" name="website" tabIndex={-1} autoComplete="off"
              value={form.website} onChange={e => set('website', e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">First Name *</label>
              <input required value={form.firstName} onChange={e => set('firstName', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C447C]" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Last Name *</label>
              <input required value={form.lastName} onChange={e => set('lastName', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C447C]" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Phone Number *</label>
              <input required value={form.phone} onChange={e => set('phone', e.target.value)}
                placeholder="+92 300 0000000"
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C447C]" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Email Address</label>
              <input type="email" value={form.email} onChange={e => set('email', e.target.value)}
                placeholder="you@example.com"
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C447C]" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Grade Interested *</label>
              <input required value={form.gradeInterested} onChange={e => set('gradeInterested', e.target.value)}
                placeholder="e.g. Grade 5"
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C447C]" />
            </div>
            {data.hasCampusChoice && (
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Preferred Campus</label>
                <input value={form.campusPreference} onChange={e => set('campusPreference', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C447C]" />
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Message (optional)</label>
            <textarea rows={3} value={form.notes} onChange={e => set('notes', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C447C]" />
          </div>

          {errorMsg && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">{errorMsg}</div>
          )}

          <button type="submit" disabled={submitMut.isPending}
            className="w-full py-2.5 text-sm font-semibold text-white bg-[#0C447C] rounded-lg hover:bg-[#0b3d6e] disabled:opacity-50 transition-colors">
            {submitMut.isPending ? 'Submitting…' : 'Submit Inquiry'}
          </button>
        </form>
      </div>
    </div>
  );
}
