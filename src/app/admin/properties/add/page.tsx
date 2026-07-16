"use client";

import { useRouter } from "next/navigation";
import { PropertyForm } from "@/components/admin/property-form";

export default function AddPropertyPage() {
  const router = useRouter();

  async function handleSubmit(payload: any) {
    const res = await fetch("/api/admin/properties/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to create property");
    
    alert("Property created successfully!");
    router.push("/admin/properties");
  }

  return (
    <PropertyForm
      title="Add New Property"
      subtitle="Fill in the details to list a new property"
      onSubmit={handleSubmit}
    />
  );
}
