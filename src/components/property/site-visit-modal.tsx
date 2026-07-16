"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, CalendarCheck, Loader2, CheckCircle2, User, Phone, Calendar as CalendarIcon, Clock, Building } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SiteVisitModalProps {
  isOpen: boolean;
  onClose: () => void;
  propertyName: string;
}

export function SiteVisitModal({ isOpen, onClose, propertyName }: SiteVisitModalProps) {
  const [name, setName] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [date, setDate] = React.useState("");
  const [time, setTime] = React.useState("");
  const [status, setStatus] = React.useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = React.useState("");

  // Lock body scroll when modal is open
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
      // Reset form on close after animation
      setTimeout(() => {
        setStatus("idle");
        setName("");
        setPhone("");
        setDate("");
        setTime("");
        setErrorMessage("");
      }, 300);
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  // Handle ESC key
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (status === "submitting" || status === "success") return;

    // Validate phone number
    let localPhone = phone.replace(/\D/g, "");
    if (localPhone.length === 12 && localPhone.startsWith("91")) localPhone = localPhone.slice(2);
    else if (localPhone.length === 11 && localPhone.startsWith("0")) localPhone = localPhone.slice(1);

    if (!/^[6-9]\d{9}$/.test(localPhone)) {
      setErrorMessage("Please enter a valid 10-digit mobile number.");
      setStatus("error");
      return;
    }

    setStatus("submitting");
    setErrorMessage("");

    try {
      const res = await fetch("/api/site-visit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone: localPhone, date, time, project: propertyName }),
      });

      if (!res.ok) {
        throw new Error("Failed to submit request.");
      }

      setStatus("success");
    } catch (err: any) {
      setErrorMessage(err.message || "An error occurred while submitting your request.");
      setStatus("error");
    }
  };

  const inputClass = "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-50 pl-10";

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 pointer-events-none">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              transition={{ type: "spring", bounce: 0, duration: 0.3 }}
              className="relative w-full max-w-md overflow-hidden rounded-2xl border border-border bg-card shadow-glass pointer-events-auto"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-border bg-muted/50 px-5 py-4">
                <h2 className="flex items-center gap-2 font-display text-lg font-bold text-foreground">
                  <CalendarCheck className="h-5 w-5 text-accent" /> Book Site Visit
                </h2>
                <button
                  onClick={onClose}
                  className="rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                  <span className="sr-only">Close</span>
                </button>
              </div>

              {/* Body */}
              <div className="p-5 sm:p-6">
                {status === "success" ? (
                  <div className="flex flex-col items-center justify-center py-6 text-center">
                    <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-500">
                      <CheckCircle2 className="h-8 w-8" />
                    </div>
                    <h3 className="font-display text-xl font-bold text-foreground">Request Sent!</h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Thank you for your interest in {propertyName}. Our property expert will contact you shortly to confirm your visit.
                    </p>
                    <Button onClick={onClose} className="mt-6 w-full">
                      Done
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <p className="mb-2 text-sm text-muted-foreground text-center">
                      Schedule a free guided tour of the property and its amenities.
                    </p>

                    <div className="space-y-4">
                      {/* Project (Read-only) */}
                      <div className="relative">
                        <Building className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <input
                          type="text"
                          value={propertyName}
                          readOnly
                          className={inputClass}
                        />
                      </div>

                      {/* Name */}
                      <div className="relative">
                        <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <input
                          type="text"
                          required
                          placeholder="Your Full Name"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className={inputClass}
                        />
                      </div>

                      {/* Phone */}
                      <div className="relative">
                        <Phone className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <input
                          type="tel"
                          required
                          placeholder="Contact Number (e.g. 98XXX XXXXX)"
                          value={phone}
                          onChange={(e) => {
                            setPhone(e.target.value);
                            if (status === "error") setStatus("idle");
                          }}
                          className={inputClass}
                        />
                      </div>

                      {status === "error" && (
                        <p className="text-xs font-medium text-red-500">{errorMessage}</p>
                      )}

                      <div className="grid grid-cols-2 gap-4">
                        {/* Date */}
                        <div className="relative">
                          <CalendarIcon className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                          <input
                            type="date"
                            required
                            min={new Date().toISOString().split("T")[0]}
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className={inputClass}
                          />
                        </div>

                        {/* Time */}
                        <div className="relative">
                          <Clock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                          <input
                            type="time"
                            required
                            value={time}
                            onChange={(e) => setTime(e.target.value)}
                            className={inputClass}
                          />
                        </div>
                      </div>
                    </div>

                    <Button
                      type="submit"
                      variant="accent"
                      className="mt-6 w-full"
                      disabled={status === "submitting"}
                    >
                      {status === "submitting" ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting...
                        </>
                      ) : (
                        "Confirm Booking"
                      )}
                    </Button>
                  </form>
                )}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
