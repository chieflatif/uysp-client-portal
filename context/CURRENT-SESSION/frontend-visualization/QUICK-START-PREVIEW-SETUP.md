# Quick Start: Preview Setup in Cursor (≈5 minutes)

## Install (optional but recommended)
- Tailwind CSS IntelliSense: https://marketplace.visualstudio.com/items?itemName=bradlc.vscode-tailwindcss
- ESLint: https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint
- Prettier: https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode

## Start Next.js
1) Open terminal in Cursor at your Next.js project root
2) Install deps: npm install
3) Start dev server: npm run dev (or: next dev)
4) Wait for: “Local: http://localhost:3000”

## Preview Options
- External (recommended): Open http://localhost:3000 in Chrome/Edge/Firefox; place the window side-by-side with Cursor. Enable device toolbar for mobile testing (https://developer.chrome.com/docs/devtools/device-mode/)
- In-IDE (optional): Cmd+Shift+P → Simple Browser: Show → enter http://localhost:3000 → split view

## Done-when
- Saving a React/JSX/TSX file updates the UI in ~1 second (Fast Refresh)
- You can toggle mobile view via the browser device toolbar
- No manual refresh required for typical component edits

## If something breaks
- Check Cursor terminal for compile/runtime errors from Next.js
- If Simple Browser misbehaves, open in external browser
- If port 3000 is busy: lsof -i :3000 → kill the PID or change port
