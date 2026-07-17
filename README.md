# React Expense Tracker

A Vite React expense tracker for freelancers with localStorage persistence, input validation, empty states, loading states, search/filtering, sanitized inputs, analytics console logs, and a clean accessible corporate UI.

## Overview

React Expense Tracker is a frontend-only expense management interface for freelancer teams. It uses React fundamentals only: `useState`, `useEffect`, derived state, and prop drilling between components.

The app intentionally does not use Redux, React Router, backend APIs, real API keys, or sensitive PII because the ticket focuses on core React state and form logic.

## Tech Stack

- Vite
- React
- JavaScript
- CSS
- localStorage

## Features

- Add freelancer expenses with title, amount, category, date, and notes.
- View expense records in a structured table.
- See summary metrics for records, total, average, and highest expense.
- Search and filter expense records.
- Start with an empty expense state and show `No data found`.
- Validate missing or malformed fields and highlight invalid inputs in red.
- Simulate slow connectivity with loading and saving states.
- Persist records in `localStorage` so the app works without a backend.
- Sanitize text inputs before storing them in React state.
- Log analytics simulation messages in the console after primary actions.
- Provide labeled, keyboard-navigable controls with ARIA support.
- Use a clean monochromatic corporate design system.

## Run Locally

```bash
npm install
npm run dev
```

PowerShell-safe commands:

```powershell
npm.cmd install
npm.cmd run dev
```

Open the local URL shown in the terminal, usually:

```txt
http://localhost:5173/
```

## Verification

```bash
npm run lint
npm run build
```

## Deployment

Deploy as a Vite React frontend on Vercel or Netlify.

Build command:

```txt
npm run build
```

Output directory:

```txt
dist
```

## Acceptance Criteria Coverage

- Empty state: `No data found`
- Bad connectivity: simulated loading and saving indicators
- Invalid inputs: blocked submission with red field highlights
- Accessibility: semantic labels, ARIA support, and keyboard-friendly controls
- Telemetry simulation: console analytics logs after primary actions
- Security: text inputs are sanitized before storage

## Security Note

No real API keys, tokens, passwords, or sensitive PII are hardcoded in the source.

## Implementation Note

The ticket focuses on React fundamentals, so this implementation intentionally uses local React state and `localStorage` instead of an external API. Loading states are simulated with timers to satisfy the bad connectivity requirement.
