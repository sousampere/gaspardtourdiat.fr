# GaspardTourdiat.fr — Specification document

> Personal portfolio website built with React.

---

## 1. Tech Stack

| Layer | Choice | Notes |
| --- | --- | --- |
| **Framework** | React 19 | SPA / client-rendered |
| **Language** | TypeScript | Strict mode |

---

## 2. Project Structure

```
src/
├── assets/              # Static images, icons, fonts
│   ├── images/
│   ├── icons/
│   └── fonts/
├── components/          # Shared/reusable components (UI primitives)
│   ├── ui/              # Button, Card, Badge, Tag, etc.
│   ├── layout/          # Header, Footer, Section, Container
│   └── shared/          # ProjectCard, SkillBar, TimelineItem
├── features/            # Feature‑specific sections (one folder per page/section)
│   ├── Home/
│   ├── About/
│   ├── Projects/
│   ├── Skills/
│   ├── Experience/
│   └── Contact/
├── hooks/               # Custom React hooks
├── data/                # Static content (projects list, skills, experience)
├── types/               # TypeScript interfaces & types
├── utils/               # Helper/utility functions
├── styles/              # Global styles & design tokens (CSS custom properties)
│   ├── tokens.css       # Colors, spacing, typography, breakpoints
│   └── global.css       # Reset, base element styles
├── App.tsx              # Root component, route definitions
├── main.tsx             # Vite entry point
└── vite-env.d.ts
```

---

## 3. Pages / Sections

All sections are presented on a single‑page scroll layout, with a sticky navigation bar. Optional: internal anchor links and smooth scroll.

### 3.1 Home / Hero

- Full‑viewport hero section.
- Name, title / tagline, a short value proposition.
- Call‑to‑action buttons: "See my work" → scroll to Projects; "Get in touch" → scroll to Contact.
- Background: subtle animated gradient or geometric shapes (Framer Motion).
- Accessibility: reduced‑motion media query disables background animation.

### 3.2 About

- Short bio (1–2 paragraphs).
- Photo or avatar placeholder.
- Personal interests / "beyond the code" blurb.
- Download resume button (static PDF in `/public`).

### 3.3 Skills

- Categorized skill list (Languages, Frameworks, Tools, Databases).
- Visual indicator of proficiency (icon grid or progress bar).
- Data driven from `src/data/skills.ts`.

### 3.4 Experience / Timeline

- Work history displayed as a vertical timeline.
- Each entry: dates, company, role, key accomplishments (bullet list).
- Reverse chronological order.
- Data driven from `src/data/experience.ts`.

### 3.5 Projects

- Card grid of featured projects.
- Each card: thumbnail, title, short description, tech tags, links (live demo / GitHub).
- Click opens a detail overlay or navigates to a project detail page.
- Filtering by tech category (JavaScript, React, Python, etc.).
- Data driven from `src/data/projects.ts`.

### 3.6 Contact

- Contact form (name, email, message) with validation.
- Submit sends via a service (EmailJS / Formspree / custom backend).
- Links to GitHub, LinkedIn, and optionally Twitter/X and email.
- Success / error feedback after submission.

### 3.7 404 Page

- Fallback for unknown routes.
- Friendly message + link back to home.

---

## 4. Design System & Visual Identity

### 4.1 Design Tokens (`src/styles/tokens.css`)

All values stored as CSS custom properties on `:root`.

| Token group | Examples |
| --- | --- |
| **Colors** | `--color-primary`, `--color-secondary`, `--color-accent`, `--color-bg`, `--color-text`, `--color-surface`, `--color-border` |
| **Typography** | `--font-sans`, `--font-mono`, `--font-heading`, `--fs-*` scale (xs → 2xl), `--lh-*` |
| **Spacing** | `--space-*` scale (xs → 3xl, based on 4‑px unit) |
| **Breakpoints** | `--bp-sm`, `--bp-md`, `--bp-lg`, `--bp-xl` |
| **Shadows** | `--shadow-sm`, `--shadow-md`, `--shadow-lg` |
| **Radius** | `--radius-sm`, `--radius-md`, `--radius-lg`, `--radius-full` |
| **Transitions** | `--transition-fast`, `--transition-base`, `--transition-slow` |

### 4.2 Layout

- Max‑width container: `1200px`, centered with horizontal padding.
- Sections alternate background color (`--color-bg` / `--color-surface`) to create visual rhythm.
- Vertical spacing between sections: `clamp(4rem, 8vw, 8rem)`.

### 4.3 Typography

- Headings: system sans‑serif or Inter (loaded from Google Fonts or self‑hosted).
- Body: system font stack for performance.
- Mono: JetBrains Mono or system monospace for inline code / tech tags.

### 4.4 Dark Mode

- Toggle in the header.
- Persist preference in `localStorage` + respect `prefers-color-scheme`.
- All token colors have `-dark` variants applied via `[data-theme="dark"]` selector.

---

## 5. Routes

| Path | Component | Notes |
| --- | --- | --- |
| `/` | `HomePage` | Single‑page layout composing all sections |
| `/project/:slug` | `ProjectDetail` | Optional individual project page |
| `*` | `NotFound` | 404 fallback |

The primary experience is the single‑page scroll. The project detail route is only needed if card descriptions are too brief to convey the full story.

---

## 6. Components

### 6.1 Layout Components

| Component | Responsibility |
| --- | --- |
| `Header` | Sticky top bar, logo/name, nav links, dark‑mode toggle, mobile hamburger menu |
| `Footer` | Copyright, social links, back‑to‑top button |
| `Section` | Generic section wrapper (id, title, subtitle, max‑width, background variant) |
| `Container` | Max‑width centered wrapper |

### 6.2 UI Components

| Component | Responsibility |
| --- | --- |
| `Button` | Variants: primary, secondary, ghost. Sizes: sm, md, lg. Optional icon slot. |
| `Card` | Surface container with optional hover lift effect |
| `Tag` / `Badge` | Small pill for tech categories, skill labels |
| `Timeline` | Vertical timeline layout with alternating sides |
| `ProjectCard` | Thumbnail + title + tags + links (used on grid) |
| `SkillBar` / `SkillIcon` | Proficiency indicator for a single skill |
| `ContactForm` | Validated form with name, email, message fields |
| `DarkModeToggle` | Sun/moon icon button |
| `MobileNav` | Slide‑out drawer navigation for small screens |
| `SEOHead` | Dynamically sets `<title>` & `<meta>` tags (via `react-helmet-async` or plain `<title>`) |

---

## 7. Data / Content Model (`src/types/`)

```typescript
// types/project.ts
interface Project {
  slug: string;
  title: string;
  description: string;
  longDescription?: string;
  thumbnail: string;
  techs: string[];
  liveUrl?: string;
  githubUrl?: string;
  featured: boolean;
  year: number;
}

// types/experience.ts
interface Experience {
  id: string;
  company: string;
  role: string;
  startDate: string;
  endDate: string | "Present";
  description: string;
  achievements: string[];
  logo?: string;
}

// types/skill.ts
interface SkillCategory {
  category: string;     // e.g. "Languages", "Frameworks"
  items: Skill[];
}
interface Skill {
  name: string;
  level: number;        // 0–100
  icon?: string;
}

// types/navigation.ts
interface NavLink {
  label: string;
  href: string;         // anchor, e.g. "#projects"
}
```

Data files in `src/data/` export typed arrays. This keeps all content static, version‑controlled, and easy to edit without a CMS.

---

## 8. Responsive Breakpoints

| Name | Width | Layout impact |
| --- | --- | --- |
| Phone | `< 640px` | Single column, stacked navigation, smaller type |
| Tablet | `640–1024px` | 2‑column grids, hamburger nav |
| Desktop | `> 1024px` | Multi‑column grids, full nav, max‑width container |

---

## 9. Performance & Accessibility

- **Lighthouse target**: 90+ on all four categories.
- **Images**: AVIF / WebP with `<picture>` fallback; lazy loading (`loading="lazy"`).
- **Fonts**: Self‑host subsetted fonts, `font-display: swap`.
- **Animations**: Respect `prefers-reduced-motion` — disable or simplify.
- **Keyboard**: All interactive elements reachable and operable via keyboard.
- **Semantic HTML**: Use `nav`, `main`, `section`, `article`, `footer` landmarks.
- **Skip link**: "Skip to content" link as first focusable element.

---

## 10. SEO

- `<title>` and `<meta name="description">` per route.
- Open Graph tags (`og:title`, `og:description`, `og:image`) for social preview.
- `sitemap.xml` generator (Vite plugin or build step).
- `robots.txt` in public folder.

---

## 11. Future / Optional Enhancements

- **Blog**: Markdown‑based blog section (MDX or `.md` files loaded at build time).
- **i18n**: French / English toggle (relevant for a .fr domain).
- **Analytics**: Plausible or Umami (privacy‑friendly, self‑hosted).
- **Page transitions**: Animated route transitions with Framer Motion's `AnimatePresence`.
- **CMS**: Replace static data files with a headless CMS (Sanity / Contentful / Strapi).
- **Service worker / PWA**: Offline support, install prompt.
- **Guestbook / testimonials**: Social proof section.

---

## 12. Milestones

| Phase | Scope |
| --- | --- |
| **M1 — Scaffold & design tokens** | Vite + React + TS setup, global styles, tokens, dark mode toggle, layout shell (Header, Footer, Container) |
| **M2 — Sections** | Hero, About, Skills, Experience, Projects grid, Contact form |
| **M3 — Polish & data** | Fill real content in `src/data/`, responsive review, animations, 404 page |
| **M4 — Performance & publish** | Lighthouse audit, SEO tags, sitemap, deploy, custom domain |
| **M5 — Optional extras** | Blog, i18n, analytics, page transitions |

---

## Open Questions

- [ ] **CSS approach confirmed?** CSS Modules + tokens is proposed. Alternatives: Tailwind CSS, styled-components, vanilla extract.
- [ ] **Hosting / deployment?** Netlify, Vercel, Cloudflare Pages, or GitHub Pages.
- [ ] **Contact form service?** EmailJS, Formspree, custom backend (Node.js), or mailto link.
- [ ] **Project detail pages?** Inline card descriptions only, or dedicated `/project/:slug` route?
- [ ] **Blog needed now?** Yes / later / not planned.
- [ ] **Single‑page scroll** or separate route per section?
- [ ] **French / English bilingual?** The domain is `.fr` — worth considering.
- [ ] **Self‑hosted fonts?** Inter (headings), JetBrains Mono (code) — download or Google Fonts?
