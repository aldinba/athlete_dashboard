# Athlete Dashboard – AI-Powered Running Analytics

## Project Overview
This document outlines the requirements and specifications for the Athlete Dashboard, a modern web application designed for endurance athletes, particularly runners. The application will allow users to upload training data, analyze sessions using scientific metrics, visualize data with interactive charts and maps, and receive AI-powered coaching advice.

## Core Principles
- Privacy-friendly: User data is securely stored and accessible only to the user
- User-friendly: Intuitive interface with clear visualizations and insights
- Insightful: Provides meaningful analytics for both recreational and performance-focused runners

## Tech Stack
- **Frontend:** React (with Vite or Next.js), TailwindCSS, Recharts, Leaflet.js
- **Backend:** Supabase (Postgres, Auth, Storage, Edge Functions)
- **AI Integration:** OpenAI API or local LLM via serverless function
- **Deployment:** Vercel
- **Dev Environment:** Cursor (AI-powered IDE)

## Key Features (Phase 1 – MVP)

### Workout Management
- Upload `.fit` files (via Supabase Storage)
- Parse key metrics from each session:
  - Duration
  - Distance
  - Heart rate (avg, max)
  - Cadence, Elevation
  - Pace per km/mile
  - GPS coordinates

### Analytics
- Calculate and store:
  - **TRIMP** (Training Impulse, Banister formula)
  - **ATL (Acute Training Load)**
  - **CTL (Chronic Training Load)**
  - **TSB (Training Stress Balance)**
  - **VO2max estimate**
  - **HR Drift**
- Interactive charts using Recharts:
  - CTL / ATL / TSB over time
  - Weekly mileage trend
  - TRIMP per session
  - HR zones pie chart

### AI Smart Coach
- Analyze recent training data (TRIMP, CTL, TSB, etc.)
- Provide plain-language feedback:
  - Are you improving or overtraining?
  - Should you rest, push, or maintain?
  - Recommend next workout types (easy, tempo, intervals)
- Display this advice in a chat-style **"Coach Panel"**

### User Management
- Supabase Auth (email login, optionally Google OAuth)
- Row-Level Security: each user sees only their own data

## Implementation Roadmap

### Phase 1 (MVP)
- Supabase schema: workouts, users, metrics
- FIT file upload + parsing
- TRIMP + CTL/ATL/TSB calculation utils
- Dashboard with charts and workout list
- Basic Smart Coach advisor

### Phase 2
- Add map route display with Leaflet.js
- Workout comparison view
- Manual workout entry form
- VO2max trend and estimated race time
- Shoe tracking

### Phase 3
- AI-generated training plans
- AI race preparation module
- Custom HR zones per user
- LLM personalization (Coach with personality)

## Implementation Notes
- Use modular React components
- All metrics and calculations should be cleanly abstracted (e.g. `trainingLoad.js`)
- Workouts should be grouped by user ID (multi-user safe)
- Each function should be unit-testable
- All AI interactions must be explained and debuggable

## First Steps
1. Generate the Supabase schema + RLS for `workouts`
2. Build FIT upload flow with Supabase Storage
3. Create TRIMP + CTL/ATL/TSB utility functions
4. Build minimal dashboard with charts
5. Integrate basic Smart Coach with OpenAI prompt
