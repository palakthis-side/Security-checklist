# Securely — Security Checklist

Securely is a personal cyber security checklist built with React and Vite. It helps users review everyday security habits, track checklist progress, and see recommendations and category analytics in a simple dashboard.

## Features

- Dashboard with an overall security score and progress summary
- 22 security checks across six categories: password security, two-factor authentication, software updates, backup and recovery, phishing awareness, and privacy settings
- Search and filter checks by category and completion status
- Recommendations based on incomplete checks
- Charts for category coverage, priority coverage, and outstanding checks
- Responsive navigation and overview pages

## Getting started

Requires Node.js and npm.

```sh
npm install
npm run dev
```

Open the local URL printed by Vite to use the app.

## Available scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the local development server |
| `npm run build` | Create a production build in `dist/` |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run Oxlint |

## Project structure

- `src/App.jsx` — routes and application pages
- `src/data/checklistData.js` — sample checklist items and categories
- `src/components/Charts.jsx` — dashboard charts
- `src/utils/` — score and analytics calculations
- `src/services/api.js` — mock data and progress service

## Current data behavior

Checklist items and profile details are sample data in the project. Progress updates are held in the app's current session and are not saved to a server or browser storage.
