"use client";

import { useEffect, useMemo, useState } from "react";
import type { Property, PropertyType, ListingStatus } from "@prisma/client";
import Link from "next/link";

type PropertyWithTypes = Property; // for clarity if we extend later

const PROPERTY_TYPE_LABELS: Record<PropertyType, string> = {
  HOUSE: "House",
  APARTMENT: "Apartment",
  CONDO: "Condo",
  TOWNHOUSE: "Townhouse",
  STUDIO: "Studio",
};

export default function Home() {
  const [properties, setProperties] = useState<PropertyWithTypes[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // search/filter UI state
  const [q, setQ] = useState("");
  const [city, setCity] = useState("");
  const [type, setType] = useState<PropertyType | "ALL">("ALL");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  // --- Create listing form state ---
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newPrice, setNewPrice] = useState<number | "">("");
  const [newCity, setNewCity] = useState("");
  const [newState, setNewState] = useState("");
  const [newCountry, setNewCountry] = useState("USA");
  const [newAddress, setNewAddress] = useState("");
  const [newBedrooms, setNewBedrooms] = useState<number | "">("");
  const [newBathrooms, setNewBathrooms] = useState<number | "">("");
  const [newSqft, setNewSqft] = useState<number | "">("");
  const [newPropertyType, setNewPropertyType] = useState<
    "HOUSE" | "APARTMENT" | "CONDO" | "TOWNHOUSE" | "STUDIO"
  >("HOUSE");
  const [newImageUrl, setNewImageUrl] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [newAiNotes, setNewAiNotes] = useState("");
  const [isGeneratingDescription, setIsGeneratingDescription] = useState(false);

  // --- AI inquiry reply state ---
  const [inquiryPropertyId, setInquiryPropertyId] = useState("");
  const [buyerMessage, setBuyerMessage] = useState("");
  const [aiReply, setAiReply] = useState("");
  const [isGeneratingReply, setIsGeneratingReply] = useState(false);

  // --- AI marketing helpers state ---
  const [marketingNotes, setMarketingNotes] = useState("");
  const [aiHighlights, setAiHighlights] = useState<string[]>([]);
  const [aiCaption, setAiCaption] = useState("");
  const [isGeneratingMarketing, setIsGeneratingMarketing] = useState(false);

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const res = await fetch("/api/properties");
        if (!res.ok) {
          throw new Error("Failed to load properties");
        }

        const data = await res.json();
        setProperties(data);
      } catch (err: any) {
        console.error(err);
        setError(err.message ?? "Something went wrong");
      } finally {
        setIsLoading(false);
      }
    };

    fetchProperties();
  }, []);

  const filtered = useMemo(() => {
    return properties.filter((p) => {
      if (type !== "ALL" && p.propertyType !== type) return false;

      if (q) {
        const haystack = `${p.title} ${p.description} ${p.city ?? ""} ${
          p.state ?? ""
        }`.toLowerCase();
        if (!haystack.includes(q.toLowerCase())) return false;
      }

      if (city && !(p.city ?? "").toLowerCase().includes(city.toLowerCase())) {
        return false;
      }

      if (minPrice && p.price < Number(minPrice)) return false;
      if (maxPrice && p.price > Number(maxPrice)) return false;

      return true;
    });
  }, [properties, q, city, type, minPrice, maxPrice]);

  const handleCreateProperty = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    setError(null);

    try {
      const res = await fetch("/api/properties", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: newTitle,
          description: newDescription,
          price: typeof newPrice === "string" ? Number(newPrice) : newPrice,
          city: newCity,
          state: newState || null,
          country: newCountry || "USA",
          address: newAddress || null,
          bedrooms:
            typeof newBedrooms === "string" ? Number(newBedrooms) : newBedrooms,
          bathrooms:
            typeof newBathrooms === "string"
              ? Number(newBathrooms)
              : newBathrooms,
          squareFeet:
            typeof newSqft === "string" ? Number(newSqft) : newSqft || null,
          propertyType: newPropertyType,
          imageUrl: newImageUrl || null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error ?? "Failed to create property");
      }

      // Prepend new property to the list
      setProperties((prev) => [data, ...prev]);

      // Reset form
      setNewTitle("");
      setNewDescription("");
      setNewPrice("");
      setNewCity("");
      setNewState("");
      setNewCountry("USA");
      setNewAddress("");
      setNewBedrooms("");
      setNewBathrooms("");
      setNewSqft("");
      setNewPropertyType("HOUSE");
      setNewImageUrl("");
    } catch (err: any) {
      console.error(err);
      setError(err.message ?? "Something went wrong while creating listing.");
    } finally {
      setIsCreating(false);
    }
  };

  const handleGenerateDescription = async () => {
    setError(null);

    // Basic validation – helps avoid useless API calls
    if (!newCity || !newPrice) {
      setError(
        "Add at least a city and price before generating a description."
      );
      return;
    }

    try {
      setIsGeneratingDescription(true);

      const priceNumber =
        typeof newPrice === "string" ? Number(newPrice) || 0 : newPrice;

      const bedroomsNumber =
        typeof newBedrooms === "string"
          ? Number(newBedrooms) || null
          : newBedrooms;

      const bathroomsNumber =
        typeof newBathrooms === "string"
          ? Number(newBathrooms) || null
          : newBathrooms;

      const res = await fetch("/api/ai/listing-description", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          city: newCity,
          propertyType: newPropertyType,
          bedrooms: bedroomsNumber,
          bathrooms: bathroomsNumber,
          price: priceNumber,
          notes: newAiNotes,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error ?? "Failed to generate description");
      }

      setNewDescription(data.description);
    } catch (err: any) {
      console.error(err);
      setError(
        err?.message ??
          "Something went wrong while generating the listing description."
      );
    } finally {
      setIsGeneratingDescription(false);
    }
  };

  const handleGenerateInquiryReply = async () => {
    setError(null);

    const property = properties.find((p) => p.id === inquiryPropertyId);

    if (!property) {
      setError("Select a property before generating a reply.");
      return;
    }

    if (!buyerMessage.trim()) {
      setError("Paste the buyer's message before generating a reply.");
      return;
    }

    try {
      setIsGeneratingReply(true);

      const res = await fetch("/api/ai/inquiry-reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyTitle: property.title,
          city: property.city,
          price: property.price,
          bedrooms: property.bedrooms,
          bathrooms: property.bathrooms,
          agentNotes: property.description, // or something else later
          buyerMessage,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error ?? "Failed to generate reply");
      }

      setAiReply(data.reply);
    } catch (err: any) {
      console.error(err);
      setError(
        err?.message ??
          "Something went wrong while generating the inquiry reply."
      );
    } finally {
      setIsGeneratingReply(false);
    }
  };

  const handleGenerateMarketing = async () => {
    setError(null);
    setAiHighlights([]);
    setAiCaption("");

    if (!newTitle || !newCity) {
      setError("Please fill at least Title and City before using AI.");
      return;
    }

    const priceNumber =
      typeof newPrice === "string" ? Number(newPrice) : newPrice;
    const bedroomsNumber =
      typeof newBedrooms === "string" ? Number(newBedrooms) : newBedrooms;
    const bathroomsNumber =
      typeof newBathrooms === "string" ? Number(newBathrooms) : newBathrooms;

    try {
      setIsGeneratingMarketing(true);

      const res = await fetch("/api/ai/listing-marketing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle,
          city: newCity,
          propertyType: newPropertyType,
          price: priceNumber || undefined,
          bedrooms: bedroomsNumber ?? undefined,
          bathrooms: bathroomsNumber ?? undefined,
          notes: marketingNotes,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error ?? "Failed to generate marketing copy");
      }

      setAiHighlights(data.highlights ?? []);
      setAiCaption(data.caption ?? "");
    } catch (err: any) {
      console.error(err);
      setError(
        err?.message ?? "Something went wrong while generating marketing copy."
      );
    } finally {
      setIsGeneratingMarketing(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <header className="mb-8 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-semibold">
              Real Estate Marketplace &amp; AI Listing Assistant
            </h1>
            <p className="text-sm text-slate-400">
              Browse properties, manage listings, and soon use AI to generate
              better descriptions, highlights, and inquiry messages.
            </p>
          </div>
        </header>

        {/* Filters */}
        <section className="mb-6 rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
          <h2 className="mb-3 text-sm font-semibold text-slate-200">
            Search properties
          </h2>
          <div className="grid gap-3 md:grid-cols-4">
            <input
              className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
              placeholder="Search by keyword..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            <input
              className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
              placeholder="City"
              value={city}
              onChange={(e) => setCity(e.target.value)}
            />
            <select
              className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
              value={type}
              onChange={(e) => setType(e.target.value as PropertyType | "ALL")}
            >
              <option value="ALL">All property types</option>
              {(Object.keys(PROPERTY_TYPE_LABELS) as PropertyType[]).map(
                (t) => (
                  <option key={t} value={t}>
                    {PROPERTY_TYPE_LABELS[t]}
                  </option>
                )
              )}
            </select>
            <div className="flex gap-2">
              <input
                type="number"
                className="w-1/2 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                placeholder="Min price"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
              />
              <input
                type="number"
                className="w-1/2 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                placeholder="Max price"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
              />
            </div>
          </div>
        </section>

        {/* Create Listing */}
        <section className="mt-8 rounded-2xl border border-slate-800 bg-slate-900/40 p-6 shadow-lg">
          <h2 className="mb-2 text-lg font-semibold">Create a New Listing</h2>
          <p className="mb-4 text-sm text-slate-400">
            Add a property to your marketplace. Soon we’ll let AI help you write
            an optimized description.
          </p>

          <form
            onSubmit={handleCreateProperty}
            className="grid gap-4 md:grid-cols-2"
          >
            <div className="flex flex-col gap-1">
              <label className="text-sm text-slate-300">Title *</label>
              <input
                className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="e.g. Modern 3BR Home Near Downtown"
                required
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm text-slate-300">Price (USD) *</label>
              <input
                type="number"
                min={0}
                className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                value={newPrice}
                onChange={(e) =>
                  setNewPrice(
                    e.target.value === "" ? "" : Number(e.target.value)
                  )
                }
                required
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm text-slate-300">City *</label>
              <input
                className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                value={newCity}
                onChange={(e) => setNewCity(e.target.value)}
                required
              />
            </div>

            <div className="flex gap-2">
              <div className="flex flex-1 flex-col gap-1">
                <label className="text-sm text-slate-300">State</label>
                <input
                  className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                  value={newState}
                  onChange={(e) => setNewState(e.target.value)}
                  placeholder="CA, NY, TX..."
                />
              </div>
              <div className="flex flex-1 flex-col gap-1">
                <label className="text-sm text-slate-300">Country</label>
                <input
                  className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                  value={newCountry}
                  onChange={(e) => setNewCountry(e.target.value)}
                />
              </div>
            </div>

            <div className="flex flex-col gap-1 md:col-span-2">
              <label className="text-sm text-slate-300">Address</label>
              <input
                className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                value={newAddress}
                onChange={(e) => setNewAddress(e.target.value)}
                placeholder="123 Main St, Unit 4B"
              />
            </div>

            <div className="flex gap-2">
              <div className="flex flex-1 flex-col gap-1">
                <label className="text-sm text-slate-300">Bedrooms</label>
                <input
                  type="number"
                  min={0}
                  className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                  value={newBedrooms}
                  onChange={(e) =>
                    setNewBedrooms(
                      e.target.value === "" ? "" : Number(e.target.value)
                    )
                  }
                />
              </div>
              <div className="flex flex-1 flex-col gap-1">
                <label className="text-sm text-slate-300">Bathrooms</label>
                <input
                  type="number"
                  min={0}
                  step="0.5"
                  className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                  value={newBathrooms}
                  onChange={(e) =>
                    setNewBathrooms(
                      e.target.value === "" ? "" : Number(e.target.value)
                    )
                  }
                />
              </div>
              <div className="flex flex-1 flex-col gap-1">
                <label className="text-sm text-slate-300">Square feet</label>
                <input
                  type="number"
                  min={0}
                  className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                  value={newSqft}
                  onChange={(e) =>
                    setNewSqft(
                      e.target.value === "" ? "" : Number(e.target.value)
                    )
                  }
                />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm text-slate-300">Property type</label>
              <select
                className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                value={newPropertyType}
                onChange={(e) =>
                  setNewPropertyType(e.target.value as typeof newPropertyType)
                }
              >
                <option value="HOUSE">House</option>
                <option value="APARTMENT">Apartment</option>
                <option value="CONDO">Condo</option>
                <option value="TOWNHOUSE">Townhouse</option>
                <option value="STUDIO">Studio</option>
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm text-slate-300">Image URL</label>
              <input
                className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                value={newImageUrl}
                onChange={(e) => setNewImageUrl(e.target.value)}
                placeholder="https://…"
              />
            </div>

            {/* Description + AI helper */}
            <div className="md:col-span-2 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm text-slate-300">Description</label>
                <button
                  type="button"
                  onClick={handleGenerateDescription}
                  disabled={isGeneratingDescription}
                  className="rounded-md border border-cyan-500/70 bg-cyan-600/10 px-3 py-1 text-xs font-medium text-cyan-200 hover:bg-cyan-600/20 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isGeneratingDescription ? "Generating…" : "Generate with AI"}
                </button>
              </div>

              <textarea
                className="h-28 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                placeholder="Write or generate a property description..."
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                required
              />

              <div className="space-y-1">
                <label className="text-xs text-slate-400">
                  Notes for AI (optional – special features, upgrades,
                  neighborhood vibe…)
                </label>
                <input
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                  placeholder="e.g. Recently renovated kitchen, walkable to parks and cafes"
                  value={newAiNotes}
                  onChange={(e) => setNewAiNotes(e.target.value)}
                />
              </div>
            </div>
            {/* ...your existing inputs for title, price, beds, baths, etc... */}

            {/* AI marketing helpers */}
            <div className="md:col-span-2 mt-2 rounded-xl border border-slate-800 bg-slate-950/70 p-3">
              <h3 className="mb-2 text-sm font-semibold text-slate-200">
                AI marketing helpers
              </h3>

              <label className="mb-1 block text-xs text-slate-400">
                Extra notes (optional – things you want the AI to emphasize)
              </label>
              <textarea
                className="mb-3 h-20 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                value={marketingNotes}
                onChange={(e) => setMarketingNotes(e.target.value)}
                placeholder="Quiet cul-de-sac, walkable to shops, great natural light, renovated kitchen..."
              />

              <button
                type="button"
                onClick={handleGenerateMarketing}
                disabled={isGeneratingMarketing}
                className="rounded-lg bg-cyan-500 px-4 py-2 text-xs font-medium text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isGeneratingMarketing
                  ? "Generating highlights & caption..."
                  : "Generate highlights & caption with AI"}
              </button>

              {(aiHighlights.length > 0 || aiCaption) && (
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  <div>
                    <h4 className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Suggested highlights
                    </h4>
                    <ul className="space-y-1 text-xs text-slate-200">
                      {aiHighlights.map((h, idx) => (
                        <li key={idx}>• {h}</li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h4 className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Social caption
                    </h4>
                    <textarea
                      className="h-24 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                      value={aiCaption}
                      onChange={(e) => setAiCaption(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={async () => {
                        if (!aiCaption) return;
                        try {
                          await navigator.clipboard.writeText(aiCaption);
                        } catch (err) {
                          console.error(err);
                        }
                      }}
                      disabled={!aiCaption}
                      className="mt-2 rounded-lg border border-slate-700 bg-slate-900 px-3 py-1 text-[11px] font-medium text-slate-200 hover:border-cyan-400 hover:text-cyan-200 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Copy caption
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Submit button stays last */}
            <div className="md:col-span-2 flex justify-end mt-4">
              <button
                type="submit"
                disabled={isCreating}
                className="inline-flex items-center rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isCreating ? "Creating..." : "Create Listing"}
              </button>
            </div>
          </form>
        </section>

        {/* Results */}
        <section>
          {error && (
            <div className="mb-4 rounded-md border border-red-500/40 bg-red-500/10 px-4 py-2 text-sm text-red-200">
              {error}
            </div>
          )}

          {isLoading ? (
            <p className="text-sm text-slate-400">Loading properties…</p>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-slate-400">
              No properties found. Once you create listings, they will appear
              here.
            </p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filtered.map((p) => (
                <Link
                  key={p.id}
                  href={`/properties/${p.id}`}
                  className="flex flex-col overflow-hidden rounded-xl border border-slate-800 bg-slate-900/70 shadow-md hover:border-cyan-500/60 hover:shadow-cyan-500/10 transition"
                >
                  <div className="h-40 w-full bg-slate-800">
                    {p.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={p.imageUrl}
                        alt={p.title}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-xs text-slate-500">
                        No image
                      </div>
                    )}
                  </div>

                  <div className="flex flex-1 flex-col px-4 py-3">
                    <div className="mb-1 flex items-center justify-between gap-2">
                      <h3 className="text-sm font-semibold">{p.title}</h3>
                      <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] uppercase tracking-wide text-slate-300">
                        {PROPERTY_TYPE_LABELS[p.propertyType]}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">
                      {p.city}, {p.state ?? p.country ?? "USA"}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-emerald-300">
                      ${p.price.toLocaleString()}
                    </p>
                    <p className="mt-2 line-clamp-2 text-xs text-slate-400">
                      {p.description}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-slate-400">
                      {p.bedrooms != null && <span>{p.bedrooms} bd</span>}
                      {p.bathrooms != null && <span>{p.bathrooms} ba</span>}
                      {p.squareFeet != null && <span>{p.squareFeet} sqft</span>}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
        {/* AI Inquiry Reply Assistant */}
        <section className="mt-8 rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
          <h2 className="mb-2 text-lg font-semibold">
            AI Inquiry Reply Assistant
          </h2>
          <p className="mb-4 text-sm text-slate-400">
            Pick a listing, paste a buyer&apos;s message, and let AI draft a
            professional email reply you can copy into your email client.
          </p>

          <div className="mb-3 flex flex-col gap-2 md:flex-row md:items-center">
            <div className="flex-1">
              <label className="mb-1 block text-sm text-slate-300">
                Property
              </label>
              <select
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                value={inquiryPropertyId}
                onChange={(e) => setInquiryPropertyId(e.target.value)}
              >
                <option value="">Select a property…</option>
                {properties.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title} — {p.city}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {/* Buyer message input */}
            <div className="space-y-2">
              <label className="text-sm text-slate-300">
                Buyer&apos;s message
              </label>
              <textarea
                className="h-32 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                value={buyerMessage}
                onChange={(e) => setBuyerMessage(e.target.value)}
                placeholder='Paste what the buyer sent you, e.g. "Is this still available? Can you tell me more about the neighborhood?"'
              />
              <button
                type="button"
                onClick={handleGenerateInquiryReply}
                disabled={isGeneratingReply}
                className="rounded-lg bg-cyan-500 px-4 py-2 text-sm font-medium text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isGeneratingReply ? "Generating reply…" : "Generate reply"}
              </button>
            </div>

            {/* AI reply output */}
            <div className="space-y-2">
              <label className="text-sm text-slate-300">
                AI-generated reply (editable)
              </label>
              <textarea
                className="h-40 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                value={aiReply}
                onChange={(e) => setAiReply(e.target.value)}
                placeholder="The AI-generated reply will appear here. You can tweak it before copying."
              />
              <button
                type="button"
                onClick={async () => {
                  if (!aiReply) return;
                  try {
                    await navigator.clipboard.writeText(aiReply);
                  } catch (err) {
                    console.error(err);
                  }
                }}
                disabled={!aiReply}
                className="rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-xs font-medium text-slate-200 hover:border-cyan-400 hover:text-cyan-200 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Copy reply
              </button>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
