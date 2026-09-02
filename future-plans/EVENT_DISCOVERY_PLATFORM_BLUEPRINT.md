# Event Discovery & Advertising Platform Blueprint

## Product Overview

A modular, AI-powered platform that solves the problem of discovering events/places/products in cities, with an integrated advertising system for local businesses. Built to be maintainable while working full-time, focusing on speed and iteration.

---

## Core Problem Statement

**User's Problem:**
- "I don't know what's happening next week Friday in the city I'm in"
- Information is scattered across Instagram, Twitter, websites
- Data is stale on Google search
- Too community-based (need to know people hosting things)
- No centralized directory of events happening Thursday/Friday/Saturday/Sunday

**Business Problem (Restaurants/Venues):**
- They hire people for Instagram ads, those people leave, they're stuck
- They don't care about Instagram - they care about running the restaurant
- Process isn't automated
- No SEO - AI agents can't find them (ChatGPT web search won't show them)
- Need simple way to run promotions without technical knowledge

---

## Product Architecture (Modular Design)

### Module 1: Event Discovery Platform (RAG-Based)

**Purpose:** Centralized directory of events happening in cities

**User-Facing Side:**
- RAG (Retrieval Augmented Generation) system for event search
- Users query: "What's happening Friday in Sandton?"
- Returns personalized event recommendations based on user profile

**Input Side (Automated):**
- Scheduled scraper that runs on server
- Scrapes events from multiple sources:
  - Instagram
  - Twitter/X
  - Event websites (Howl, etc.)
  - Other accumulated sources over time
- Populates calendar with events happening Thursday/Friday/Saturday/Sunday

**Data Flow:**
1. Scraper runs on schedule (Monday/Tuesday/Wednesday)
2. Events scraped → Stored in in-memory database
3. User reviews/approves events before they go live
4. Approved events → Production database (searchable via RAG)
5. Users search → RAG system retrieves relevant events

**Key Features:**
- Pre-populated events (fake critical mass)
- Real events with links to original sources
- Personalized recommendations based on user profile (introverted/extroverted, preferences)
- Multi-city support (works in any city)

**Tech Stack:**
- RAG system for search
- Scheduled scraping jobs
- In-memory → Production database pipeline
- User approval workflow

---

### Module 2: Advertising Platform (AI-Powered Landing Page Generator)

**Purpose:** Help restaurants/venues create SEO-optimized landing pages and run ads autonomously

**Core Value Proposition:**
- "I'll speak to you, record the conversation, send it to my coding agent, and by the time I get home, you'll have a landing page"

**Workflow:**
1. **Discovery:** Walk place-to-place, get business cards, understand their problems
2. **Consultation:** Record conversation with business owner
3. **AI Processing:** Send recording to coding agent
4. **Generation:** Agent creates:
   - SEO-optimized landing page (separate deployment, not tied to app)
   - Instagram ad creative
   - Google ad creative
   - Chat GPT search-ready content
5. **Delivery:** Send link within 12 hours
6. **Subscription:** $100/month for ongoing ad management

**Key Features:**

**Natural Language Promo Creation:**
- Business owner: "I want to run a promo on burgers every Wednesday 6pm-7pm"
- AI agent generates:
  - Landing page with SEO
  - Ad copy
  - Creative assets
  - Meta/Google ad setup

**Template System:**
- Website builder with templates
- Business picks template
- AI fills in copy/assets
- Recommendations: "This is what works for other burger joints in the area"

**Ad Copy Intelligence:**
- Scrapes Google Ads and Meta Ads platforms
- Uses search engine autocomplete (like when typing "mimosas" → "mimosas special Tuesday Thursday")
- Generates proven ad copy automatically

**SEO & AI Search Optimization:**
- Landing pages optimized for:
  - Google search ("things to do in Sandton Friday")
  - ChatGPT web search
  - AI agent discovery
- Makes businesses discoverable by AI agents

**Autonomous Ad Management:**
- Subscription includes:
  - Landing page hosting
  - Instagram ad management
  - Google ad management
  - Ongoing optimization

**Value Metrics:**
- "You got 3,000 views from Google, 2,100 from Instagram, 5,100 from me"
- "Without me, you have -5,100 eyes that know about what you're doing"
- Trackable attribution

**Tech Stack:**
- AI coding agent (for landing page generation)
- Voice recording → Text transcription
- Template system
- SEO optimization
- Meta Ads API integration
- Google Ads API integration
- Ad copy scraping/intelligence

---

### Module 3: Chatbot Interface

**Purpose:** Conversational interface for event discovery

**User Flow:**
1. User: "What's there to do today?"
2. Bot: "Where are you?"
3. User: "I'm in London"
4. Bot: Returns events happening in London
5. Bot: "What do you feel like doing? Restaurant? After-hours party?"

**Features:**
- Natural language queries
- Location-aware
- Preference-based recommendations
- Falls back gracefully: "Try again tomorrow, nothing on our radar"

**Integration:**
- Connects to Event Discovery Platform (Module 1)
- Uses RAG system for retrieval

---

## Monetization Strategy

### Primary Revenue: Advertising Platform Subscriptions

**Pricing:** ~$100/month per business

**Value Proposition:**
- Automated ad creation and management
- SEO-optimized landing pages
- AI search visibility
- Trackable results
- No technical knowledge required

**Sales Process:**
1. In-person consultation (record conversation)
2. Deliver landing page within 12 hours
3. Show results: "You got X views from me"
4. Convert to subscription

**Churn Management:**
- "If you don't pay next month, fine, I'll find another client"
- Low maintenance model
- Focus on value delivery, not retention pressure

### Secondary Revenue: Event Discovery Platform

**Future Potential:**
- Event organizer listings
- Premium features
- API access for other platforms 

---

## Go-to-Market Strategy

### Phase 1: Fake Critical Mass (Event Discovery)

**Problem:** Two-sided marketplace needs both sides

**Solution:** Scrape events to populate platform
- Scrape from Instagram, Twitter, event sites
- Pre-populate calendar
- Users find events → Value delivered
- Once users exist → Can approach event organizers

**Timeline:** 
- Scrape Monday-Wednesday
- Review/approve events
- Deploy Thursday-Sunday events

### Phase 2: Build User Base

**Target:** 1,000 users

**Approach:**
- "Download this app if you want to find out what's happening on the weekend"
- Pre-populated events provide immediate value
- RAG system provides personalized recommendations

### Phase 3: Approach Event Organizers

**Pitch:**
- "I have 1,000 users"
- "Here's demographic data"
- "Here's what they're interested in"
- "Start listing your events on this thing"

**Value Exchange:**
- Organizers get visibility
- Platform gets legitimate listings
- Teeter-totter effect (users ↔ organizers)

### Phase 4: Launch Advertising Platform

**Target:** Restaurants/Venues

**Approach:**
- Walk place-to-place
- Get business cards
- Understand their problems
- Record conversations
- Deliver landing pages within 12 hours
- Convert to subscriptions

**Key Insight:** Focus on businesses with:
- Shit websites
- No SEO
- No meaningful data for AI agents to scrape
- Need for simple promo management

---

## Technical Architecture

### Modular Design Philosophy

**Why Modular?**
- Easy to maintain while working full-time
- Can focus on one module at a time
- Plug-and-play integration
- Low maintenance overhead

**Module Independence:**
- Event Discovery Platform: Standalone
- Advertising Platform: Standalone (separate deployment)
- Chatbot: Can integrate with Event Discovery
- Each module maintained separately

### Tech Stack (Inferred)

**Event Discovery:**
- RAG system (vector database + LLM)
- Web scraping (scheduled jobs)
- Database (in-memory → production)
- API for event queries

**Advertising Platform:**
- AI coding agent (for landing page generation)
- Template system
- SEO optimization
- Meta Ads API
- Google Ads API
- Ad copy intelligence/scraping

**Chatbot:**
- Conversational AI
- RAG integration
- Location services
- Preference engine

**Infrastructure:**
- Server deployment
- Scheduled jobs (cron/equivalent)
- Database management
- API endpoints

---

## Key Differentiators

### 1. Speed & Iteration

**Value:** "We chatted 12 hours ago, how did you make this already?"

**How:**
- Record conversation → AI agent → Deploy
- 12-hour turnaround for landing pages
- Rapid iteration based on feedback

### 2. AI Search Optimization

**Value:** Makes businesses discoverable by AI agents (ChatGPT, etc.)

**How:**
- SEO-optimized landing pages
- Structured data
- AI agent-friendly content
- Future-proof for AI search

### 3. Autonomous Operation

**Value:** Businesses don't need to manage ads/landing pages

**How:**
- Subscription model
- Automated ad creation
- Automated ad management
- Ongoing optimization

### 4. Modular & Maintainable

**Value:** Can maintain while working full-time

**How:**
- Separate modules
- Low maintenance overhead
- Focus on value delivery
- Sustainable operation

---

## Success Metrics

### Event Discovery Platform

- Number of events scraped per week
- Number of users
- Search queries per day
- Event organizer signups

### Advertising Platform

- Number of consultations
- Landing pages created
- Subscription conversions
- Monthly recurring revenue
- Views/clicks generated for clients
- Client retention

### Overall

- Time to deliver landing page (< 12 hours)
- Client satisfaction
- Platform maintainability (hours/week)
- Revenue per client

---

## Lessons Learned (From Previous Project)

### What Went Wrong Before

1. **Tried to do everything at once**
   - Advertising platform
   - Place discovery
   - Ticket marketplace
   - Too many features

2. **Understaffed**
   - One person doing front-end
   - One person doing model development
   - No coordination

3. **Never deployed iteratively**
   - Released demo, then tried to "eat the elephant all at once"
   - Lost momentum
   - Never iterated

4. **Too much planning, not enough execution**
   - Meditated on how merchants would use it
   - Planned ticket deployment
   - Never actually deployed

### What's Different Now

1. **Modular approach**
   - Focus on one module at a time
   - Deploy iteratively
   - Maintain sustainably

2. **Fake critical mass**
   - Scrape events to populate platform
   - Pre-populate before users arrive
   - Solve chicken-and-egg problem

3. **Speed & iteration**
   - 12-hour turnaround
   - Rapid feedback loops
   - Focus on execution, not planning

4. **Do things that don't scale**
   - Walk place-to-place
   - Record conversations
   - Personal touch
   - Build relationships

5. **Focus on one problem**
   - Advertising platform is the core
   - Event discovery supports it
   - Don't try to solve everything

---

## Integration Opportunities

### With Blom (Event Matching Platform)

**Synergy:**
- Blom has people database (100K users)
- This platform has places/events database
- Can share data via API
- "Ship some places and things happening to Blom"

**Value:**
- Blom gets event data
- This platform gets user base
- Both benefit from network effects

---

## Development Timeline

### Current Status

- Architecture designed
- Tech stack decided
- Modules planned
- Starting development during break
- **Not planning to release until end of year**

### Development Approach

**Focus:** Maximize value, minimize maintenance

**Strategy:**
- Build modules independently
- Deploy iteratively
- Test with real users early
- Iterate based on feedback

**Maintenance Goal:** Sustainable while working full-time

---

## Key Insights

### 1. Speed is Everything

- 12-hour turnaround creates "wow" factor
- Rapid iteration builds trust
- Execution > Planning

### 2. Fake Critical Mass

- Scrape events to populate platform
- Pre-populate before users arrive
- Solve two-sided marketplace problem

### 3. Focus on One Problem

- Advertising platform is core
- Everything else supports it
- Don't try to solve everything

### 4. Modular = Maintainable

- Separate modules
- Low maintenance overhead
- Can maintain while working full-time

### 5. AI Search is the Future

- Optimize for ChatGPT web search
- Make businesses discoverable by AI agents
- Future-proof for AI-first search

### 6. Do Things That Don't Scale

- Walk place-to-place
- Record conversations
- Personal touch
- Build relationships early

---

## Product Vision

**Short-term:** Help restaurants/venues get discovered through AI-powered landing pages and ads

**Long-term:** Become the platform that connects people with places, products, and events in cities, optimized for AI search and discovery

**Ultimate Goal:** Make it easy for anyone to find what's happening in their city, and easy for businesses to get discovered without technical knowledge

