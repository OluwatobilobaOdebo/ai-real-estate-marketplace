# AI-Powered Real Estate Marketplace

A full-stack real estate listing platform built with Next.js 14 (App Router), Prisma + Neon Postgres, and OpenAI API for AI-assisted property descriptions, marketing copy, and inquiry replies.

This project showcases a modern, production-grade full-stack architecture with advanced frontend UX, serverless API routes, database modeling, and real AI automation features suitable for a professional portfolio.

---

## Features

### Property Marketplace
- Browse all properties
- Keyword + city search
- Filter by price range
- Filter by property type
- Clean grid layout with modern UI

### Create New Listing
- Add title, description, price, address, beds, baths, sqft, type, and image
- Real-time validation
- Instantly updates marketplace feed

---

## AI Tools

### AI Listing Description Generator
Generates polished, professional descriptions using:
- City  
- Price  
- Bedrooms  
- Bathrooms  
- Property type  
- Optional agent notes  

### AI Marketing Helper
Produces:
- A list of features/highlights
- A social-media-optimized caption (Instagram, TikTok, Zillow, etc.)

### AI Inquiry Reply Assistant
Given a selected property + buyer message:
- Generates a clean, professional reply email  
- Editable + one-click copy

---

## Property Detail Pages

Each property has its own clean, SEO-friendly URL:
Includes:
- Large image header  
- Title, price, location  
- Full description  
- Details (beds, baths, sqft, type)  
- “Back to properties” navigation

---

## Tech Stack

### Frontend
- Next.js 14 (App Router)
- React Server Components
- TailwindCSS
- TypeScript

### Backend
- Next.js Route Handlers (`app/api/...`)
- Prisma ORM
- Neon Postgres (serverless database)

### AI
- OpenAI API
