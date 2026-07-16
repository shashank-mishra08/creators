import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { name, phone, project, date, time } = await req.json();

    if (!name || !phone || !project || !date || !time) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }

    const GOOGLE_FORM_URL = process.env.GOOGLE_FORM_URL;
    
    // If not configured, we'll just simulate success so the UI works in dev/preview
    if (!GOOGLE_FORM_URL || GOOGLE_FORM_URL.includes("PLACEHOLDER")) {
      console.warn("GOOGLE_FORM_URL is not configured. Simulating success.");
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      return NextResponse.json({ success: true, simulated: true });
    }

    const formData = new URLSearchParams();
    formData.append(process.env.GOOGLE_FORM_ENTRY_NAME || "entry.1", name);
    formData.append(process.env.GOOGLE_FORM_ENTRY_PHONE || "entry.2", phone);
    formData.append(process.env.GOOGLE_FORM_ENTRY_PROJECT || "entry.3", project);
    formData.append(process.env.GOOGLE_FORM_ENTRY_DATE || "entry.4", date);
    formData.append(process.env.GOOGLE_FORM_ENTRY_TIME || "entry.5", time);

    const res = await fetch(GOOGLE_FORM_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData.toString(),
    });

    if (!res.ok) {
      console.error("Google Form returned error", res.status);
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("Site Visit Form Submission Error:", error);
    return NextResponse.json({ error: "Failed to submit form" }, { status: 500 });
  }
}
