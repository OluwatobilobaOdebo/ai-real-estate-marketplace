import { NextResponse } from "next/server";
import { ListingStatus, PropertyType } from "@prisma/client";
import prisma from "@/lib/prisma";

// GET /api/properties - list properties (basic filtering by city, type, status, q)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const city = searchParams.get("city") || undefined;
    const q = searchParams.get("q") || undefined;
    const type = searchParams.get("type") as PropertyType | null;
    const status = searchParams.get("status") as ListingStatus | null;

    const where: any = {};

    if (city) {
      where.city = { contains: city, mode: "insensitive" };
    }

    if (q) {
      where.OR = [
        { title: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
        { city: { contains: q, mode: "insensitive" } },
        { state: { contains: q, mode: "insensitive" } },
      ];
    }

    if (type && Object.values(PropertyType).includes(type)) {
      where.propertyType = type;
    }

    if (status && Object.values(ListingStatus).includes(status)) {
      where.listingStatus = status;
    } else {
      // by default only show active listings
      where.listingStatus = ListingStatus.ACTIVE;
    }

    const properties = await prisma.property.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(properties);
  } catch (error) {
    console.error("[GET /api/properties] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch properties" },
      { status: 500 }
    );
  }
}

// POST /api/properties - create a new property
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      title,
      description,
      price,
      city,
      state,
      country,
      address,
      bedrooms,
      bathrooms,
      squareFeet,
      propertyType,
      imageUrl,
      agentId,
    } = body;

    if (!title || !description || !price || !city || !propertyType) {
      return NextResponse.json(
        {
          error:
            "title, description, price, city, and propertyType are required",
        },
        { status: 400 }
      );
    }

    const created = await prisma.property.create({
      data: {
        title,
        description,
        price: Number(price),
        city,
        state: state || null,
        country: country || "USA",
        address: address || null,
        bedrooms: bedrooms != null ? Number(bedrooms) : null,
        bathrooms: bathrooms != null ? Number(bathrooms) : null,
        squareFeet: squareFeet != null ? Number(squareFeet) : null,
        propertyType,
        imageUrl: imageUrl || null,
        agentId: agentId || null,
        listingStatus: ListingStatus.ACTIVE,
      },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error("[POST /api/properties] Error:", error);
    return NextResponse.json(
      { error: "Failed to create property" },
      { status: 500 }
    );
  }
}
