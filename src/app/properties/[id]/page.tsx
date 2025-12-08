import { notFound } from "next/navigation";
import Link from "next/link";
import prisma from "@/lib/prisma";

type PropertyPageProps = {
  params: Promise<{ id: string }>;
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
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-4xl px-4 py-8">
        <Link
          href="/"
          className="mb-4 inline-flex items-center text-sm text-cyan-300 hover:text-cyan-200"
        >
          ← Back to all properties
        </Link>

        <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/70 shadow-xl">
          {imageUrl && (
            <div className="h-72 w-full bg-slate-800">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imageUrl}
                alt={title}
                className="h-full w-full object-cover"
              />
            </div>
          )}

          <div className="p-6">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <h1 className="text-2xl font-semibold">{title}</h1>
              <span className="rounded-full bg-slate-800 px-3 py-1 text-xs font-medium uppercase tracking-wide text-slate-200">
                {propertyType}
              </span>
            </div>

            <p className="text-sm text-slate-400">
              {city}
              {state ? `, ${state}` : ""}
              {country ? `, ${country}` : ""}
            </p>

            {address && (
              <p className="mt-1 text-xs text-slate-500">{address}</p>
            )}

            <p className="mt-4 text-2xl font-bold text-emerald-300">
              ${price.toLocaleString()}
            </p>

            <div className="mt-3 flex flex-wrap gap-3 text-sm text-slate-300">
              {bedrooms != null && (
                <span className="rounded-full bg-slate-800 px-3 py-1 text-xs">
                  🛏 {bedrooms} bedrooms
                </span>
              )}
              {bathrooms != null && (
                <span className="rounded-full bg-slate-800 px-3 py-1 text-xs">
                  🛁 {bathrooms} bathrooms
                </span>
              )}
              {squareFeet != null && (
                <span className="rounded-full bg-slate-800 px-3 py-1 text-xs">
                  📐 {squareFeet.toLocaleString()} sqft
                </span>
              )}
            </div>

            <div className="mt-6 border-t border-slate-800 pt-4">
              <h2 className="mb-2 text-sm font-semibold text-slate-200">
                Property description
              </h2>
              <p className="whitespace-pre-line text-sm leading-relaxed text-slate-200">
                {description}
              </p>
            </div>

            <p className="mt-6 text-xs text-slate-500">
              Listed on{" "}
              {new Date(createdAt).toLocaleDateString(undefined, {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
              .
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
