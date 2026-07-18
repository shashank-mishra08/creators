"use client";

import { useState } from "react";
import {
  Phone, Share2, Bell, Search, Wrench, Save, Loader2, CheckCircle2, AlertTriangle,
} from "lucide-react";

type SettingsShape = {
  id: string;
  contactPhone: string;
  contactEmail: string;
  whatsappNumber: string;
  officeAddress: string;
  mapUrl: string;
  businessHours: string;
  instagramUrl: string;
  facebookUrl: string;
  linkedinUrl: string;
  youtubeUrl: string;
  leadNotifyEmails: string;
  metaTitle: string;
  metaDescription: string;
  ogImageUrl: string;
  ga4Id: string;
  metaPixelId: string;
  maintenanceMode: boolean;
};

const TABS = [
  { id: "contact", label: "Contact", icon: Phone },
  { id: "social", label: "Social", icon: Share2 },
  { id: "leads", label: "Leads", icon: Bell },
  { id: "seo", label: "SEO & Tracking", icon: Search },
  { id: "advanced", label: "Advanced", icon: Wrench },
] as const;

type TabId = (typeof TABS)[number]["id"];

function Field({
  label, value, onChange, disabled, placeholder, hint, textarea, type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  disabled: boolean;
  placeholder?: string;
  hint?: string;
  textarea?: boolean;
  type?: string;
}) {
  const cls =
    "w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#7166F0]/30 focus:border-[#7166F0] disabled:bg-slate-50 disabled:text-slate-500";
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1.5">{label}</label>
      {textarea ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          placeholder={placeholder}
          rows={3}
          className={cls}
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          placeholder={placeholder}
          className={cls}
        />
      )}
      {hint && <p className="text-xs text-slate-400 mt-1">{hint}</p>}
    </div>
  );
}

export function SettingsForm({
  initial,
  canEdit,
}: {
  initial: SettingsShape;
  canEdit: boolean;
}) {
  const [form, setForm] = useState<SettingsShape>(initial);
  const [tab, setTab] = useState<TabId>("contact");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = <K extends keyof SettingsShape>(key: K, value: SettingsShape[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    setSaved(false);
  };

  async function handleSave() {
    setError(null);
    setSaving(true);
    setSaved(false);
    try {
      const { id, ...payload } = form;
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not save settings.");
        return;
      }
      setForm((f) => ({ ...f, ...data.data.settings }));
      setSaved(true);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  const d = !canEdit;

  return (
    <div>
      {/* Tabs */}
      <div className="flex flex-wrap gap-1 mb-6 border-b border-slate-200">
        {TABS.map((t) => {
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
                active
                  ? "border-[#7166F0] text-[#7166F0]"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <t.icon className="w-4 h-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-5">
        {tab === "contact" && (
          <>
            <Field label="Contact phone" value={form.contactPhone} onChange={(v) => set("contactPhone", v)} disabled={d} placeholder="+91 98xxxxxxxx" />
            <Field label="Contact email" value={form.contactEmail} onChange={(v) => set("contactEmail", v)} disabled={d} placeholder="hello@creators.in" type="email" />
            <Field label="WhatsApp number" value={form.whatsappNumber} onChange={(v) => set("whatsappNumber", v)} disabled={d} placeholder="919xxxxxxxxx" hint="Digits with country code, e.g. 9198xxxxxxxx (used for click-to-chat)." />
            <Field label="Office address" value={form.officeAddress} onChange={(v) => set("officeAddress", v)} disabled={d} textarea />
            <Field label="Google Maps URL" value={form.mapUrl} onChange={(v) => set("mapUrl", v)} disabled={d} placeholder="https://maps.google.com/…" />
            <Field label="Business hours" value={form.businessHours} onChange={(v) => set("businessHours", v)} disabled={d} placeholder="Mon–Sat, 10am–7pm" />
          </>
        )}

        {tab === "social" && (
          <>
            <Field label="Instagram URL" value={form.instagramUrl} onChange={(v) => set("instagramUrl", v)} disabled={d} placeholder="https://instagram.com/…" />
            <Field label="Facebook URL" value={form.facebookUrl} onChange={(v) => set("facebookUrl", v)} disabled={d} placeholder="https://facebook.com/…" />
            <Field label="LinkedIn URL" value={form.linkedinUrl} onChange={(v) => set("linkedinUrl", v)} disabled={d} placeholder="https://linkedin.com/company/…" />
            <Field label="YouTube URL" value={form.youtubeUrl} onChange={(v) => set("youtubeUrl", v)} disabled={d} placeholder="https://youtube.com/@…" />
          </>
        )}

        {tab === "leads" && (
          <>
            <Field
              label="Lead notification emails"
              value={form.leadNotifyEmails}
              onChange={(v) => set("leadNotifyEmails", v)}
              disabled={d}
              textarea
              placeholder="sales@creators.in, manager@creators.in"
              hint="Comma-separated. These addresses are emailed whenever a new site-visit request is submitted. Leave blank to disable."
            />
          </>
        )}

        {tab === "seo" && (
          <>
            <Field label="Default meta title" value={form.metaTitle} onChange={(v) => set("metaTitle", v)} disabled={d} />
            <Field label="Default meta description" value={form.metaDescription} onChange={(v) => set("metaDescription", v)} disabled={d} textarea />
            <Field label="Default OG / share image URL" value={form.ogImageUrl} onChange={(v) => set("ogImageUrl", v)} disabled={d} placeholder="https://…/share.png" />
            <Field label="Google Analytics ID (GA4)" value={form.ga4Id} onChange={(v) => set("ga4Id", v)} disabled={d} placeholder="G-XXXXXXXXXX" />
            <Field label="Meta (Facebook) Pixel ID" value={form.metaPixelId} onChange={(v) => set("metaPixelId", v)} disabled={d} placeholder="1234567890" />
          </>
        )}

        {tab === "advanced" && (
          <div>
            <div className="flex items-start justify-between gap-4 p-4 rounded-xl border border-slate-200">
              <div>
                <p className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500" /> Maintenance mode
                </p>
                <p className="text-xs text-slate-500 mt-1 max-w-md">
                  When on, public visitors see a &ldquo;We&apos;ll be back soon&rdquo; screen.
                  The admin panel stays fully accessible so you can turn it back off.
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={form.maintenanceMode}
                disabled={d}
                onClick={() => set("maintenanceMode", !form.maintenanceMode)}
                className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors disabled:opacity-50 ${
                  form.maintenanceMode ? "bg-amber-500" : "bg-slate-300"
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                    form.maintenanceMode ? "translate-x-5" : "translate-x-0.5"
                  }`}
                />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Save bar */}
      {canEdit && (
        <div className="flex items-center gap-4 mt-6">
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 bg-[#7166F0] text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#5a52d5] transition-colors disabled:opacity-60"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? "Saving…" : "Save changes"}
          </button>
          {saved && (
            <span className="inline-flex items-center gap-1.5 text-sm text-green-600">
              <CheckCircle2 className="w-4 h-4" /> Saved
            </span>
          )}
          {error && <span className="text-sm text-red-600">{error}</span>}
        </div>
      )}
    </div>
  );
}
