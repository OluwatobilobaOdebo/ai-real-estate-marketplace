"use client";

import { useEffect, useMemo, useState } from "react";
import type { Property, PropertyType, ListingStatus } from "@prisma/client";
import Link from "next/link";

type PropertyWithTypes = Property;

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

  // Active section for navigation
  const [activeSection, setActiveSection] = useState<"browse" | "create" | "ai-tools">("browse");

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
      setActiveSection("browse");
    } catch (err: any) {
      console.error(err);
      setError(err.message ?? "Something went wrong while creating listing.");
    } finally {
      setIsCreating(false);
    }
  };

  const handleGenerateDescription = async () => {
    setError(null);

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
          agentNotes: property.description,
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
    <main className="min-h-screen bg-[var(--color-warm-white)]">
      {/* Navigation Header */}
      <header className="sticky top-0 z-50 border-b border-stone-200 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-stone-800">
              <span className="font-display text-xl font-bold text-white">H</span>
            </div>
            <div className="flex flex-col">
              <span className="font-display text-xl font-semibold text-stone-800">Haven Estate</span>
              <span className="text-[10px] uppercase tracking-widest text-stone-400">AI-Powered Listings</span>
            </div>
          </Link>

          {/* Navigation */}
          <nav className="flex items-center gap-1">
            <button
              onClick={() => setActiveSection("browse")}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                activeSection === "browse"
                  ? "bg-stone-100 text-stone-800"
                  : "text-stone-500 hover:text-stone-700"
              }`}
            >
              Browse Properties
            </button>
            <button
              onClick={() => setActiveSection("create")}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                activeSection === "create"
                  ? "bg-stone-100 text-stone-800"
                  : "text-stone-500 hover:text-stone-700"
              }`}
            >
              Create Listing
            </button>
            <button
              onClick={() => setActiveSection("ai-tools")}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                activeSection === "ai-tools"
                  ? "bg-stone-100 text-stone-800"
                  : "text-stone-500 hover:text-stone-700"
              }`}
            >
              AI Tools
            </button>
          </nav>
        </div>
      </header>

      {/* Hero Section - only on browse */}
      {activeSection === "browse" && (
        <section className="hero-gradient py-16 text-white">
          <div className="mx-auto max-w-7xl px-6">
            <div className="max-w-2xl">
              <h1 className="font-display text-4xl font-semibold leading-tight md:text-5xl">
                Find Your Perfect Property
              </h1>
              <p className="mt-4 text-lg text-stone-300">
                Discover exceptional homes with our AI-powered marketplace. 
                We help agents create compelling listings and buyers find their dream properties.
              </p>
            </div>
          </div>
        </section>
      )}

      <div className="mx-auto max-w-7xl px-6 py-8">
        {/* Error Display */}
        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Browse Section */}
        {activeSection === "browse" && (
          <>
            {/* Search Filters */}
            <section className="mb-8 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-stone-500">
                Search Properties
              </h2>
              <div className="grid gap-4 md:grid-cols-5">
                <input
                  className="rounded-lg border border-stone-200 bg-white px-4 py-3 text-sm text-stone-700 placeholder-stone-400 transition focus:border-[var(--color-gold)] focus:ring-2 focus:ring-[var(--color-gold)]/10"
                  placeholder="Search by keyword..."
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                />
                <input
                  className="rounded-lg border border-stone-200 bg-white px-4 py-3 text-sm text-stone-700 placeholder-stone-400 transition focus:border-[var(--color-gold)] focus:ring-2 focus:ring-[var(--color-gold)]/10"
                  placeholder="City"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                />
                <select
                  className="rounded-lg border border-stone-200 bg-white px-4 py-3 text-sm text-stone-700 transition focus:border-[var(--color-gold)] focus:ring-2 focus:ring-[var(--color-gold)]/10"
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
                <input
                  type="number"
                  className="rounded-lg border border-stone-200 bg-white px-4 py-3 text-sm text-stone-700 placeholder-stone-400 transition focus:border-[var(--color-gold)] focus:ring-2 focus:ring-[var(--color-gold)]/10"
                  placeholder="Min price"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                />
                <input
                  type="number"
                  className="rounded-lg border border-stone-200 bg-white px-4 py-3 text-sm text-stone-700 placeholder-stone-400 transition focus:border-[var(--color-gold)] focus:ring-2 focus:ring-[var(--color-gold)]/10"
                  placeholder="Max price"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                />
              </div>
            </section>

            {/* Property Results */}
            <section>
              <div className="mb-6 flex items-center justify-between">
                <h2 className="font-display text-2xl font-semibold text-stone-800">
                  Available Properties
                </h2>
                <span className="text-sm text-stone-500">
                  {filtered.length} {filtered.length === 1 ? "listing" : "listings"} found
                </span>
              </div>

              {isLoading ? (
                <div className="flex items-center justify-center py-20">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-stone-200 border-t-stone-600" />
                </div>
              ) : filtered.length === 0 ? (
                <div className="rounded-2xl border border-stone-200 bg-stone-50 py-20 text-center">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-stone-100">
                    <svg className="h-8 w-8 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <h3 className="font-display text-xl font-semibold text-stone-700">No Properties Found</h3>
                  <p className="mt-2 text-sm text-stone-500">
                    Be the first to create a listing or adjust your search filters.
                  </p>
                  <button
                    onClick={() => setActiveSection("create")}
                    className="btn-primary mt-6 rounded-lg px-6 py-3 text-sm font-medium"
                  >
                    Create Your First Listing
                  </button>
                </div>
              ) : (
                <div className="stagger-children grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {filtered.map((p) => (
                    <Link
                      key={p.id}
                      href={`/properties/${p.id}`}
                      className="card-hover group flex flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm"
                    >
                      <div className="relative h-48 w-full overflow-hidden bg-stone-100">
                        {p.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={p.imageUrl}
                            alt={p.title}
                            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                          />
                        ) : (
                          <div className="flex h-full flex-col items-center justify-center text-stone-400">
                            <svg className="mb-2 h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span className="text-xs">No image</span>
                          </div>
                        )}
                        <span className="property-tag absolute right-3 top-3 rounded-full px-3 py-1 text-[11px] font-medium uppercase tracking-wide">
                          {PROPERTY_TYPE_LABELS[p.propertyType]}
                        </span>
                      </div>

                      <div className="flex flex-1 flex-col p-5">
                        <h3 className="font-display text-lg font-semibold text-stone-800 group-hover:text-[var(--color-gold-dark)]">
                          {p.title}
                        </h3>
                        <p className="mt-1 text-sm text-stone-500">
                          {p.city}{p.state ? `, ${p.state}` : ""}{p.country && p.country !== "USA" ? `, ${p.country}` : ""}
                        </p>
                        <p className="mt-3 text-xl font-semibold text-[var(--color-gold-dark)]">
                          ${p.price.toLocaleString()}
                        </p>
                        <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-stone-600">
                          {p.description}
                        </p>
                        <div className="mt-auto flex flex-wrap gap-3 pt-4 text-xs text-stone-500">
                          {p.bedrooms != null && (
                            <span className="flex items-center gap-1">
                              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                              </svg>
                              {p.bedrooms} bd
                            </span>
                          )}
                          {p.bathrooms != null && (
                            <span className="flex items-center gap-1">
                              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
                              </svg>
                              {p.bathrooms} ba
                            </span>
                          )}
                          {p.squareFeet != null && (
                            <span className="flex items-center gap-1">
                              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                              </svg>
                              {p.squareFeet.toLocaleString()} sqft
                            </span>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </section>
          </>
        )}

        {/* Create Listing Section */}
        {activeSection === "create" && (
          <section className="animate-fade-in">
            <div className="mb-8">
              <h1 className="font-display text-3xl font-semibold text-stone-800">Create New Listing</h1>
              <p className="mt-2 text-stone-500">
                Add a property to the marketplace. Use AI to generate compelling descriptions.
              </p>
            </div>

            <form onSubmit={handleCreateProperty} className="space-y-8">
              {/* Basic Information */}
              <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
                <h2 className="mb-6 flex items-center gap-2 text-lg font-semibold text-stone-800">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-stone-100 text-sm text-stone-600">1</span>
                  Basic Information
                </h2>
                <div className="grid gap-5 md:grid-cols-2">
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-stone-700">Property Title <span className="text-red-500">*</span></label>
                    <input
                      className="rounded-lg border border-stone-200 bg-white px-4 py-3 text-sm text-stone-700 placeholder-stone-400 transition"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      placeholder="e.g. Modern 3BR Home Near Downtown"
                      required
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-stone-700">Price (USD) <span className="text-red-500">*</span></label>
                    <input
                      type="number"
                      min={0}
                      className="rounded-lg border border-stone-200 bg-white px-4 py-3 text-sm text-stone-700 placeholder-stone-400 transition"
                      value={newPrice}
                      onChange={(e) =>
                        setNewPrice(e.target.value === "" ? "" : Number(e.target.value))
                      }
                      placeholder="450000"
                      required
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-stone-700">Property Type</label>
                    <select
                      className="rounded-lg border border-stone-200 bg-white px-4 py-3 text-sm text-stone-700 transition"
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

                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-stone-700">Image URL</label>
                    <input
                      className="rounded-lg border border-stone-200 bg-white px-4 py-3 text-sm text-stone-700 placeholder-stone-400 transition"
                      value={newImageUrl}
                      onChange={(e) => setNewImageUrl(e.target.value)}
                      placeholder="https://..."
                    />
                  </div>
                </div>
              </div>

              {/* Location */}
              <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
                <h2 className="mb-6 flex items-center gap-2 text-lg font-semibold text-stone-800">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-stone-100 text-sm text-stone-600">2</span>
                  Location
                </h2>
                <div className="grid gap-5 md:grid-cols-3">
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-stone-700">City <span className="text-red-500">*</span></label>
                    <input
                      className="rounded-lg border border-stone-200 bg-white px-4 py-3 text-sm text-stone-700 placeholder-stone-400 transition"
                      value={newCity}
                      onChange={(e) => setNewCity(e.target.value)}
                      placeholder="San Francisco"
                      required
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-stone-700">State</label>
                    <input
                      className="rounded-lg border border-stone-200 bg-white px-4 py-3 text-sm text-stone-700 placeholder-stone-400 transition"
                      value={newState}
                      onChange={(e) => setNewState(e.target.value)}
                      placeholder="CA"
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-stone-700">Country</label>
                    <input
                      className="rounded-lg border border-stone-200 bg-white px-4 py-3 text-sm text-stone-700 placeholder-stone-400 transition"
                      value={newCountry}
                      onChange={(e) => setNewCountry(e.target.value)}
                    />
                  </div>

                  <div className="flex flex-col gap-2 md:col-span-3">
                    <label className="text-sm font-medium text-stone-700">Street Address</label>
                    <input
                      className="rounded-lg border border-stone-200 bg-white px-4 py-3 text-sm text-stone-700 placeholder-stone-400 transition"
                      value={newAddress}
                      onChange={(e) => setNewAddress(e.target.value)}
                      placeholder="123 Main St, Unit 4B"
                    />
                  </div>
                </div>
              </div>

              {/* Property Details */}
              <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
                <h2 className="mb-6 flex items-center gap-2 text-lg font-semibold text-stone-800">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-stone-100 text-sm text-stone-600">3</span>
                  Property Details
                </h2>
                <div className="grid gap-5 md:grid-cols-3">
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-stone-700">Bedrooms</label>
                    <input
                      type="number"
                      min={0}
                      className="rounded-lg border border-stone-200 bg-white px-4 py-3 text-sm text-stone-700 placeholder-stone-400 transition"
                      value={newBedrooms}
                      onChange={(e) =>
                        setNewBedrooms(e.target.value === "" ? "" : Number(e.target.value))
                      }
                      placeholder="3"
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-stone-700">Bathrooms</label>
                    <input
                      type="number"
                      min={0}
                      step="0.5"
                      className="rounded-lg border border-stone-200 bg-white px-4 py-3 text-sm text-stone-700 placeholder-stone-400 transition"
                      value={newBathrooms}
                      onChange={(e) =>
                        setNewBathrooms(e.target.value === "" ? "" : Number(e.target.value))
                      }
                      placeholder="2"
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-stone-700">Square Feet</label>
                    <input
                      type="number"
                      min={0}
                      className="rounded-lg border border-stone-200 bg-white px-4 py-3 text-sm text-stone-700 placeholder-stone-400 transition"
                      value={newSqft}
                      onChange={(e) =>
                        setNewSqft(e.target.value === "" ? "" : Number(e.target.value))
                      }
                      placeholder="1800"
                    />
                  </div>
                </div>
              </div>

              {/* Description with AI */}
              <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
                <h2 className="mb-6 flex items-center gap-2 text-lg font-semibold text-stone-800">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-stone-100 text-sm text-stone-600">4</span>
                  Description
                </h2>
                
                <div className="space-y-4">
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-stone-700">Property Description <span className="text-red-500">*</span></label>
                      <button
                        type="button"
                        onClick={handleGenerateDescription}
                        disabled={isGeneratingDescription}
                        className="btn-accent rounded-lg px-4 py-2 text-xs font-medium disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isGeneratingDescription ? "Generating..." : "Generate with AI"}
                      </button>
                    </div>
                    <textarea
                      className="h-32 rounded-lg border border-stone-200 bg-white px-4 py-3 text-sm text-stone-700 placeholder-stone-400 transition"
                      placeholder="Describe your property's best features..."
                      value={newDescription}
                      onChange={(e) => setNewDescription(e.target.value)}
                      required
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-xs text-stone-500">
                      Notes for AI (optional - special features, upgrades, neighborhood highlights)
                    </label>
                    <input
                      className="rounded-lg border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-700 placeholder-stone-400 transition"
                      placeholder="e.g. Recently renovated kitchen, walkable to parks and cafes"
                      value={newAiNotes}
                      onChange={(e) => setNewAiNotes(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* AI Marketing (Optional) */}
              <div className="rounded-2xl border border-dashed border-stone-300 bg-stone-50 p-6">
                <h2 className="mb-2 text-lg font-semibold text-stone-800">AI Marketing Helpers</h2>
                <p className="mb-4 text-sm text-stone-500">Generate highlights and social captions for your listing.</p>

                <div className="space-y-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-xs text-stone-500">Extra notes for marketing copy</label>
                    <textarea
                      className="h-20 rounded-lg border border-stone-200 bg-white px-4 py-3 text-sm text-stone-700 placeholder-stone-400 transition"
                      value={marketingNotes}
                      onChange={(e) => setMarketingNotes(e.target.value)}
                      placeholder="Quiet cul-de-sac, walkable to shops, great natural light..."
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleGenerateMarketing}
                    disabled={isGeneratingMarketing}
                    className="btn-secondary rounded-lg px-4 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isGeneratingMarketing ? "Generating..." : "Generate Marketing Copy"}
                  </button>

                  {(aiHighlights.length > 0 || aiCaption) && (
                    <div className="mt-4 grid gap-4 md:grid-cols-2">
                      <div className="rounded-lg border border-stone-200 bg-white p-4">
                        <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-stone-500">
                          Suggested Highlights
                        </h4>
                        <ul className="space-y-1 text-sm text-stone-700">
                          {aiHighlights.map((h, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[var(--color-gold)]" />
                              {h}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="rounded-lg border border-stone-200 bg-white p-4">
                        <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-stone-500">
                          Social Caption
                        </h4>
                        <textarea
                          className="h-24 w-full rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 text-sm text-stone-700 transition"
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
                          className="btn-secondary mt-2 rounded-lg px-3 py-1.5 text-xs font-medium disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Copy Caption
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Submit */}
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isCreating}
                  className="btn-primary rounded-lg px-8 py-3 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isCreating ? "Creating Listing..." : "Publish Listing"}
                </button>
              </div>
            </form>
          </section>
        )}

        {/* AI Tools Section */}
        {activeSection === "ai-tools" && (
          <section className="animate-fade-in">
            <div className="mb-8">
              <h1 className="font-display text-3xl font-semibold text-stone-800">AI Tools for Agents</h1>
              <p className="mt-2 text-stone-500">
                Powerful AI assistance to help you communicate with buyers effectively.
              </p>
            </div>

            <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
              <h2 className="mb-2 text-lg font-semibold text-stone-800">Inquiry Reply Assistant</h2>
              <p className="mb-6 text-sm text-stone-500">
                Select a listing, paste a buyer&apos;s message, and let AI draft a professional email reply.
              </p>

              <div className="mb-6">
                <label className="mb-2 block text-sm font-medium text-stone-700">Select Property</label>
                <select
                  className="w-full rounded-lg border border-stone-200 bg-white px-4 py-3 text-sm text-stone-700 transition"
                  value={inquiryPropertyId}
                  onChange={(e) => setInquiryPropertyId(e.target.value)}
                >
                  <option value="">Choose a property...</option>
                  {properties.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title} - {p.city}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="flex flex-col">
                  <label className="mb-3 block text-sm font-medium text-stone-700">Buyer&apos;s Message</label>
                  <textarea
                    className="h-48 w-full flex-1 rounded-lg border border-stone-200 bg-white px-4 py-3 text-sm text-stone-700 placeholder-stone-400 transition"
                    value={buyerMessage}
                    onChange={(e) => setBuyerMessage(e.target.value)}
                    placeholder="Paste the buyer's message here, e.g. Is this still available? Can you tell me more about the neighborhood?"
                  />
                  <button
                    type="button"
                    onClick={handleGenerateInquiryReply}
                    disabled={isGeneratingReply}
                    className="btn-primary mt-3 rounded-lg px-6 py-3 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isGeneratingReply ? "Generating..." : "Generate Reply"}
                  </button>
                </div>

                <div className="flex flex-col">
                  <label className="mb-3 block text-sm font-medium text-stone-700">AI-Generated Reply</label>
                  <textarea
                    className="h-48 w-full flex-1 rounded-lg border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-700 placeholder-stone-400 transition"
                    value={aiReply}
                    onChange={(e) => setAiReply(e.target.value)}
                    placeholder="The AI-generated reply will appear here. You can edit it before copying."
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
                    className="btn-secondary mt-3 rounded-lg px-6 py-3 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Copy Reply
                  </button>
                </div>
              </div>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
