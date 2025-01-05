"use client";

import React from "react";
import { Loader2 } from "lucide-react";

function AlertMessage({
  type,
  children,
}: {
  type: "success" | "error";
  children: React.ReactNode;
}) {
  const bgColor =
    type === "success"
      ? "bg-green-500/10 border-green-500/50"
      : "bg-red-500/10 border-red-500/50";
  const textColor = type === "success" ? "text-green-200" : "text-red-200";

  return (
    <div className={`p-4 rounded-lg border ${bgColor} ${textColor} mb-6`}>
      {children}
    </div>
  );
}

export default function ContactForm() {
  const [formData, setFormData] = React.useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
    district: "",
    preferredContact: "email",
    newsletter: false,
  });

  const [status, setStatus] = React.useState({
    submitting: false,
    submitted: false,
    error: null as string | null,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus({ submitting: true, submitted: false, error: null });

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || data.errors?.join(", ") || "Hiba történt a küldés során"
        );
      }

      setStatus({ submitting: false, submitted: true, error: null });
      setFormData({
        name: "",
        email: "",
        phone: "",
        subject: "",
        message: "",
        district: "",
        preferredContact: "email",
        newsletter: false,
      });
    } catch (error) {
      setStatus({
        submitting: false,
        submitted: false,
        error:
          error instanceof Error ? error.message : "Ismeretlen hiba történt",
      });
    }
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="bg-white/5 backdrop-blur-lg p-8 rounded-2xl shadow-lg">
        {status.submitted && (
          <AlertMessage type="success">
            Köszönjük megkeresését! Hamarosan felveszem Önnel a kapcsolatot.
          </AlertMessage>
        )}

        {status.error && (
          <AlertMessage type="error">{status.error}</AlertMessage>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-200">Név*</label>
              <input
                type="text"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-white/10 border border-gray-600 rounded-lg focus:ring-2 focus:ring-[#8DEBD1] focus:border-transparent text-white"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-200">
                Email cím*
              </label>
              <input
                type="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-white/10 border border-gray-600 rounded-lg focus:ring-2 focus:ring-[#8DEBD1] focus:border-transparent text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-200">
                Telefonszám
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-white/10 border border-gray-600 rounded-lg focus:ring-2 focus:ring-[#8DEBD1] focus:border-transparent text-white"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-200">
                Kerület
              </label>
              <input
                type="text"
                name="district"
                value={formData.district}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-white/10 border border-gray-600 rounded-lg focus:ring-2 focus:ring-[#8DEBD1] focus:border-transparent text-white"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-200">Tárgy*</label>
            <input
              type="text"
              name="subject"
              required
              value={formData.subject}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-white/10 border border-gray-600 rounded-lg focus:ring-2 focus:ring-[#8DEBD1] focus:border-transparent text-white"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-200">Üzenet*</label>
            <textarea
              name="message"
              required
              value={formData.message}
              onChange={handleChange}
              rows={5}
              className="w-full px-4 py-2 bg-white/10 border border-gray-600 rounded-lg focus:ring-2 focus:ring-[#8DEBD1] focus:border-transparent text-white"
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <label className="text-sm font-medium text-gray-200">
                Preferált kapcsolattartás:
              </label>
              <select
                name="preferredContact"
                value={formData.preferredContact}
                onChange={handleChange}
                className="px-4 py-2 bg-white/10 border border-gray-600 rounded-lg focus:ring-2 focus:ring-[#8DEBD1] focus:border-transparent text-white"
              >
                <option value="email">Email</option>
                <option value="phone">Telefon</option>
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                name="newsletter"
                checked={formData.newsletter}
                onChange={handleChange}
                className="rounded text-[#8DEBD1] bg-white/10 border-gray-600 focus:ring-2 focus:ring-[#8DEBD1]"
              />
              <label className="text-sm text-gray-200">
                Szeretnék feliratkozni a hírlevélre
              </label>
            </div>
          </div>

          <button
            type="submit"
            disabled={status.submitting}
            className="w-full px-6 py-3 text-gray-900 font-medium bg-gradient-to-r from-[#6DAEF0] to-[#8DEBD1] rounded-lg hover:shadow-lg transition-all duration-300 disabled:opacity-50 flex items-center justify-center"
          >
            {status.submitting ? (
              <>
                <Loader2 className="animate-spin mr-2" />
                Küldés...
              </>
            ) : (
              "Üzenet küldése"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
