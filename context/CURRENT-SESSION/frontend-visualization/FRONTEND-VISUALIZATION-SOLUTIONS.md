# Frontend Visualization Solutions for Cursor

## Executive Summary
- Best recommended approach: Use Next.js dev server in an external browser, with Simple Browser inside Cursor as an optional in-IDE view.
- Why this is optimal: Next.js Fast Refresh delivers ~instant updates with full Chrome/Firefox DevTools. It requires no extra extensions and works reliably within Cursor's VS Code base.
- Expected user experience: Save a file → see the change in ~1 second; switch quickly between code and preview; test responsive layouts via the browser’s device toolbar.

## Solution 1: Next.js dev server + External Browser (⭐ Recommended)
- What it is: Run your Next.js dev server (default http://localhost:3000) and preview in Chrome/Edge/Firefox.
- How to set it up:
  1) Open terminal in Cursor at your Next.js project root.
  2) Install dependencies: npm install
  3) Start the dev server: npm run dev (or next dev)
  4) Open http://localhost:3000 in Chrome; keep it side-by-side with Cursor.
- Pros and cons:
  - Pros: Fastest, most reliable; full DevTools and extensions; ideal for responsive testing. Uses Next.js Fast Refresh (https://nextjs.org/docs/architecture/fast-refresh).
  - Cons: Separate window (minor context switching if on one monitor).
- Step-by-step instructions:
  - Run: npm install → npm run dev → open http://localhost:3000 → toggle Chrome DevTools device mode as needed (https://developer.chrome.com/docs/devtools/device-mode/).

## Solution 2: Next.js dev server + Simple Browser inside Cursor
- What it is: Use the built-in Simple Browser pane inside Cursor/VS Code.
- How to set it up:
  1) Start your app: npm run dev
  2) In Cursor, press Cmd+Shift+P → type and select: Simple Browser: Show
  3) Enter: http://localhost:3000
  4) Split the editor to keep code left and preview right.
- Pros and cons:
  - Pros: In-IDE preview; minimal context switching.
  - Cons: Limited compared to full Chrome DevTools; some service worker sites may show warnings (open externally if issues appear).

## Solution 3: Live Preview extension (static sites; not for Next.js)
- What it is: Microsoft’s Live Preview extension hosts a local server and embeds a preview tab. The extension itself notes that frameworks with their own dev servers should use Simple Browser.
- Link: https://marketplace.visualstudio.com/items?itemName=ms-vscode.live-server
- Pros and cons:
  - Pros: Great for plain HTML/CSS demos.
  - Cons: Not intended for Next.js dev server; prefer Simple Browser for frameworks.
- Note from listing: “This extension is most useful for projects where a server is not already created (e.g. not for apps using React, Angular, etc.). To work with these, feel free to run the ‘Simple Browser: Show’ command that is already built-in with VS Code.”

## Solution 4: Storybook (Optional: component isolation)
- What it is: A UI component explorer to build and test components in isolation.
- When to use: If you want a design system workflow or need to debug components without app routing/state.
- Pros: Isolated environment; rich addons; visual docs.
- Cons: Extra setup/maintenance; slower loop vs plain Next.js Fast Refresh for page-level work.
- Link: https://storybook.js.org/docs/react/get-started/install

## Comparison Matrix
| Feature | Solution 1: External Browser | Solution 2: Simple Browser | Solution 3: Live Preview | Solution 4: Storybook |
|---------|------------------------------|----------------------------|--------------------------|-----------------------|
| Setup Time | 1–2 min | 1 min | 2–3 min | 5–10 min |
| Preview Speed | Fast | Fast | N/A for Next.js | Medium |
| Hot Reload | Yes (Fast Refresh) | Yes (Fast Refresh) | N/A | Yes (HMR) |
| In-IDE | No | Yes | Yes | Separate tab/app |
| Cost | Free | Free | Free | Free |

## Recommended Workflow
1) Use Solution 1 as the default. Keep Chrome next to Cursor; rely on Fast Refresh for near-instant updates.
2) Use Solution 2 when you prefer in-IDE viewing (Simple Browser) during quick edits.
3) Consider Solution 4 for component-heavy teams needing isolation and visual docs.

## Extensions to Install
- Tailwind CSS IntelliSense (ID: bradlc.vscode-tailwindcss): https://marketplace.visualstudio.com/items?itemName=bradlc.vscode-tailwindcss
- ESLint (ID: dbaeumer.vscode-eslint): https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint
- Prettier (ID: esbenp.prettier-vscode): https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode
- Optional: Thunder Client (ID: rangav.vscode-thunder-client) for API testing: https://marketplace.visualstudio.com/items?itemName=rangav.vscode-thunder-client

## Configuration Files
- Optional .vscode/settings.json example:
```json
{
  "editor.formatOnSave": true,
  "files.autoSave": "onFocusChange",
  "simpleBrowser.defaultUrl": "http://localhost:3000"
}
```

## Tips & Tricks
- Next.js Fast Refresh fundamentals: https://nextjs.org/docs/architecture/fast-refresh
- Local dev optimization (Turbopack, etc.): https://nextjs.org/docs/app/guides/local-development
- Responsive testing: Chrome DevTools device mode: https://developer.chrome.com/docs/devtools/device-mode/
- Share your local server (for mobile or stakeholder review):
  - ngrok: https://ngrok.com/ → ngrok http 3000
  - Localtunnel: https://github.com/localtunnel/localtunnel → npx localtunnel --port 3000

## Troubleshooting
- Preview doesn’t update: Check terminal for Next.js compile errors; fix then save.
- Port in use: lsof -i :3000 → kill the running process, or change port via NEXT_PUBLIC_PORT/next config.
- Simple Browser shows service worker or webview errors: open in external browser instead (Chrome/Firefox) for full compatibility.
- Slow HMR: Update Next.js; try dev with Turbopack (npm run dev -- --turbo) and review large imports per Next docs.
