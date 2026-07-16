"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, Minus, Upload, X, ChevronLeft, ChevronRight, Check, Loader2 } from "lucide-react";

// ─────────── Types ───────────
interface Config { label: string; areaSqFt: string; carpetAreaSqft: string; balconyAreaSqft: string; builtUpAreaSqft: string; priceLabel: string; floorPlanImage: string; }
interface Amenity { key: string; label: string; available: boolean; note: string; }
interface MediaItem { type: string; url: string; alt: string; }

const COMMON_AMENITIES = [
  { key: "swimming_pool", label: "Swimming Pool" },
  { key: "gym", label: "Gymnasium" },
  { key: "clubhouse", label: "Clubhouse" },
  { key: "cctvsecurity", label: "CCTV Security" },
  { key: "sportscourt", label: "Sports Court" },
  { key: "kidsplayarea", label: "Kids Play Area" },
  { key: "powerbackup", label: "Power Backup" },
  { key: "coworking", label: "Co-working Space" },
  { key: "jogging_track", label: "Jogging Track" },
  { key: "yoga_room", label: "Yoga Room" },
  { key: "multipurpose_hall", label: "Multipurpose Hall" },
  { key: "indoor_games", label: "Indoor Games" },
  { key: "garden", label: "Garden / Landscaping" },
  { key: "library", label: "Library / Reading Room" },
  { key: "squash_court", label: "Squash Court" },
  { key: "badminton_court", label: "Badminton Court" },
  { key: "cricket_net", label: "Cricket Net" },
  { key: "amphitheater", label: "Amphitheater" },
  { key: "rooftop", label: "Rooftop Lounge" },
  { key: "spa", label: "Spa & Sauna" },
];

const CITIES = ["Greater Noida East", "Greater Noida West", "Yamuna Expressway"];
const KINDS = ["Apartment", "Villa", "Plot", "Builder Floor"];
const POSSESSIONS = ["Ready to Move", "Under Construction", "New Launch"];

const TABS = [
  "Basic Info", "Pricing", "Configurations", "Location",
  "Amenities", "Investment", "Media", "Highlights",
];

// ─────────── Image Upload Field ───────────
function ImageField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const [uploading, setUploading] = useState(false);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    try {
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (res.ok) onChange(data.data?.path ?? "");
      else alert(data.error ?? "Upload failed");
    } catch { alert("Upload failed. Check your connection."); }
    finally { setUploading(false); }
  }

  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1.5">{label}</label>
      <div className="flex gap-2">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="/properties/image.jpg or https://..."
          className={INPUT}
        />
        <label className="shrink-0 flex items-center gap-1.5 px-3 py-2.5 border border-[#7166F0] text-[#7166F0] rounded-xl text-sm font-medium cursor-pointer hover:bg-[#7166F0]/5 transition-colors">
          {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
          {uploading ? "Uploading..." : "Upload"}
          <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} disabled={uploading} />
        </label>
      </div>
      {value && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={value} alt="Preview" className="mt-2 h-16 rounded-lg object-cover border border-slate-100" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
      )}
    </div>
  );
}

const INPUT = "w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#7166F0]/20 focus:border-[#7166F0] transition-all bg-white";
const LABEL = "block text-sm font-medium text-slate-700 mb-1.5";

// ─────────── Main Component ───────────
export default function AddPropertyPage() {
  const router = useRouter();
  const [tab, setTab] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [builders, setBuilders] = useState<Array<{ id: string; name: string }>>([]);

  // Basic Info
  const [name, setName] = useState("");
  const [builderName, setBuilderName] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [city, setCity] = useState(CITIES[0]);
  const [locality, setLocality] = useState("");
  const [kind, setKind] = useState(KINDS[0]);
  const [possession, setPossession] = useState(POSSESSIONS[0]);
  const [possessionDate, setPossessionDate] = useState("");
  const [reraId, setReraId] = useState("");
  const [description, setDescription] = useState("");
  const [areaAcres, setAreaAcres] = useState("");
  const [towers, setTowers] = useState("");
  const [totalUnits, setTotalUnits] = useState("");

  // Pricing
  const [startingPrice, setStartingPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [pricePerSqFt, setPricePerSqFt] = useState("");
  const [bookingAmount, setBookingAmount] = useState("");
  const [maintenance, setMaintenance] = useState("");
  const [priceRangeLabel, setPriceRangeLabel] = useState("");

  // Configurations
  const [configs, setConfigs] = useState<Config[]>([{ label: "", areaSqFt: "", carpetAreaSqft: "", balconyAreaSqft: "", builtUpAreaSqft: "", priceLabel: "", floorPlanImage: "" }]);

  // Location
  const [metroMin, setMetroMin] = useState("");
  const [schoolMin, setSchoolMin] = useState("");
  const [hospitalMin, setHospitalMin] = useState("");
  const [expresswayMin, setExpresswayMin] = useState("");
  const [mapsUrl, setMapsUrl] = useState("");

  // Amenities
  const [amenities, setAmenities] = useState<Amenity[]>(
    COMMON_AMENITIES.map((a) => ({ ...a, available: false, note: "" }))
  );
  const [customAmenity, setCustomAmenity] = useState("");

  // Investment
  const [appreciationPct, setAppreciationPct] = useState("");
  const [rentalYieldPct, setRentalYieldPct] = useState("");
  const [demandIndex, setDemandIndex] = useState("");
  const [idealFor, setIdealFor] = useState("Both");
  const [investorFriendly, setInvestorFriendly] = useState(true);

  // Media
  const [coverImage, setCoverImage] = useState("");
  const [layoutImage, setLayoutImage] = useState("");
  const [galleryImages, setGalleryImages] = useState<string[]>([""]);
  const [brochureUrl, setBrochureUrl] = useState("");
  const [videoUrl, setVideoUrl] = useState("");

  // Highlights
  const [highlights, setHighlights] = useState<string[]>(["", "", ""]);

  useEffect(() => {
    fetch("/api/admin/builders")
      .then((r) => r.json())
      .then((d) => setBuilders(d.data ?? []));
  }, []);

  // Auto-generate price label
  useEffect(() => {
    if (startingPrice && maxPrice) {
      const fmt = (n: number) => n >= 100 ? `₹${(n / 100).toFixed(2)} Cr` : `₹${n} L`;
      setPriceRangeLabel(`${fmt(Number(startingPrice))} - ${fmt(Number(maxPrice))}`);
    } else if (startingPrice) {
      const n = Number(startingPrice);
      setPriceRangeLabel(n >= 100 ? `Starting ₹${(n / 100).toFixed(2)} Cr` : `Starting ₹${n} L`);
    }
  }, [startingPrice, maxPrice]);

  // Auto-generate configsLabel from config labels
  const configsLabel = [...new Set(configs.map((c) => c.label).filter(Boolean))].join(" / ");

  function addConfig() { setConfigs([...configs, { label: "", areaSqFt: "", carpetAreaSqft: "", balconyAreaSqft: "", builtUpAreaSqft: "", priceLabel: "", floorPlanImage: "" }]); }
  function removeConfig(i: number) { setConfigs(configs.filter((_, idx) => idx !== i)); }
  function updateConfig(i: number, field: keyof Config, value: string) { setConfigs(configs.map((c, idx) => idx === i ? { ...c, [field]: value } : c)); }

  function addCustomAmenity() {
    if (!customAmenity.trim()) return;
    const key = customAmenity.toLowerCase().replace(/\s+/g, "_");
    setAmenities([...amenities, { key, label: customAmenity, available: true, note: "" }]);
    setCustomAmenity("");
  }
  function toggleAmenity(i: number) { setAmenities(amenities.map((a, idx) => idx === i ? { ...a, available: !a.available } : a)); }

  async function handleSubmit() {
    if (!name || !locality || !builderName) {
      setTab(0);
      alert("Please fill in: Name, Builder, and Locality");
      return;
    }
    setSubmitting(true);
    try {
      const body = {
        name, subtitle, builderName, city, locality, kind, possession,
        possessionDate, reraId, description,
        areaAcres: areaAcres ? Number(areaAcres) : undefined,
        towers: towers ? Number(towers) : undefined,
        totalUnits: totalUnits ? Number(totalUnits) : undefined,
        configsLabel,
        pricing: {
          startingPriceLakh: startingPrice ? Number(startingPrice) : undefined,
          maxPriceLakh: maxPrice ? Number(maxPrice) : undefined,
          pricePerSqFt: pricePerSqFt ? Number(pricePerSqFt) : undefined,
          bookingAmount: bookingAmount ? Number(bookingAmount) : undefined,
          maintenancePerSqft: maintenance ? Number(maintenance) : undefined,
          priceRangeLabel,
        },
        location: {
          metroMin: metroMin ? Number(metroMin) : undefined,
          schoolMin: schoolMin ? Number(schoolMin) : undefined,
          hospitalMin: hospitalMin ? Number(hospitalMin) : undefined,
          expresswayMin: expresswayMin ? Number(expresswayMin) : undefined,
          mapsUrl: mapsUrl || undefined,
        },
        investment: {
          appreciationPct: appreciationPct ? Number(appreciationPct) : undefined,
          rentalYieldPct: rentalYieldPct ? Number(rentalYieldPct) : undefined,
          demandIndex: demandIndex ? Number(demandIndex) : undefined,
          idealFor, investorFriendly,
        },
        configurations: configs.filter((c) => c.label).map((c, i) => ({
          label: c.label, sortOrder: i,
          areaSqFt: c.areaSqFt ? Number(c.areaSqFt) : 0,
          carpetAreaSqft: c.carpetAreaSqft ? Number(c.carpetAreaSqft) : null,
          balconyAreaSqft: c.balconyAreaSqft ? Number(c.balconyAreaSqft) : null,
          builtUpAreaSqft: c.builtUpAreaSqft ? Number(c.builtUpAreaSqft) : null,
          priceLabel: c.priceLabel, floorPlanImage: c.floorPlanImage,
        })),
        amenities: amenities.map((a) => ({ key: a.key, label: a.label, available: a.available, note: a.note || undefined })),
        media: [
          ...(coverImage ? [{ type: "cover", url: coverImage, sortOrder: 0 }] : []),
          ...(layoutImage ? [{ type: "layout", url: layoutImage, sortOrder: 100 }] : []),
          ...galleryImages.filter(Boolean).map((url, i) => ({ type: "gallery", url, sortOrder: i + 1 })),
          ...(brochureUrl ? [{ type: "brochure", url: brochureUrl, sortOrder: 200 }] : []),
          ...(videoUrl ? [{ type: "video", url: videoUrl, sortOrder: 201 }] : []),
        ],
        highlights: highlights.filter(Boolean),
      };

      const res = await fetch("/api/admin/properties/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to create property");
      router.push("/admin/properties");
    } catch (e) {
      alert(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => router.back()} className="w-9 h-9 flex items-center justify-center border border-slate-200 rounded-xl text-slate-500 hover:bg-slate-50 transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Add New Property</h1>
          <p className="text-sm text-slate-500">Fill in all details to add a property to the platform</p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex overflow-x-auto gap-1 mb-6 bg-slate-100 p-1 rounded-2xl">
        {TABS.map((t, i) => (
          <button
            key={t}
            onClick={() => setTab(i)}
            className={`shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-all ${tab === i ? "bg-white text-[#7166F0] shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 min-h-[400px]">

        {/* TAB 0: Basic Info */}
        {tab === 0 && (
          <div className="space-y-5">
            <h2 className="text-base font-semibold text-slate-900 mb-4">Basic Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={LABEL}>Property Name <span className="text-red-500">*</span></label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Godrej Riverine" className={INPUT} />
              </div>
              <div>
                <label className={LABEL}>Builder / Developer <span className="text-red-500">*</span></label>
                <input type="text" value={builderName} onChange={(e) => setBuilderName(e.target.value)} placeholder="Type or select builder name" className={INPUT} list="builders-list" />
                <datalist id="builders-list">
                  {builders.map((b) => <option key={b.id} value={b.name} />)}
                </datalist>
              </div>
              <div className="md:col-span-2">
                <label className={LABEL}>Subtitle / Category Tag</label>
                <input type="text" value={subtitle} onChange={(e) => setSubtitle(e.target.value)} placeholder="e.g. Premium Luxury Apartments" className={INPUT} />
              </div>
              <div>
                <label className={LABEL}>City <span className="text-red-500">*</span></label>
                <select value={city} onChange={(e) => setCity(e.target.value)} className={INPUT}>
                  {CITIES.map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className={LABEL}>Locality / Sector <span className="text-red-500">*</span></label>
                <input type="text" value={locality} onChange={(e) => setLocality(e.target.value)} placeholder="e.g. Sector 150, Noida" className={INPUT} />
              </div>
              <div>
                <label className={LABEL}>Property Type</label>
                <select value={kind} onChange={(e) => setKind(e.target.value)} className={INPUT}>
                  {KINDS.map((k) => <option key={k}>{k}</option>)}
                </select>
              </div>
              <div>
                <label className={LABEL}>Possession Status</label>
                <select value={possession} onChange={(e) => setPossession(e.target.value)} className={INPUT}>
                  {POSSESSIONS.map((p) => <option key={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className={LABEL}>Possession Date</label>
                <input type="text" value={possessionDate} onChange={(e) => setPossessionDate(e.target.value)} placeholder="e.g. Dec 2026" className={INPUT} />
              </div>
              <div>
                <label className={LABEL}>RERA Registration No.</label>
                <input type="text" value={reraId} onChange={(e) => setReraId(e.target.value)} placeholder="e.g. UPRERA12345" className={INPUT} />
              </div>
              <div>
                <label className={LABEL}>Area (Acres)</label>
                <input type="number" value={areaAcres} onChange={(e) => setAreaAcres(e.target.value)} placeholder="e.g. 12.5" className={INPUT} min="0" step="0.1" />
              </div>
              <div>
                <label className={LABEL}>No. of Towers</label>
                <input type="number" value={towers} onChange={(e) => setTowers(e.target.value)} placeholder="e.g. 8" className={INPUT} min="0" />
              </div>
              <div>
                <label className={LABEL}>Total Units</label>
                <input type="number" value={totalUnits} onChange={(e) => setTotalUnits(e.target.value)} placeholder="e.g. 2000" className={INPUT} min="0" />
              </div>
              <div className="md:col-span-2">
                <label className={LABEL}>Description</label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Project overview, USPs, key highlights..." className={`${INPUT} resize-none`} rows={4} />
              </div>
            </div>
          </div>
        )}

        {/* TAB 1: Pricing */}
        {tab === 1 && (
          <div className="space-y-5">
            <h2 className="text-base font-semibold text-slate-900 mb-4">Pricing Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={LABEL}>Starting Price (₹ Lakh)</label>
                <input type="number" value={startingPrice} onChange={(e) => setStartingPrice(e.target.value)} placeholder="e.g. 250" className={INPUT} min="0" />
              </div>
              <div>
                <label className={LABEL}>Max Price (₹ Lakh)</label>
                <input type="number" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} placeholder="e.g. 600" className={INPUT} min="0" />
              </div>
              <div>
                <label className={LABEL}>Price per SqFt (₹)</label>
                <input type="number" value={pricePerSqFt} onChange={(e) => setPricePerSqFt(e.target.value)} placeholder="e.g. 9500" className={INPUT} min="0" />
              </div>
              <div>
                <label className={LABEL}>Booking Amount (₹ Lakh)</label>
                <input type="number" value={bookingAmount} onChange={(e) => setBookingAmount(e.target.value)} placeholder="e.g. 10" className={INPUT} min="0" />
              </div>
              <div>
                <label className={LABEL}>Maintenance (₹/SqFt/Month)</label>
                <input type="number" value={maintenance} onChange={(e) => setMaintenance(e.target.value)} placeholder="e.g. 2.5" className={INPUT} min="0" step="0.1" />
              </div>
              <div>
                <label className={LABEL}>Price Range Label (auto-generated)</label>
                <input type="text" value={priceRangeLabel} onChange={(e) => setPriceRangeLabel(e.target.value)} placeholder="e.g. ₹2.50 Cr - ₹6.00 Cr" className={INPUT} />
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Configurations */}
        {tab === 2 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-slate-900">Floor Plan Configurations</h2>
              <button onClick={addConfig} className="inline-flex items-center gap-1.5 text-sm font-medium text-[#7166F0] hover:underline">
                <Plus className="w-4 h-4" /> Add Config
              </button>
            </div>
            <div className="space-y-4">
              {configs.map((c, i) => (
                <div key={i} className="border border-slate-200 rounded-2xl p-4 relative">
                  <button onClick={() => removeConfig(i)} className="absolute top-3 right-3 text-slate-400 hover:text-red-500 transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Configuration {i + 1}</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    <div>
                      <label className={LABEL}>BHK / Label</label>
                      <input type="text" value={c.label} onChange={(e) => updateConfig(i, "label", e.target.value)} placeholder="e.g. 3BHK+S" className={INPUT} />
                    </div>
                    <div>
                      <label className={LABEL}>Saleable Area (SqFt)</label>
                      <input type="number" value={c.areaSqFt} onChange={(e) => updateConfig(i, "areaSqFt", e.target.value)} placeholder="e.g. 1850" className={INPUT} />
                    </div>
                    <div>
                      <label className={LABEL}>Carpet Area (SqFt)</label>
                      <input type="number" value={c.carpetAreaSqft} onChange={(e) => updateConfig(i, "carpetAreaSqft", e.target.value)} placeholder="e.g. 1250" className={INPUT} />
                    </div>
                    <div>
                      <label className={LABEL}>Balcony Area (SqFt)</label>
                      <input type="number" value={c.balconyAreaSqft} onChange={(e) => updateConfig(i, "balconyAreaSqft", e.target.value)} placeholder="e.g. 120" className={INPUT} />
                    </div>
                    <div>
                      <label className={LABEL}>Built-up Area (SqFt)</label>
                      <input type="number" value={c.builtUpAreaSqft} onChange={(e) => updateConfig(i, "builtUpAreaSqft", e.target.value)} placeholder="e.g. 1600" className={INPUT} />
                    </div>
                    <div>
                      <label className={LABEL}>Price Label</label>
                      <input type="text" value={c.priceLabel} onChange={(e) => updateConfig(i, "priceLabel", e.target.value)} placeholder="e.g. ₹3.2 Cr onwards" className={INPUT} />
                    </div>
                    <div className="sm:col-span-2 lg:col-span-3">
                      <ImageField label="Floor Plan Image" value={c.floorPlanImage} onChange={(v) => updateConfig(i, "floorPlanImage", v)} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: Location */}
        {tab === 3 && (
          <div className="space-y-5">
            <h2 className="text-base font-semibold text-slate-900 mb-4">Location & Connectivity</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={LABEL}>Metro Distance (Minutes)</label>
                <input type="number" value={metroMin} onChange={(e) => setMetroMin(e.target.value)} placeholder="e.g. 10" className={INPUT} min="0" />
              </div>
              <div>
                <label className={LABEL}>School Distance (Minutes)</label>
                <input type="number" value={schoolMin} onChange={(e) => setSchoolMin(e.target.value)} placeholder="e.g. 5" className={INPUT} min="0" />
              </div>
              <div>
                <label className={LABEL}>Hospital Distance (Minutes)</label>
                <input type="number" value={hospitalMin} onChange={(e) => setHospitalMin(e.target.value)} placeholder="e.g. 8" className={INPUT} min="0" />
              </div>
              <div>
                <label className={LABEL}>Expressway Distance (Minutes)</label>
                <input type="number" value={expresswayMin} onChange={(e) => setExpresswayMin(e.target.value)} placeholder="e.g. 3" className={INPUT} min="0" />
              </div>
              <div className="md:col-span-2">
                <label className={LABEL}>Google Maps URL</label>
                <input type="url" value={mapsUrl} onChange={(e) => setMapsUrl(e.target.value)} placeholder="https://maps.google.com/..." className={INPUT} />
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: Amenities */}
        {tab === 4 && (
          <div>
            <h2 className="text-base font-semibold text-slate-900 mb-4">Amenities</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
              {amenities.map((a, i) => (
                <label key={a.key} className={`flex items-center gap-3 p-3 border rounded-xl cursor-pointer transition-all ${a.available ? "border-[#7166F0] bg-[#7166F0]/5" : "border-slate-200 hover:bg-slate-50"}`}>
                  <div
                    className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all shrink-0 ${a.available ? "bg-[#7166F0] border-[#7166F0]" : "border-slate-300"}`}
                    onClick={() => toggleAmenity(i)}
                  >
                    {a.available && <Check className="w-3 h-3 text-white" />}
                  </div>
                  <span className="text-sm text-slate-700">{a.label}</span>
                </label>
              ))}
            </div>
            <div className="flex gap-2 pt-4 border-t border-slate-100">
              <input
                type="text"
                value={customAmenity}
                onChange={(e) => setCustomAmenity(e.target.value)}
                placeholder="Add custom amenity (e.g. Tennis Court)"
                className={`${INPUT} flex-1`}
                onKeyDown={(e) => e.key === "Enter" && addCustomAmenity()}
              />
              <button onClick={addCustomAmenity} className="px-4 py-2.5 bg-[#7166F0] text-white rounded-xl text-sm font-medium hover:bg-[#5a52d5] transition-colors">
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* TAB 5: Investment */}
        {tab === 5 && (
          <div className="space-y-5">
            <h2 className="text-base font-semibold text-slate-900 mb-4">Investment Metrics</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={LABEL}>Appreciation (% per year)</label>
                <input type="number" value={appreciationPct} onChange={(e) => setAppreciationPct(e.target.value)} placeholder="e.g. 12" className={INPUT} min="0" step="0.1" />
              </div>
              <div>
                <label className={LABEL}>Rental Yield (%)</label>
                <input type="number" value={rentalYieldPct} onChange={(e) => setRentalYieldPct(e.target.value)} placeholder="e.g. 3.5" className={INPUT} min="0" step="0.1" />
              </div>
              <div>
                <label className={LABEL}>Demand Index (0–100)</label>
                <input type="number" value={demandIndex} onChange={(e) => setDemandIndex(e.target.value)} placeholder="e.g. 75" className={INPUT} min="0" max="100" />
              </div>
              <div>
                <label className={LABEL}>Ideal For</label>
                <select value={idealFor} onChange={(e) => setIdealFor(e.target.value)} className={INPUT}>
                  <option>Investment</option>
                  <option>Self Use</option>
                  <option>Both</option>
                </select>
              </div>
              <div>
                <label className={LABEL}>Investor Friendly</label>
                <div className="flex gap-3 pt-1">
                  {[true, false].map((v) => (
                    <button key={String(v)} type="button" onClick={() => setInvestorFriendly(v)} className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-all ${investorFriendly === v ? "bg-[#7166F0] text-white border-[#7166F0]" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}>
                      {v ? "Yes" : "No"}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: Media */}
        {tab === 6 && (
          <div className="space-y-5">
            <h2 className="text-base font-semibold text-slate-900 mb-4">Media & Images</h2>
            <ImageField label="Cover / Hero Image" value={coverImage} onChange={setCoverImage} />
            <ImageField label="Master Plan / Layout Image" value={layoutImage} onChange={setLayoutImage} />

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className={LABEL.replace(" mb-1.5", "")}>Gallery Images</label>
                <button onClick={() => setGalleryImages([...galleryImages, ""])} className="text-xs text-[#7166F0] font-medium hover:underline flex items-center gap-1">
                  <Plus className="w-3.5 h-3.5" /> Add Image
                </button>
              </div>
              <div className="space-y-2">
                {galleryImages.map((url, i) => (
                  <div key={i} className="flex gap-2">
                    <input type="text" value={url} onChange={(e) => setGalleryImages(galleryImages.map((g, gi) => gi === i ? e.target.value : g))} placeholder="/properties/image.jpg" className={INPUT} />
                    <label className="shrink-0 flex items-center gap-1 px-3 border border-[#7166F0] text-[#7166F0] rounded-xl text-sm cursor-pointer hover:bg-[#7166F0]/5 transition-colors">
                      <Upload className="w-4 h-4" />
                      <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                        const file = e.target.files?.[0]; if (!file) return;
                        const fd = new FormData(); fd.append("file", file);
                        const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
                        const d = await res.json();
                        if (res.ok) setGalleryImages(galleryImages.map((g, gi) => gi === i ? d.data?.path ?? "" : g));
                      }} />
                    </label>
                    {galleryImages.length > 1 && (
                      <button onClick={() => setGalleryImages(galleryImages.filter((_, gi) => gi !== i))} className="p-2.5 text-slate-400 hover:text-red-500 transition-colors">
                        <Minus className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
            <div>
              <label className={LABEL}>Brochure URL / Path</label>
              <input type="text" value={brochureUrl} onChange={(e) => setBrochureUrl(e.target.value)} placeholder="/properties/brochure.pdf or https://..." className={INPUT} />
            </div>
            <div>
              <label className={LABEL}>Video URL</label>
              <input type="url" value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="https://youtube.com/..." className={INPUT} />
            </div>
          </div>
        )}

        {/* TAB 7: Highlights */}
        {tab === 7 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-slate-900">Property Highlights</h2>
              <button onClick={() => setHighlights([...highlights, ""])} className="text-sm text-[#7166F0] font-medium hover:underline flex items-center gap-1">
                <Plus className="w-4 h-4" /> Add Highlight
              </button>
            </div>
            <div className="space-y-3">
              {highlights.map((h, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    type="text"
                    value={h}
                    onChange={(e) => setHighlights(highlights.map((x, hi) => hi === i ? e.target.value : x))}
                    placeholder={`Highlight ${i + 1} — e.g. Olympic-size swimming pool`}
                    className={INPUT}
                  />
                  <button onClick={() => setHighlights(highlights.filter((_, hi) => hi !== i))} className="p-2.5 text-slate-400 hover:text-red-500 transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Navigation Footer */}
      <div className="flex items-center justify-between mt-6">
        <button
          onClick={() => setTab(Math.max(0, tab - 1))}
          disabled={tab === 0}
          className="flex items-center gap-2 px-5 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-sm font-medium hover:bg-slate-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="w-4 h-4" /> Previous
        </button>

        <span className="text-sm text-slate-400">{tab + 1} / {TABS.length}</span>

        {tab < TABS.length - 1 ? (
          <button
            onClick={() => setTab(tab + 1)}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#7166F0] text-white rounded-xl text-sm font-semibold hover:bg-[#5a52d5] transition-colors"
          >
            Next <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex items-center gap-2 px-6 py-2.5 bg-green-600 text-white rounded-xl text-sm font-semibold hover:bg-green-700 transition-colors disabled:opacity-60"
          >
            {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating...</> : <><Check className="w-4 h-4" /> Create Property</>}
          </button>
        )}
      </div>
    </div>
  );
}
