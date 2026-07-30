"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PropertyForm, PropertyFormData } from "@/components/admin/property-form";
import { Loader2 } from "lucide-react";

export default function EditPropertyPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [initialData, setInitialData] = useState<PropertyFormData | null>(null);

  useEffect(() => {
    fetch(`/api/admin/properties/${params.id}`)
      .then((res) => res.json())
      .then((result) => {
        if (!result || result.error) {
          alert(result?.error || "Failed to load property");
          router.push("/admin/properties");
          return;
        }
        
        const data = result.data || {};
        
        // Map backend data to PropertyFormData
        const media = data.media || [];
        const mappedData: PropertyFormData = {
          // Basic Info
          name: data.name,
          builderName: data.builder?.name,
          subtitle: data.subtitle || "",
          city: data.city,
          locality: data.locality,
          kind: data.kind,
          possession: data.possession,
          possessionDate: data.possessionDate || "",
          reraId: data.reraId || "",
          description: data.description || "",
          areaAcres: data.areaAcres,
          towers: data.towers,
          totalUnits: data.totalUnits,

          // Pricing
          startingPriceLakh: data.pricing?.startingPriceLakh,
          maxPriceLakh: data.pricing?.maxPriceLakh,
          pricePerSqFt: data.pricing?.pricePerSqFt,
          bookingAmount: data.pricing?.bookingAmount,
          maintenancePerSqft: data.pricing?.maintenancePerSqft,
          priceRangeLabel: data.pricing?.priceRangeLabel || "",

          // Configurations
          configs: data.configurations?.map((c: any) => ({
            label: c.label,
            areaSqFt: c.areaSqFt ? String(c.areaSqFt) : "",
            carpetAreaSqft: c.carpetAreaSqft ? String(c.carpetAreaSqft) : "",
            balconyAreaSqft: c.balconyAreaSqft ? String(c.balconyAreaSqft) : "",
            builtUpAreaSqft: c.builtUpAreaSqft ? String(c.builtUpAreaSqft) : "",
            priceLabel: c.priceLabel || "",
            floorPlanImage: c.floorPlanImage || "",
          })),

          // Location
          metroMin: data.location?.metroMin,
          schoolMin: data.location?.schoolMin,
          hospitalMin: data.location?.hospitalMin,
          expresswayMin: data.location?.expresswayMin,
          mapsUrl: data.location?.mapsUrl || "",
          latitude: data.location?.latitude ?? null,
          longitude: data.location?.longitude ?? null,

          // Amenities
          amenities: data.amenities?.map((a: any) => ({
            key: a.key,
            label: a.label,
            available: a.available,
            note: a.note || "",
          })),

          // Investment
          appreciationPct: data.investment?.appreciationPct,
          rentalYieldPct: data.investment?.rentalYieldPct,
          demandIndex: data.investment?.demandIndex,
          idealFor: data.investment?.idealFor || "Both",
          investorFriendly: data.investment?.investorFriendly ?? true,

          // Media
          coverImage: media.find((m: any) => m.type === "cover")?.url || "",
          layoutImage: media.find((m: any) => m.type === "layout")?.url || "",
          galleryImages: media.filter((m: any) => m.type === "gallery").map((m: any) => m.url),
          brochureUrl: media.find((m: any) => m.type === "brochure")?.url || "",
          videoUrl: media.find((m: any) => m.type === "video")?.url || "",

          // Highlights
          highlights: data.attributes
            ?.filter((a: any) => a.category === "highlight")
            ?.map((a: any) => a.value) || [],
        };

        // Ensure array fields have at least one empty item if empty
        if (!mappedData.configs?.length) mappedData.configs = [{ label: "", areaSqFt: "", carpetAreaSqft: "", balconyAreaSqft: "", builtUpAreaSqft: "", priceLabel: "", floorPlanImage: "" }];
        if (!mappedData.galleryImages?.length) mappedData.galleryImages = [""];
        if (!mappedData.highlights?.length) mappedData.highlights = ["", "", ""];

        setInitialData(mappedData);
        setLoading(false);
      })
      .catch((err) => {
        alert("Error loading property");
        router.push("/admin/properties");
      });
  }, [params.id, router]);

  async function handleSubmit(payload: any) {
    const res = await fetch(`/api/admin/properties/${params.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to update property");
    
    alert("Property updated successfully!");
    router.push("/admin/properties");
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-[#7166F0]" />
      </div>
    );
  }

  return (
    <PropertyForm
      title="Edit Property"
      subtitle="Update details for the selected property"
      initialData={initialData!}
      onSubmit={handleSubmit}
    />
  );
}
