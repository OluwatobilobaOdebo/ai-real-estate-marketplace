import { notFound } from "next/navigation";
import Link from "next/link";
import prisma from "@/lib/prisma";

type PropertyPageProps = {
  params: Promise<{ id: string }>;
};

const PROPERTY_TYPE_LABELS: Record<string, string> = {
  HOUSE: "House",
  APARTMENT: "Apartment",
  CONDO: "Condo",
  TOWNHOUSE: "Townhouse",
  STUDIO: "Studio",
};

export default async function PropertyPage({ params }: PropertyPageProps) {
  const { id } = await params;

  const property = await prisma.property.findUnique({
    where: { id },
  });

  if (!property) {
    return notFound();
  }

  const {
    title,
    city,
    state,
    country,
    price,
    bedrooms,
    bathrooms,
    squareFeet,
    description,
    imageUrl,
    address,
    propertyType,
    createdAt,
  } = property;

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

          {/* Back link */}
          <Link
            href="/"
            className="flex items-center gap-2 rounded-lg border border-stone-200 px-4 py-2 text-sm font-medium text-stone-600 transition hover:border-stone-300 hover:text-stone-800"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Listings
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-6 py-8">
        {/* Property Card */}
        <article className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
          {/* Image */}
          {imageUrl ? (
            <div className="relative h-80 w-full bg-stone-100 md:h-96">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imageUrl}
                alt={title}
                className="h-full w-full object-cover"
              />
              <span className="absolute right-4 top-4 rounded-full bg-white/90 px-4 py-1.5 text-xs font-medium uppercase tracking-wide text-stone-700 shadow-sm backdrop-blur-sm">
                {PROPERTY_TYPE_LABELS[propertyType] || propertyType}
              </span>
            </div>
          ) : (
            <div className="flex h-64 items-center justify-center bg-stone-100">
              <div className="text-center text-stone-400">
                <svg className="mx-auto mb-2 h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="text-sm">No image available</span>
              </div>
            </div>
          )}

          {/* Content */}
          <div className="p-8">
            {/* Header */}
            <div className="mb-6 border-b border-stone-100 pb-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h1 className="font-display text-3xl font-semibold text-stone-800">{title}</h1>
                  <p className="mt-2 flex items-center gap-1 text-stone-500">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {city}
                    {state ? `, ${state}` : ""}
                    {country ? `, ${country}` : ""}
                  </p>
                  {address && (
                    <p className="mt-1 text-sm text-stone-400">{address}</p>
                  )}
                </div>
                <p className="text-3xl font-semibold text-[var(--color-gold-dark)]">
                  ${price.toLocaleString()}
                </p>
              </div>
            </div>

            {/* Property Stats */}
            <div className="mb-8 grid grid-cols-3 gap-4 rounded-xl bg-stone-50 p-4">
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 text-stone-600">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                  <span className="text-2xl font-semibold">{bedrooms ?? "-"}</span>
                </div>
                <p className="mt-1 text-xs text-stone-500">Bedrooms</p>
              </div>
              <div className="border-x border-stone-200 text-center">
                <div className="flex items-center justify-center gap-2 text-stone-600">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
                  </svg>
                  <span className="text-2xl font-semibold">{bathrooms ?? "-"}</span>
                </div>
                <p className="mt-1 text-xs text-stone-500">Bathrooms</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 text-stone-600">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                  </svg>
                  <span className="text-2xl font-semibold">{squareFeet?.toLocaleString() ?? "-"}</span>
                </div>
                <p className="mt-1 text-xs text-stone-500">Square Feet</p>
              </div>
            </div>

            {/* Description */}
            <div className="mb-8">
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-stone-500">
                About This Property
              </h2>
              <p className="whitespace-pre-line text-base leading-relaxed text-stone-700">
                {description}
              </p>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between border-t border-stone-100 pt-6">
              <p className="text-sm text-stone-400">
                Listed on{" "}
                {new Date(createdAt).toLocaleDateString(undefined, {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
              <Link
                href="/"
                className="btn-primary rounded-lg px-6 py-3 text-sm font-medium"
              >
                View All Properties
              </Link>
            </div>
          </div>
        </article>
      </div>
    </main>
  );
}
