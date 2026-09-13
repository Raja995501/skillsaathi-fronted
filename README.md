# SkillSaathi Frontend

React 19 + Vite + Tailwind CSS. Homepage is a pixel-parity port of the approved prototype
(1787118411610_index.html) — see src/index.css for why the original CSS is preserved verbatim
rather than re-derived into Tailwind utilities.

## Run locally
```
npm install
npm run dev
```
Runs on http://localhost:5173, proxies /api and /ws to the backend on :8080 (see vite.config.js).

## Structure
```
src/
  components/
    layout/    Navbar, Footer
    home/      Hero, ExploreSkills, HowItWorks, CoreFeatures
    shared/    Modal (signup/teach), Toast is context-driven (see hooks/useToast.jsx)
  pages/       HomePage.jsx composes the above in prototype order
  hooks/       useToast.jsx
```
