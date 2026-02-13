# ThreadBeef — Implementation Plan

> **Version:** 1.0 | **Last Updated:** 2026-02-11
> **Design Reference:** `docs/mockup.html`
> **Product Spec:** `threadbeef-claude-code-prompt-v2.md`

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Technical Architecture](#2-technical-architecture)
3. [Design System](#3-design-system)
4. [Product Requirements](#4-product-requirements)
5. [Database Schema](#5-database-schema)
6. [API Contracts](#6-api-contracts)
7. [Random Selection Algorithm](#7-random-selection-algorithm)
8. [Content Pipeline](#8-content-pipeline)
9. [Content Moderation & Legal](#9-content-moderation--legal)
10. [Virality & Growth Mechanics](#10-virality--growth-mechanics)
11. [Folder Structure](#11-folder-structure)
12. [Build Phases](#12-build-phases)
13. [Verification Criteria](#13-verification-criteria)

---

## 1. Project Overview

**ThreadBeef** surfaces random internet arguments from across platforms (Reddit, Twitter/X, HackerNews, YouTube) and lets users read them, vote on a winner, react, share, and browse by category. Think **TikTok's UX applied to internet arguments** — one beef at a time, vertical, swipeable, cross-platform, with community voting and lightweight social mechanics.

**Core loop:** Land → Read argument → Vote → See verdict → Next Beef → Share

**Brand identity:** Dark, slightly irreverent, fun, internet-native, addictive. The 🥩 emoji is the mascot. The tone is "your funniest friend showing you a screenshot of two strangers fighting about nothing."

---

## 2. Technical Architecture

### Stack

| Layer | Choice | Justification |
|-------|--------|---------------|
| **Framework** | Next.js 14+ (App Router) | SSR for SEO (permalink/category pages), API routes colocated, React Server Components, excellent Vercel integration |
| **Language** | TypeScript | Type safety across full stack, Zod schema validation |
| **Styling** | Tailwind CSS | Rapid dark-theme development, design token mapping from mockup, responsive utilities |
| **Animations** | Framer Motion | Declarative animation API, gesture support (swipe), layout animations, stagger effects |
| **ORM** | Drizzle ORM | Type-safe, lightweight, SQL-first (no magic), excellent Postgres support, fast migrations |
| **Database** | Neon Postgres | Serverless Postgres (scales to zero), branching for dev/staging, HTTP driver for edge |
| **Cache/Queue** | Upstash Redis | Serverless Redis (HTTP-based), rate limiting (@upstash/ratelimit), random pool, BOTD state |
| **OG Images** | @vercel/og (Satori) | Dynamic social card generation at the edge, JSX-based templates |
| **Sound** | Howler.js | Simple, reliable audio playback, sprite support, mobile-friendly |
| **Validation** | Zod | Runtime type validation for API inputs, schema-first design |
| **Deployment** | Vercel | Zero-config Next.js deployment, edge functions, automatic preview deploys |

### Infrastructure

```
┌─────────────┐     ┌──────────────┐     ┌──────────────┐
│   Vercel     │────▶│ Neon Postgres│     │ Upstash Redis│
│  (Next.js)   │     │  (primary)   │     │  (cache/RL)  │
│              │────▶│              │     │              │
│  Edge + Node │     └──────────────┘     └──────────────┘
└─────────────┘
       │
       ▼
┌──────────────┐
│  @vercel/og  │
│  (OG images) │
└──────────────┘
```

### Environment Variables

```env
DATABASE_URL=postgresql://...          # Neon Postgres connection
UPSTASH_REDIS_REST_URL=https://...     # Upstash Redis endpoint
UPSTASH_REDIS_REST_TOKEN=...           # Upstash Redis auth
ANTHROPIC_API_KEY=sk-ant-...           # Claude API (content pipeline)
NEXT_PUBLIC_BASE_URL=https://...       # App base URL
```

---

## 3. Design System

### Design Tokens (from mockup)

```css
--bg: #0a0a0c            /* Page background */
--surface: #131318        /* Card background */
--surface-2: #1a1a22      /* Elevated surfaces (thread header, vote panel) */
--border: #2a2a35         /* All borders */
--text: #e8e6f0           /* Primary text */
--text-muted: #7a7890     /* Secondary text, timestamps */
--accent: #ff4d4d         /* Brand red — buttons, active states, "Beef" in logo */
--accent-glow: rgba(255, 77, 77, 0.15)  /* Button shadows */
--blue: #4d9fff           /* Links, info */
--blue-glow: rgba(77, 159, 255, 0.15)
--green: #34d399          /* Positive scores */
--yellow: #fbbf24         /* Topic tags */
--user-a: #ff6b6b         /* Red team user (color + avatar bg) */
--user-b: #6ba3ff         /* Blue team user (color + avatar bg) */
--radius: 12px            /* Default border radius */
```

All tokens are mapped in `tailwind.config.ts` and available as CSS variables in `globals.css`.

### Typography

| Font | Usage | CSS Class |
|------|-------|-----------|
| **Space Mono** (monospace) | Scores, beef numbers (#00247), stats, keyboard shortcuts | `font-mono` |
| **Syne** (display) | Logo, thread titles, vote labels, verdict labels, "Next Beef" button, headings | `font-display` |
| **DM Sans** (body) | Message text, UI text, descriptions, nav links | `font-body` |

Loaded via `next/font/google` in `layout.tsx` as CSS variables (`--font-body`, `--font-display`, `--font-mono`).

### Component Patterns (from mockup)

**Navbar** — Sticky `top: 0`, `backdrop-filter: blur(20px)`, semi-transparent bg. Logo: "Thread" white + "Beef" accent red + 🥩 with `sizzle` animation (rotate -5°→+5° at 2s). Nav links: muted text, accent on active. Pill button for Sign in.

**Filter Chips** — Horizontally scrollable flex row. Pill shape (`border-radius: 100px`). Default: `border: 1px solid var(--border)`, transparent bg. Active: `background: var(--accent)`, white text. Mutual exclusion on click.

**Platform Badge** — Pill with colored dot (8px circle) + source text. Dot color varies: Reddit `#ff4500`, Twitter `#1da1f2`, HN `#ff6600`, YouTube `#ff0000`.

**Topic Tag** — Yellow-tinted pill: `background: rgba(251, 191, 36, 0.1)`, `color: var(--yellow)`, uppercase, small text.

**Argument Card** — `border-radius: 16px`, surface background, 1px border. Contains:
- Thread header (surface-2 bg, border-bottom)
- Thread title (Syne 700)
- Thread subtitle (muted, context)
- Message list with staggered fade-in

**Messages** — Each message: padding 16px 24px, border-bottom. Header row: avatar (28px circle, letter initial, color-coded), username (color-coded), timestamp (muted), score badge (mono font, green/red bg tint). Body: 0.92rem, line-height 1.65, 38px left padding (aligns with avatar). Quote blocks: left border 3px, muted text, subtle bg.

**Vote Panel** — Two side-by-side buttons in surface-2 bg. Each: flex column, centered, "🏆 [Name]" + "won this argument". Hover: subtle bg lift + colored underline bar at bottom (red for A, blue for B).

**Vote Results** — Animated horizontal bar (elastic easing: `cubic-bezier(0.22, 1, 0.36, 1)`, 1s duration). Two segments (red gradient for A, blue gradient for B). Percentage labels centered in each. Total count below.

**Action Bar** — Centered flex. Primary: "Next Beef →" accent pill (Syne 700, 1.1rem). Secondary: share + report icon buttons (surface-2 bg, border).

**Stats Bar** — Centered flex with gap-32px. Each stat: mono number (1.3rem 700) + uppercase muted label (0.72rem).

**Loading Overlay** — Absolute positioned, blur backdrop (4px), dark overlay. Centered spinner (32px, border-top accent, 0.8s spin).

**Grain Overlay** — `body::after` fixed fullscreen, fractal noise SVG at 4% opacity, `pointer-events: none`, z-index 9999.

### Animations

| Name | Effect | Duration |
|------|--------|----------|
| `fadeInUp` | opacity 0→1, translateY 20→0 | 0.6s ease |
| `fadeInDown` | opacity 0→1, translateY -10→0 | 0.5s ease |
| `fadeIn` | opacity 0→1 | 0.4s ease |
| `slideIn` | opacity 0→1, translateX -20→0 | 0.4s ease |
| `sizzle` | rotate -5°→+5°, scale 1→1.1 | 2s ease-in-out infinite |
| `spin` | rotate 0→360° | 0.8s linear infinite |
| Message stagger | Each message delays 0.1s × index | 0.1s increments |

### Responsive Design

Mobile breakpoint at **600px**:
- Nav: reduced padding (12px 16px), smaller logo (1.2rem), tighter link gaps
- Container: padding 24px 12px
- Message body: remove left indent, add top margin
- Next button: smaller padding + font
- Stats bar: tighter gaps
- Argument meta: stack vertically

---

## 4. Product Requirements

### 4.1 The Argument Viewer (Primary Experience)

The landing page IS a random argument. No splash screen, no sign-up wall, no explanation.

**Display per argument:**
- Platform source badge (colored dot + subreddit/source)
- Topic category tag (yellow pill, uppercase)
- Heat rating (🌶️ × 1-5, visually prominent)
- Topic drift subtitle: *"Started about: X → Ended about: Y"*
- Context blurb (original thread title/context)
- Messages: avatar, anonymized username (color-coded A=red, B=blue), relative timestamp, platform score, body text, quoted text blocks
- Each message fades in with 0.1s stagger

**Navigation:**
- "Next Beef →" button loads new random argument with loading transition
- Swipe up on mobile advances to next (threshold: 80px vertical)
- Keyboard: `Space` = next, `1` = vote A, `2` = vote B, `S` = share

**Mobile-first:** Primary experience is phone. Desktop is secondary.

### 4.2 Voting System ("Who Won?")

- Vote panel: two side-by-side buttons ("🏆 [UserA] won" / "🏆 [UserB] won")
- One vote per argument (deduplicated by browser fingerprint for anonymous, user_id for logged-in)
- After voting: hide vote panel → show animated results bar (elastic easing, 1s fill) → show verdict label
- Sound effect: gavel bang on results reveal (if sound enabled)

**Verdict labels** (based on winning percentage):

| Threshold | Label | Emoji |
|-----------|-------|-------|
| >95% one side | UNANIMOUS BEATDOWN | 💀 |
| 85-95% | FLAWLESS VICTORY | 🏆 |
| 70-85% | CLEAR WINNER | ✅ |
| 55-70% | SPLIT DECISION | ⚖️ |
| 45-55% | CONTROVERSIAL BEEF | 🔥 |

Verdicts are large, bold (Syne font), animated entrance (slam with overshoot). Designed to be screenshotted.

### 4.3 Reaction System

Six quick-tap reactions displayed after voting:

| Type | Emoji | Label |
|------|-------|-------|
| `dead` | 💀 | I'm Dead |
| `both_wrong` | 🤡 | Both Wrong |
| `actually` | 📐 | Actually... |
| `peak_internet` | 🍿 | Peak Internet |
| `spicier` | 🌶️ | Spicier Than Rated |
| `hof_material` | 🏆 | Hall of Fame Material |

- Top 2-3 reactions shown as small badges on argument card
- One tap, no login, rate-limited per fingerprint
- Reaction data helps surface best content (high 💀 + 🍿 = Hall of Fame candidate)

### 4.4 Categories & Filtering

14 categories, each with emoji, label, tagline, and SEO-optimized landing page:

| Slug | Emoji | Label | Tagline |
|------|-------|-------|---------|
| `petty` | 🔥 | Petty | Arguments that should never have happened, and yet here we are. |
| `tech` | 💻 | Tech | Tabs vs spaces was just the beginning. |
| `food_takes` | 🍕 | Food Takes | Wars fought over seasoning, sauce, and whether a hot dog is a sandwich. |
| `unhinged` | 💀 | Unhinged | Someone called the cops over this. Metaphorically. |
| `relationship` | ❤️ | Relationship | Love is a battlefield. This is the battlefield. |
| `gaming` | 🎮 | Gaming | Console wars, difficulty debates, and main character discourse. |
| `sports` | 🏈 | Sports | Hot takes so bad they'd get you booed out of the stadium. |
| `politics` | 🏛️ | Politics | Left, right, and completely unhinged. |
| `aita` | ⚖️ | AITA | The internet's favorite moral courtroom. |
| `pedantic` | 🤓 | Pedantic | Actually, you'll find that... |
| `movies_tv` | 🎬 | Movies/TV | Plot holes, hot takes, and fandom fury. |
| `music` | 🎵 | Music | Genre wars and guilty pleasures. |
| `philosophy` | 🧠 | Philosophy | Is a hotdog a sandwich? Is cereal a soup? Is this even real? |
| `money` | 💰 | Money | Tipping debates, rent splits, and financial hot takes. |

Filter chips on the main viewer allow category switching. "All" is default.

### 4.5 Hall of Fame

Leaderboard page with 6 sections:

| Section | Sort Criteria |
|---------|---------------|
| Most Voted | Highest `total_votes` |
| Biggest Beatdowns | Most lopsided results (max(votes_a, votes_b) / total > 0.90, min total 50) |
| Most Controversial | Closest to 50/50 split (min total 50) |
| Most Reacted | Highest sum of all reaction counts |
| Staff Picks | Editorially curated (`staff_pick` flag) |
| Rising | Recent arguments (< 7 days) with fastest vote accumulation |

Each entry: preview snippet (first message from each side), vote stats, verdict, heat, category, top reactions.

### 4.6 Beef of the Day (BOTD)

- One featured argument per day (editorial or algorithmic: highest entertainment score among recent additions)
- Prominent placement at top with countdown timer to next BOTD
- Live-updating vote bar throughout the day
- Results announced at midnight ET
- Archived in "Beef Replay" (browsable history, SEO-indexed)
- Anchor for streaks and push notifications

### 4.7 Streaks & Light Gamification

**Streak counter:** "You've judged beef X days in a row 🔥" — tied to BOTD voting.
**Milestones:** 7, 30, 100 days → badge + confetti animation.

**Judgment stats page** (after 10+ votes, Spotify Wrapped style):
- "You sided with the underdog 73% of the time"
- "You agree with the crowd 61% of the time"
- "You're a Food Takes specialist"
- "Your most controversial vote: #00247"
- "Your judgment alignment: Merciful / Ruthless / Chaotic"

**Titles earned through participation:**

| Votes | Title |
|-------|-------|
| 10 | Beef Taster |
| 50 | Beef Connoisseur |
| 200 | Certified Beef Inspector 🥩 |
| 500 | Chief Justice of the Internet |
| 1000 | Professional Hater |

### 4.8 Sound Design & Micro-interactions

- **Sizzle** when "Next Beef" tapped
- **Gavel bang** on vote results reveal
- **Crowd gasp** on UNANIMOUS BEATDOWN verdicts
- All sounds **OFF by default** with visible toggle
- Haptic feedback on mobile vote cast (if PWA supports)

Micro-animations:
- Vote bar: elastic spring fill
- Verdict label: slam-in with overshoot
- Heat peppers: sequential pop-in
- Messages: staggered fade-in (typing rhythm)
- Next beef: slide-out → slide-in
- Confetti on streak milestones

### 4.9 Sharing System

**Permalink:** `threadbeef.com/beef/00247`

**OG Share Card** (auto-generated via @vercel/og):
- ThreadBeef branding + 🥩
- Argument title / topic
- Heat rating peppers
- Zinger quote from each side (one line each)
- Verdict label + vote split (if voted)
- Topic drift line
- Instantly recognizable visual style

**Share button options:**
- Copy link
- Share to Twitter (pre-filled text)
- Native share sheet (mobile)
- Download image (the OG card)

**Challenge a Friend:**
1. User votes → taps "Challenge a Friend"
2. Gets unique challenge link (`threadbeef.com/challenge/xK9mQ`)
3. Sends to friend
4. Friend opens, sees argument, votes
5. Reveal: "You and [friend] AGREED ✅" or "You and [friend] are BEEFING 🥩💥"

Each challenge link is a user acquisition opportunity.

### 4.10 User Accounts (v1.1 — schema now, implementation later)

Auth: Google / GitHub / Apple / email magic link.
Tracks: voting history, streaks, judgment stats, saved beefs, titles earned.
Settings: sound toggle, notification prefs, category preferences.
Profile page with shareable stats.

### 4.11 Submission Pipeline

- "Submit a Beef" page: paste URL or manual entry
- System auto-parses argument from URL (extract 2-person back-and-forth)
- Fallback: manual entry form
- Submissions → moderation queue → review before going live
- Submitter credit: "Submitted by [username]" badge
- Prompt submission after 5+ votes

### 4.12 Notifications (PWA Web Push)

- Beef of the Day alert: "Today's Beef is HEATED 🌶️🌶️🌶️🌶️🌶️"
- Streak reminder: "Your 12-day streak is about to expire!"
- Challenge received: "[Friend] challenged you"
- BOTD results: "Yesterday's verdict is in: UNANIMOUS BEATDOWN"
- Max 1/day (except friend challenges)
- All opt-in, easy disable

### 4.13 PWA / Installable Web App

- Full PWA manifest: app name, icons (192 + 512), theme color `#0a0a0c`, standalone display
- "Add to Home Screen" prompt after 3+ visits
- Offline support for previously loaded arguments (stretch)
- No browser chrome when installed

---

## 5. Database Schema

### Enums

```sql
platform:           reddit | twitter | hackernews | youtube | stackoverflow | forum | user_submitted
category:           petty | tech | food_takes | unhinged | relationship | gaming | sports | politics | aita | pedantic | movies_tv | music | philosophy | money
argument_status:    pending_review | approved | rejected | reported | archived
reaction_type:      dead | both_wrong | actually | peak_internet | spicier | hof_material
vote_side:          a | b
submission_status:  pending | processing | approved | rejected
challenge_status:   pending | completed
auth_provider:      google | github | apple | email
```

### Tables

#### `arguments`

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | UUID | PK, default random |
| `beef_number` | SERIAL | NOT NULL, UNIQUE |
| `platform` | platform enum | NOT NULL |
| `platform_source` | TEXT | NOT NULL (e.g. "r/cooking") |
| `original_url` | TEXT | nullable, internal only |
| `title` | TEXT | NOT NULL |
| `context_blurb` | TEXT | nullable, LLM-generated |
| `topic_drift` | TEXT | nullable, "Started about X → Ended about Y" |
| `category` | category enum | NOT NULL |
| `heat_rating` | INTEGER | NOT NULL, default 1, range 1-5 |
| `user_a_display_name` | TEXT | NOT NULL, anonymized |
| `user_b_display_name` | TEXT | NOT NULL, anonymized |
| `user_a_zinger` | TEXT | nullable, best line for share card |
| `user_b_zinger` | TEXT | nullable, best line for share card |
| `messages` | JSON | NOT NULL, array of `{author, body, timestamp, score, quoted_text}` |
| `entertainment_score` | REAL | nullable, LLM score 1-10 |
| `status` | argument_status enum | NOT NULL, default "pending_review" |
| `total_votes` | INTEGER | NOT NULL, default 0 |
| `votes_a` | INTEGER | NOT NULL, default 0 |
| `votes_b` | INTEGER | NOT NULL, default 0 |
| `reactions` | JSON | NOT NULL, default `{dead:0, both_wrong:0, actually:0, peak_internet:0, spicier:0, hof_material:0}` |
| `view_count` | INTEGER | NOT NULL, default 0 |
| `share_count` | INTEGER | NOT NULL, default 0 |
| `created_at` | TIMESTAMP | NOT NULL, default now |
| `updated_at` | TIMESTAMP | NOT NULL, default now |

**Indexes:** `status`, `category`, `beef_number` (unique), `entertainment_score`, `total_votes`, `created_at`

#### `votes`

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | UUID | PK |
| `argument_id` | UUID | FK → arguments, CASCADE |
| `user_id` | UUID | FK → users, nullable, SET NULL |
| `fingerprint` | TEXT | NOT NULL, hashed |
| `voted_for` | vote_side enum | NOT NULL |
| `created_at` | TIMESTAMP | NOT NULL, default now |

**Indexes:** `argument_id`, UNIQUE on `(argument_id, fingerprint)`

#### `reactions`

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | UUID | PK |
| `argument_id` | UUID | FK → arguments, CASCADE |
| `reaction_type` | reaction_type enum | NOT NULL |
| `fingerprint` | TEXT | NOT NULL |
| `user_id` | UUID | FK → users, nullable |
| `created_at` | TIMESTAMP | NOT NULL, default now |

**Indexes:** `argument_id`, UNIQUE on `(argument_id, fingerprint, reaction_type)`

#### `submissions`

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | UUID | PK |
| `submitted_by` | UUID | FK → users, nullable |
| `url` | TEXT | nullable |
| `raw_text` | TEXT | nullable |
| `status` | submission_status enum | NOT NULL, default "pending" |
| `reviewer_notes` | TEXT | nullable |
| `argument_id` | UUID | FK → arguments, nullable |
| `created_at` | TIMESTAMP | NOT NULL, default now |

**Indexes:** `status`

#### `challenges`

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | UUID | PK |
| `challenge_code` | TEXT | NOT NULL, UNIQUE |
| `argument_id` | UUID | FK → arguments, CASCADE |
| `challenger_user_id` | UUID | FK → users, nullable |
| `challenger_fingerprint` | TEXT | NOT NULL |
| `challenger_vote` | vote_side enum | NOT NULL |
| `challengee_vote` | vote_side enum | nullable |
| `status` | challenge_status enum | NOT NULL, default "pending" |
| `created_at` | TIMESTAMP | NOT NULL, default now |
| `completed_at` | TIMESTAMP | nullable |

**Indexes:** `challenge_code` (unique)

#### `users` (v1.1 — schema ready)

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | UUID | PK |
| `email` | TEXT | NOT NULL, UNIQUE |
| `display_name` | TEXT | nullable |
| `auth_provider` | auth_provider enum | NOT NULL |
| `title` | TEXT | nullable, earned rank |
| `total_votes_cast` | INTEGER | NOT NULL, default 0 |
| `current_streak` | INTEGER | NOT NULL, default 0 |
| `longest_streak` | INTEGER | NOT NULL, default 0 |
| `last_vote_date` | DATE | nullable |
| `stats` | JSON | nullable, `{categoryPreferences, alignmentScore, underdogPercentage, crowdAgreement}` |
| `created_at` | TIMESTAMP | NOT NULL, default now |

**Indexes:** `email` (unique)

#### `beef_of_the_day`

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | UUID | PK |
| `argument_id` | UUID | FK → arguments, CASCADE |
| `date` | DATE | NOT NULL, UNIQUE |
| `final_votes_a` | INTEGER | nullable |
| `final_votes_b` | INTEGER | nullable |
| `final_verdict` | TEXT | nullable |
| `created_at` | TIMESTAMP | NOT NULL, default now |

**Indexes:** `date` (unique)

Full Drizzle definitions: `src/lib/db/schema.ts`

---

## 6. API Contracts

### Arguments

#### `GET /api/beef/random`

Fetch a random approved argument.

**Query params:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `category` | string | `"all"` | Category slug or "all" |
| `exclude` | string | `""` | Comma-separated beef numbers to exclude |

**Response (200):**
```json
{
  "argument": {
    "id": "uuid",
    "beefNumber": 247,
    "platform": "reddit",
    "platformSource": "r/cooking",
    "title": "Is it acceptable to break spaghetti before putting it in the pot?",
    "contextBlurb": "Two users debate whether breaking spaghetti is acceptable",
    "topicDrift": "Started about: pasta cooking technique → Ended about: the fundamental nature of gatekeeping",
    "category": "food_takes",
    "heatRating": 3,
    "userADisplayName": "PastaPurist99",
    "userBDisplayName": "NoodleRealist",
    "userAZinger": "You came to a COOKING SUBREDDIT to tell people that cooking technique doesn't matter.",
    "userBZinger": "I'll snap my spaghetti in half right in front of you and there's nothing you can do about it.",
    "messages": [
      { "author": "a", "body": "...", "timestamp": "8mo ago", "score": 342, "quoted_text": null },
      { "author": "b", "body": "...", "timestamp": "8mo ago", "score": -89, "quoted_text": null }
    ],
    "totalVotes": 2847,
    "votesA": 2078,
    "votesB": 769,
    "reactions": { "dead": 412, "both_wrong": 89, "actually": 23, "peak_internet": 267, "spicier": 45, "hof_material": 156 },
    "viewCount": 15234,
    "shareCount": 891,
    "createdAt": "2025-06-15T..."
  }
}
```

**Errors:** `500` if pool empty

---

#### `GET /api/beef/:beefNumber`

Fetch a specific argument by public beef number.

**Response (200):** Same shape as random.
**Errors:** `404` if not found or not approved.

---

#### `GET /api/beef/today`

Get today's Beef of the Day with live vote counts.

**Response (200):**
```json
{
  "argument": { /* same shape */ },
  "date": "2026-02-11",
  "countdown": 43200
}
```

`countdown` is seconds until next BOTD.

---

### Voting

#### `POST /api/beef/:beefNumber/vote`

**Body:**
```json
{
  "side": "a",
  "fingerprint": "sha256hash..."
}
```

**Response (200):**
```json
{
  "success": true,
  "results": {
    "totalVotes": 2848,
    "votesA": 2079,
    "votesB": 769,
    "percentA": 73,
    "percentB": 27,
    "verdict": "CLEAR WINNER"
  }
}
```

**Errors:** `409` if already voted (duplicate fingerprint), `404` if beef not found, `429` if rate limited.

---

#### `GET /api/beef/:beefNumber/results`

**Response (200):** Same `results` shape as vote response.

---

### Reactions

#### `POST /api/beef/:beefNumber/react`

**Body:**
```json
{
  "type": "dead",
  "fingerprint": "sha256hash..."
}
```

**Response (200):**
```json
{
  "success": true,
  "reactions": { "dead": 413, "both_wrong": 89, "actually": 23, "peak_internet": 267, "spicier": 45, "hof_material": 156 }
}
```

**Errors:** `409` if already reacted with this type, `429` if rate limited.

---

### Challenges

#### `POST /api/challenge/create`

**Body:**
```json
{
  "beefNumber": 247,
  "vote": "a",
  "fingerprint": "sha256hash..."
}
```

**Response (201):**
```json
{
  "challengeCode": "xK9mQ",
  "shareUrl": "https://threadbeef.com/challenge/xK9mQ"
}
```

---

#### `GET /api/challenge/:code`

Returns the argument without revealing the challenger's vote.

**Response (200):**
```json
{
  "argument": { /* full argument */ },
  "status": "pending"
}
```

---

#### `POST /api/challenge/:code/respond`

**Body:**
```json
{
  "vote": "b",
  "fingerprint": "sha256hash..."
}
```

**Response (200):**
```json
{
  "challengerVote": "a",
  "challengeeVote": "b",
  "agreed": false
}
```

---

### Hall of Fame

#### `GET /api/hall-of-fame`

**Query params:**
| Param | Type | Default |
|-------|------|---------|
| `sort` | `most_voted \| biggest_beatdown \| most_controversial \| most_reacted` | `most_voted` |
| `limit` | number | 50 |
| `offset` | number | 0 |

**Response (200):**
```json
{
  "arguments": [ /* array of argument objects */ ],
  "total": 1234
}
```

---

### Categories

#### `GET /api/categories`

**Response (200):**
```json
{
  "categories": [
    { "slug": "petty", "label": "Petty", "emoji": "🔥", "tagline": "Arguments that should never have happened...", "count": 342 }
  ]
}
```

---

### Submissions

#### `POST /api/submit`

**Body:**
```json
{
  "url": "https://reddit.com/r/cooking/comments/...",
  "rawText": null
}
```

At least one of `url` or `rawText` required.

**Response (201):**
```json
{
  "success": true,
  "submissionId": "uuid"
}
```

**Errors:** `400` if neither provided, `429` if rate limited.

---

## 7. Random Selection Algorithm

**Problem:** `ORDER BY RANDOM()` is slow at scale and gives bad UX (repeats, no variety control).

**Solution:**

1. **Redis precomputed pool:** Maintain a sorted set of approved argument IDs in Redis, refreshed every 15 minutes. Key: `beef:pool:all` and `beef:pool:{category}`.

2. **Exclusion:** Client tracks seen beef numbers in `localStorage` (last 50), sends as `exclude` param. Server filters these from the pool.

3. **Weighting:** Score = `freshness_weight * (1 / days_old) + discovery_weight * (1 / view_count) + quality_weight * entertainment_score`. Higher scores = more likely selected.

4. **Category pools:** When filter is active, select from `beef:pool:{category}`. Pre-warmed on refresh.

5. **Mix enforcement:** In "All" mode, track the last 3 served heat ratings and categories in a short-lived Redis key per fingerprint. Avoid serving 3+ of the same heat rating or category in a row.

6. **BOTD exclusion:** Today's Beef of the Day is removed from the random pool for the day.

---

## 8. Content Pipeline

### Source Platforms (Priority Order)

1. **Reddit** (primary) — Richest structured arguments. Use Reddit API (PRAW for Python scripts). Target subreddits: r/AmItheAsshole, r/unpopularopinion, r/changemyview, r/cooking, r/relationships, r/gaming, r/movies, r/music, r/technology, r/AskReddit, r/mildlyinfuriating.

2. **HackerNews** — Free API (https://github.com/HackerNews/API). Good for tech + pedantic categories.

3. **YouTube** — Data API v3 for comment threads. Free tier generous.

4. **Twitter/X** — Expensive API. v1: user submissions only. v2+: consider browser extension or partnerships.

### Argument Detection Algorithm

**Step 1: Identify candidates**
- Find comment chains with exactly 2 users, 3+ exchanges each (6+ messages total, sweet spot 6-10)
- Filter out chains with 3+ participants

**Step 2: Score "argument-ness" (is it actually an argument?)**
- Sentiment polarity between messages (disagreement detection)
- Confrontational markers: "actually", "wrong", "no", "that's not", "you clearly", "imagine thinking"
- Reply depth (deeper = more committed)
- Vote score disparity (one upvoted, one downvoted)
- Message length (longer = more invested)
- Quoting the other person
- Escalation pattern (intensity increases over time)

**Step 3: Score "entertainment value" (is it FUN?)**
- Absurd/petty topics (food, preferences, semantics)
- Escalation arc (civil → heated)
- Zingers and memorable lines
- Self-contained (no domain expertise needed)
- Sweet spot length (6-10 messages)
- Relatability (topics most people have opinions on)

**Step 4: Calculate heat rating (🌶️ 1-5)**
- 1: Polite disagreement
- 2: Firm pushback
- 3: Getting personal
- 4: Heated, someone is MAD
- 5: Nuclear, someone said something unhinged

Based on: language intensity, caps usage, exclamation marks, insult density, escalation rate.

**Step 5: Filter garbage**
Remove: hate speech, slurs, targeted harassment, no-substance meanness, spam/bots, too short (<4 msgs) or too long (>15 msgs), requires excessive context, sensitive topics (suicide, abuse, self-harm), threats/doxxing.

### LLM Curation Pipeline (Claude API)

Each candidate argument is processed through Claude to:
- Score entertainment value (1-10) — **quality gate: only 7+ makes it live**
- Suggest category
- Flag content policy violations
- Generate topic drift subtitle ("Started about → Ended about")
- Generate 1-sentence context blurb
- Validate heat rating
- Generate themed anonymized usernames (e.g., "PastaPurist99", "NoodleRealist")
- Clean formatting (fix typos, remove platform noise, normalize quotes) while preserving voice
- Extract best zinger from each side (for share cards)

### Anonymization (Non-Negotiable)

- Replace ALL real usernames with generated thematic names
- Strip personally identifiable information from message bodies
- Strip platform noise ("Edit: wow this blew up", karma mentions, award edits)
- Never store real usernames in the public-facing database
- `original_url` is internal reference only, never exposed via API

---

## 9. Content Moderation & Legal

### 3-Layer Moderation

1. **Automated first pass:** Slur detection, toxicity classifier (Perspective API or similar), sensitive topic flagging
2. **LLM second pass:** Entertainment scoring doubles as quality gate — problematic content scores low
3. **Manual review:** All arguments reviewed before going live. User submissions get extra scrutiny.

### Community Reporting

- "Report" button on every argument
- Auto-hide after N reports (e.g., 5)
- Admin review queue

### Legal

- **Anonymization is sacred** — never display real usernames
- **Fair use:** Displaying short excerpts of public content with transformative commentary (voting, reactions, categorization)
- **DMCA compliance:** Implement takedown process (email form), honor all requests promptly
- **Platform ToS:** Document which content came from scraping vs user submissions
- **GDPR:** Anonymization helps. Privacy policy required. Minimal personal data collection.
- **ToS:** User-submitted content, voting, content removal process
- **Cookie consent:** For EU users, consent for tracking cookies (fingerprinting, analytics)

---

## 10. Virality & Growth Mechanics

### Sharing (Primary Growth Vector, ~60% of virality)

OG share cards must look incredible on every platform. Invest heavily in template design. Instantly recognizable at a glance (like Spotify Wrapped or Wordle squares).

Every argument, verdict, stats page, and challenge result generates a unique share card.

### Challenge a Friend (Direct Viral Loop)

Every challenge link sent = potential new user. Recipient must visit ThreadBeef to respond. If experience is good, they stay.

### Judgment Stats (Spotify Wrapped Effect)

Stats page so visually interesting that people screenshot and share. "I'm a Ruthless Certified Beef Inspector who sides with the underdog 78% of the time."

### Content Creator Friendly

Sounds, animations, and verdicts designed for screen recording (TikTok/Reels/Shorts).

### SEO

- Category landing pages with unique personality copy
- Individual permalink pages for every argument (indexable)
- BOTD archive pages
- Best of [Month/Year] compilation pages
- Sitemap, structured data

---

## 11. Folder Structure

```
~/Projects/threadbeef/
├── PLAN.md                                    # This comprehensive implementation plan
├── docs/
│   └── mockup.html                            # HTML/CSS design reference
├── drizzle.config.ts                          # Drizzle Kit configuration (dialect, schema path, output)
├── .env.example                               # Template environment variables
├── next.config.mjs                            # Next.js config (headers, images)
├── tailwind.config.ts                         # Design tokens from mockup, fonts, animations
├── tsconfig.json                              # TypeScript config with @/* path alias
├── postcss.config.js                          # PostCSS with Tailwind + Autoprefixer
├── package.json                               # Dependencies and scripts
│
├── public/
│   ├── manifest.json                          # PWA manifest (standalone, theme color, icons)
│   ├── icons/                                 # PWA icon files (192, 512)
│   └── sounds/                                # Audio files (sizzle.mp3, gavel.mp3, crowd.mp3)
│
└── src/
    ├── app/
    │   ├── layout.tsx                         # Root layout: Google Fonts (DM Sans, Syne, Space Mono), metadata, viewport
    │   ├── page.tsx                           # Landing page → random beef viewer
    │   ├── globals.css                        # CSS reset, dark theme vars, grain overlay, scrollbar, stagger classes
    │   │
    │   ├── beef/[beefNumber]/
    │   │   └── page.tsx                       # Permalink page for specific beef
    │   ├── hall-of-fame/
    │   │   └── page.tsx                       # Leaderboard page (6 sections)
    │   ├── categories/
    │   │   └── page.tsx                       # Category grid overview
    │   ├── categories/[slug]/
    │   │   └── page.tsx                       # Per-category filtered feed
    │   ├── submit/
    │   │   └── page.tsx                       # Submit a Beef form
    │   ├── challenge/[code]/
    │   │   └── page.tsx                       # Challenge response page
    │   │
    │   └── api/
    │       ├── beef/
    │       │   ├── random/route.ts            # GET — random argument (with category/exclude)
    │       │   ├── today/route.ts             # GET — Beef of the Day
    │       │   └── [beefNumber]/
    │       │       ├── route.ts               # GET — specific beef by number
    │       │       ├── vote/route.ts          # POST — cast vote
    │       │       ├── results/route.ts       # GET — vote results
    │       │       └── react/route.ts         # POST — add reaction
    │       ├── challenge/
    │       │   ├── create/route.ts            # POST — create challenge
    │       │   └── [code]/
    │       │       ├── route.ts               # GET — challenge details
    │       │       └── respond/route.ts       # POST — respond to challenge
    │       ├── hall-of-fame/route.ts          # GET — leaderboard data
    │       ├── categories/route.ts            # GET — category list with counts
    │       └── submit/route.ts               # POST — submit argument URL/text
    │
    ├── components/
    │   ├── argument/
    │   │   ├── ArgumentCard.tsx               # Main thread card container
    │   │   ├── MessageBubble.tsx              # Individual message with avatar, score, body
    │   │   ├── VotePanel.tsx                  # Pre-vote side-by-side buttons
    │   │   ├── VoteResults.tsx                # Post-vote animated bar + verdict
    │   │   ├── HeatRating.tsx                 # Chili pepper meter (1-5)
    │   │   ├── PlatformBadge.tsx              # Colored dot + platform source pill
    │   │   └── TopicDrift.tsx                 # "Started about → Ended about"
    │   ├── layout/
    │   │   ├── Navbar.tsx                     # Sticky nav, blur backdrop, sizzle logo
    │   │   └── MobileNav.tsx                  # Bottom tab nav for mobile
    │   ├── ui/
    │   │   ├── FilterChips.tsx                # Category filter pill row
    │   │   ├── NextBeefButton.tsx             # Big accent "Next Beef →" pill
    │   │   ├── ShareButton.tsx                # Share actions dropdown
    │   │   ├── ReactionBar.tsx                # 6 emoji reaction buttons
    │   │   ├── SoundToggle.tsx                # Mute/unmute toggle
    │   │   ├── VerdictLabel.tsx               # UNANIMOUS BEATDOWN etc.
    │   │   └── LoadingOverlay.tsx             # Blur backdrop + spinner
    │   ├── hall-of-fame/
    │   │   └── LeaderboardCard.tsx            # Compact argument preview for rankings
    │   └── challenge/
    │       ├── ChallengeCard.tsx              # Challenge argument view
    │       └── ChallengeResult.tsx            # Agree/Beefing reveal
    │
    ├── lib/
    │   ├── db/
    │   │   ├── index.ts                       # Drizzle client init (Neon + schema)
    │   │   ├── schema.ts                      # ALL 7 tables + 8 enums (Drizzle definitions)
    │   │   └── migrations/                    # Generated by drizzle-kit
    │   ├── redis.ts                           # Upstash Redis client
    │   ├── constants.ts                       # Categories, verdict thresholds, reactions, heat descriptions, titles, platform colors
    │   ├── sounds.ts                          # Howler.js sound manager (sizzle, gavel, crowd)
    │   ├── fingerprint.ts                     # Browser fingerprint generation (SHA-256)
    │   └── utils.ts                           # formatBeefNumber, calcVotePercents, formatCount, generateChallengeCode
    │
    ├── hooks/
    │   ├── useSwipe.ts                        # Swipe-up gesture detection (80px threshold)
    │   ├── useKeyboardShortcuts.ts            # Space/1/2/S keyboard handlers
    │   ├── useSound.ts                        # Sound toggle state + play functions
    │   ├── useVote.ts                         # Vote mutation + optimistic UI
    │   └── useBeef.ts                         # Fetch random/specific beef
    │
    └── types/
        └── index.ts                           # All TypeScript interfaces: Argument, Message, Vote, Reaction, Challenge, User, BeefOfTheDay, API req/res types, VerdictDefinition, HallOfFameSort
```

---

## 12. Build Phases

### Phase 1: MVP Core (Weeks 1-2)

**Goal:** A working site where you can read random arguments and vote.

- [x] Next.js project setup (TypeScript, Tailwind, Framer Motion)
- [x] PWA manifest and icons placeholder
- [x] Database schema (Drizzle) with all 7 tables
- [x] Redis client setup
- [x] Full folder structure scaffolded
- [ ] Frontend: Argument viewer matching mockup — mobile-first, stagger animations, platform badges, heat rating, topic drift
- [ ] Frontend: Category filter chips
- [ ] Frontend: Voting UI with animated results bar + verdict labels
- [ ] Frontend: "Next Beef" button + swipe gesture + keyboard shortcuts
- [ ] API: `/api/beef/random`, `/api/beef/:beefNumber`, `/api/beef/:beefNumber/vote`, `/api/beef/:beefNumber/results`
- [ ] Manually curate 300-500 seed arguments (scrape Reddit, run through Claude API for scoring/categorization/anonymization)
- [ ] Vote dedup via fingerprinting
- [ ] Permalink pages with OG meta tags
- [ ] Deploy to Vercel + Neon + Upstash

### Phase 2: Pipeline & Polish (Weeks 3-4)

**Goal:** Automated content pipeline and sticky features.

- [ ] Automated Reddit scraping (Python, PRAW, target subreddits)
- [ ] Argument detection algorithm (sentiment + heuristics + LLM scoring)
- [ ] LLM batch processing (entertainment scoring, categorization, heat, drift, anonymization, zingers)
- [ ] Admin review CLI or simple dashboard
- [ ] Scale to 2,000-5,000 arguments
- [ ] Beef of the Day (selection, live voting, countdown, archive)
- [ ] Reaction system (6 emoji reactions)
- [ ] Sound effects (sizzle, gavel, crowd) with toggle
- [ ] Micro-animation polish (verdict slam, pepper sequence, confetti)
- [ ] HackerNews ingestion pipeline

### Phase 3: Sharing & Social (Weeks 5-6)

**Goal:** Make it go viral.

- [ ] Dynamic OG image generation (@vercel/og)
- [ ] Share button (copy link, Twitter, native share, download image)
- [ ] Challenge a Friend (create, share, respond, reveal)
- [ ] Hall of Fame page (6 leaderboard sections)
- [ ] User submission form + auto-parse + moderation queue
- [ ] Category landing pages with personality copy
- [ ] Permalink pages SEO-optimized
- [ ] YouTube comment ingestion
- [ ] Mobile UX polish (swipe, touch targets, scroll)

### Phase 4: Retention & Accounts (Weeks 7-8)

**Goal:** Make people come back every day.

- [ ] User auth (Google/GitHub/Apple OAuth, email magic link)
- [ ] User profiles (vote history, saved beefs, titles)
- [ ] Streak system (daily tracking, milestones, reminders)
- [ ] Judgment stats page (Spotify Wrapped style) with its own share card
- [ ] Web push notifications (BOTD, streaks, challenges)
- [ ] "Add to Home Screen" PWA prompt
- [ ] Daily Beef email (opt-in)
- [ ] Analytics (PostHog or Plausible)

### Phase 5: Scale & Expand (Ongoing)

- [ ] Performance optimization (Redis caching, CDN, image optimization)
- [ ] More platforms (Twitter submissions, Stack Exchange, forums)
- [ ] Best of [Month/Year] compilation pages
- [ ] Embeddable widget for external sites
- [ ] A/B testing (share card designs, BOTD selection, UX)
- [ ] SEO (sitemap, structured data, blog)
- [ ] Content moderation scaling (automated checks, community moderators)
- [ ] Native mobile app consideration (React Native/Expo)

---

## 13. Verification Criteria

1. **`npm run dev` starts without errors** — confirmed, returns HTTP 200
2. **All directories and files exist** per structure in Section 11
3. **`npx drizzle-kit generate`** produces migration SQL from `src/lib/db/schema.ts`
4. **`npx tsc --noEmit`** passes with zero errors — confirmed
5. **PLAN.md** covers every section from the product spec (all 13 requirements, data pipeline, moderation, virality, build phases)
6. **Mockup HTML** preserved at `docs/mockup.html`, design tokens reflected in `tailwind.config.ts`
