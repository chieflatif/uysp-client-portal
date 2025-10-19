# Frontend Visualization Investigation - Agent Brief
**Created**: October 17, 2025  
**For**: Investigation Agent  
**Purpose**: Research how to visualize/preview Next.js frontend as we build within Cursor

---

## 🎯 INVESTIGATION OBJECTIVE

**User's Question:**
"How can I visualize the frontend when we build it within Cursor? I know Cursor doesn't have pretty visualization tools like Lovable or Replit, but I'm sure there are extensions or other ways to do this."

**Your Mission:**
Research and document ALL methods to preview, visualize, and interact with a Next.js + React + Tailwind application while building it in Cursor IDE.

---

## 📋 CONTEXT YOU NEED

### What We're Building
- **Tech Stack**: Next.js 14, React, Tailwind CSS, shadcn/ui components
- **Hosting**: Render.com (but preview during development)
- **IDE**: Cursor (VS Code-based)
- **Database**: PostgreSQL
- **User**: Non-technical, wants visual feedback while building

### What User Wants
- Real-time preview of UI as we build it
- See components render visually
- Interact with the interface (click buttons, test forms)
- Understand what the frontend looks like without deploying
- Similar experience to Lovable.dev or Replit's visual preview

### Current Situation
- We have complete specifications (1,800+ lines)
- Ready to start building Phase 1 MVP
- User wants to SEE the frontend as we build
- Need solution that works within Cursor workflow

---

## 🔍 INVESTIGATION AREAS

### 1. Built-in Cursor/VS Code Features

**Research:**
- Does Cursor have any native preview capabilities?
- VS Code extensions that work in Cursor
- Live Server extensions
- Browser preview panes
- Split-screen preview options

**Questions to Answer:**
- Can we open a browser preview inside Cursor?
- Is there a "Simple Browser" feature like VS Code?
- Can we auto-refresh on file save?
- Does Cursor support webview panels?

**Tools to Research:**
- Live Server extension
- Preview extension
- Browser Preview extension
- Simple Browser (VS Code built-in)

---

### 2. Next.js Development Server

**Research:**
- How Next.js dev server works (localhost:3000)
- Hot Module Replacement (HMR) capabilities
- Fast Refresh for React components
- How to configure for best preview experience

**Questions to Answer:**
- Can we run `npm run dev` and get live preview?
- Does Next.js Fast Refresh work smoothly?
- Can we see component changes instantly?
- What's the typical workflow for Next.js developers?

**Best Practices:**
- Optimal dev server configuration
- Multiple browser windows vs. single preview pane
- Using Chrome DevTools alongside Cursor
- Mobile responsive testing tools

---

### 3. VS Code Extensions (That Work in Cursor)

**Research These Extensions:**

**Preview/Server Extensions:**
- **Live Server** - Launch local server with live reload
- **Live Preview** - Microsoft's official preview extension
- **Preview on Web Server** - Simple HTTP server
- **Browser Preview** - Embedded browser in VS Code
- **Five Server** - Modern dev server with live reload

**React/Next.js Specific:**
- **ES7+ React/Redux/React-Native snippets** - Speed up development
- **Tailwind CSS IntelliSense** - Autocomplete for Tailwind
- **Auto Rename Tag** - Rename paired HTML/JSX tags
- **Prettier** - Code formatting
- **ESLint** - Linting

**Testing Extensions:**
- **Thunder Client** - Test API endpoints
- **REST Client** - HTTP requests in VS Code
- **Playwright Test** - E2E testing with visual debugging

**Questions to Answer:**
- Which extensions are compatible with Cursor?
- Which give the best preview experience?
- Can we embed browser in Cursor sidebar?
- Do any support hot reload automatically?

---

### 4. External Tools (Separate Windows)

**Research:**
- Browser DevTools workflows
- Using secondary monitor for preview
- Browser extensions for developers
- Mobile device simulators

**Tools to Investigate:**
- **Chrome DevTools** - Device mode, responsive testing
- **Firefox Developer Edition** - Built-in design tools
- **Responsively App** - Preview multiple devices simultaneously
- **ngrok** - Share local dev server (for mobile testing)
- **Localtunnel** - Alternative to ngrok
- **BrowserStack** - Cross-browser testing (if needed)

**Questions to Answer:**
- What's the smoothest two-screen workflow?
- Can we auto-refresh browser on Cursor save?
- How to test mobile responsiveness easily?
- Best browser for Next.js development?

---

### 5. Component Development Tools

**Research:**
- Storybook for component isolation
- Next.js built-in features
- shadcn/ui documentation patterns
- Component preview patterns

**Tools to Investigate:**
- **Storybook** - UI component explorer
- **Next.js App Directory** - Built-in routing/preview
- **shadcn/ui Docs** - How they preview components
- **v0.dev** - Vercel's AI component generator (inspiration)

**Questions to Answer:**
- Should we use Storybook for component preview?
- Can we build a simple component gallery page?
- How to preview components in isolation?
- What's faster: Storybook or custom page?

---

### 6. Rapid Prototyping Workflows

**Research:**
- How professional Next.js developers preview
- Workflows from Vercel, Netlify docs
- Real-time collaboration tools
- AI-assisted development with preview

**Workflows to Study:**
- Vercel's local development experience
- Netlify Dev CLI
- How teams using Cursor work
- AI pair programming with visual feedback

**Questions to Answer:**
- What's the fastest iteration loop?
- How to minimize context switching?
- Can we automate any preview steps?
- What's the "industry standard" workflow?

---

### 7. Alternative Approaches

**Research Creative Solutions:**
- Using Cursor's terminal + split screen
- Browser window positioning tools
- Automated screenshot tools
- Recording/GIF tools for documentation
- AI tools that generate preview images

**Tools to Investigate:**
- **Spectacle/Rectangle** - Window management (Mac)
- **PowerToys FancyZones** - Window management (Windows)
- **ScreenToGif** - Record development process
- **Loom** - Record and share progress
- **Figma** - Design mockups that match code

**Questions to Answer:**
- Can we automate browser positioning?
- Should we record development for user?
- How to show progress visually?
- Can AI generate preview screenshots?

---

## 📊 WHAT TO DELIVER

### Required Deliverables:

**1. Comprehensive Report** (Markdown)
Create: `FRONTEND-VISUALIZATION-SOLUTIONS.md`

**Structure:**
```markdown
# Frontend Visualization Solutions for Cursor

## Executive Summary
- Best recommended approach
- Why this is optimal
- Expected user experience

## Solution 1: [Name] (⭐ Recommended)
- What it is
- How to set it up
- Pros and cons
- Step-by-step instructions
- Screenshots/examples if possible

## Solution 2: [Alternative]
[Same structure]

## Solution 3: [Another Option]
[Same structure]

## Comparison Matrix
| Feature | Solution 1 | Solution 2 | Solution 3 |
|---------|-----------|-----------|-----------|
| Setup Time | X min | X min | X min |
| Preview Speed | Fast/Slow | Fast/Slow | Fast/Slow |
| Hot Reload | Yes/No | Yes/No | Yes/No |
| In-IDE | Yes/No | Yes/No | Yes/No |
| Cost | Free/Paid | Free/Paid | Free/Paid |

## Recommended Workflow
1. Step 1
2. Step 2
3. Step 3

## Extensions to Install
- Extension name + link + purpose

## Configuration Files
- Any necessary configs
- .vscode/settings.json examples

## Tips & Tricks
- Pro tips for smooth experience

## Troubleshooting
- Common issues and fixes
```

**2. Quick Start Guide** (Separate File)
Create: `QUICK-START-PREVIEW-SETUP.md`

**For the developer (me) to follow:**
- Install these extensions
- Run these commands
- Configure these settings
- Open preview this way
- Done in 5 minutes

**3. Visual Comparison** (If Possible)
- Screenshots of different approaches
- OR: Descriptions detailed enough to imagine
- Compare to Lovable/Replit experience

---

## 🎯 SUCCESS CRITERIA

### Your investigation is successful if:

1. ✅ **Multiple options identified** (at least 3 viable approaches)
2. ✅ **Clear recommendation** (one "best" option with rationale)
3. ✅ **Step-by-step setup** (developer can follow without guessing)
4. ✅ **Pros and cons** (honest assessment of each approach)
5. ✅ **User experience described** (what they'll see/experience)
6. ✅ **Extensions listed** (with links to install)
7. ✅ **Configuration provided** (any settings needed)
8. ✅ **Comparison to Lovable/Replit** (how close can we get?)
9. ✅ **Troubleshooting included** (common issues documented)
10. ✅ **Ready to implement** (developer can set up immediately)

---

## 💡 INVESTIGATION TIPS

### Start Here:
1. **Test Next.js dev server first** - This is the baseline
2. **Try VS Code extensions** - Many work in Cursor
3. **Research Cursor-specific features** - Check their docs
4. **Look at real workflows** - YouTube, blogs, tweets from Next.js devs
5. **Test if possible** - If you can spin up a demo, do it

### Key Questions:
- What gives the fastest feedback loop?
- What requires least context switching?
- What's easiest for non-technical user to understand?
- What's most reliable (won't break)?
- What's free and doesn't require additional accounts?

### Red Flags to Note:
- Solutions requiring paid subscriptions
- Tools that don't support Next.js 14
- Approaches that need complex setup
- Options that break hot reload
- Tools with poor maintenance/support

---

## 📚 RESOURCES TO CHECK

### Official Documentation:
- Next.js documentation (preview/dev server)
- Cursor documentation (preview features)
- VS Code extension marketplace
- Tailwind CSS tooling docs
- shadcn/ui setup guides

### Community Resources:
- Cursor Discord/community
- Next.js discussions on GitHub
- Reddit r/nextjs
- Dev.to articles on Next.js workflow
- YouTube: "Next.js development workflow"

### Similar Questions:
- "How to preview React in VS Code"
- "Next.js development best practices"
- "Live reload in Cursor IDE"
- "VS Code extensions for React development"

---

## 🚀 CONTEXT FOR YOUR RESEARCH

### The Project:
- **UYSP Client Portal** - Professional web app for coaching clients
- **Tech Stack**: Next.js 14 + React + Tailwind + shadcn/ui
- **Database**: PostgreSQL on Render
- **Phase 1 MVP**: 3-week build starting soon
- **User**: Business owner (non-technical) wants to see progress

### What User Will See During Development:
Ideally:
- Lead list view as we build it
- Lead detail page with real data
- Forms and buttons working
- Tailwind styling rendering
- Components coming together visually
- Responsive design preview (mobile/desktop)

### Development Flow:
```
1. I write code in Cursor
2. User sees preview update automatically
3. User says "that button needs to be bigger"
4. I adjust code
5. User sees change immediately
6. Rinse and repeat
```

**Goal**: Minimize delay between code change and visual feedback

---

## ⚠️ IMPORTANT NOTES

### About Cursor:
- Cursor is VS Code-based (Electron app)
- Most VS Code extensions work
- Has built-in AI features
- Terminal access
- Git integration
- User wants to stay in Cursor (not switch tools)

### About the User:
- Non-technical but wants visual feedback
- Used to tools like Lovable (instant preview)
- Wants to understand what's being built
- Prefers simple over complex
- Willing to open separate browser if needed
- Has Mac (check for Mac-specific tools)

### About Next.js:
- Dev server runs on localhost:3000
- Fast Refresh = instant component updates
- Hot Module Replacement built-in
- Already optimized for development
- We just need to visualize it!

---

## 📋 INVESTIGATION CHECKLIST

Before submitting your report, verify:

- [ ] Tested or thoroughly researched at least 3 approaches
- [ ] Identified one clear "recommended" solution
- [ ] Provided step-by-step setup instructions
- [ ] Listed all necessary extensions with links
- [ ] Included configuration examples
- [ ] Compared to Lovable/Replit experience
- [ ] Documented pros and cons honestly
- [ ] Included troubleshooting section
- [ ] Considered user's Mac environment
- [ ] Thought about non-technical user experience
- [ ] Checked that solutions work with Next.js 14
- [ ] Verified extensions work in Cursor (not just VS Code)
- [ ] Provided realistic timeline for setup
- [ ] Noted any costs involved
- [ ] Ready for immediate implementation

---

## 🎯 FINAL DELIVERABLES

### Create These Files:

1. **`FRONTEND-VISUALIZATION-SOLUTIONS.md`**
   - Comprehensive research report
   - Multiple options with details
   - Comparison matrix
   - Recommendation

2. **`QUICK-START-PREVIEW-SETUP.md`**
   - 5-minute setup guide
   - For developer to follow immediately
   - Install extensions, configure, done

3. **`VISUALIZATION-WORKFLOW-DIAGRAM.md`** (Optional but helpful)
   - Visual representation of recommended workflow
   - ASCII diagram or detailed description
   - Show: Code → Save → Preview → Feedback loop

### Location:
Save in: `/context/CURRENT-SESSION/frontend-visualization/`

---

## 💬 EXAMPLE QUESTIONS TO ANSWER

Answer these in your report:

1. **"Can I see the UI inside Cursor itself?"**
   - Yes/No and how

2. **"Do I need to manually refresh the browser?"**
   - Yes/No and alternatives

3. **"How fast will I see changes?"**
   - Seconds? Instant? Need refresh?

4. **"Can I test on mobile view?"**
   - Yes/No and how

5. **"Is this as good as Lovable/Replit?"**
   - Honest comparison

6. **"What if something doesn't work?"**
   - Troubleshooting steps

7. **"How much setup time?"**
   - Realistic estimate

8. **"Any costs involved?"**
   - Free vs paid options

9. **"Will this slow down development?"**
   - Performance considerations

10. **"Can I share the preview with others?"**
    - Yes/No and how (ngrok, etc.)

---

## 🚀 READY TO INVESTIGATE?

**Your mission**: Find the BEST way to visualize a Next.js + React + Tailwind app while building in Cursor, optimized for a non-technical user who wants instant visual feedback.

**Success looks like**: Developer (me) can follow your guide in 5 minutes and have a smooth preview workflow that makes the user happy.

**Remember**: We want the experience as close to Lovable/Replit as possible, but working within Cursor ecosystem.

---

**Good luck! 🔍**

---

## 📎 REFERENCES

### Existing Project Documentation:
- Full Client Portal spec: `docs/architecture/CLIENT-PORTAL-COMPLETE-SPECIFICATION.md`
- Tech stack details in that file
- Phase 1 MVP scope defined

### User's Environment:
- OS: macOS (darwin 25.0.0)
- IDE: Cursor
- Has Render.com account for deployment
- Working directory: `/Users/latifhorst/cursor projects/UYSP Lead Qualification V1`

### What We'll Build (For Context):
- Lead list view (table with filters)
- Lead detail view (full profile page)
- Login/authentication screens
- Dashboard with charts (Recharts/Tremor)
- Forms (React Hook Form)
- Modern UI (Tailwind + shadcn/ui)

All of this needs to be visually previewable as we build it!

---

**Agent Instructions Complete** ✅  
**Investigation can begin** ✅  
**Awaiting comprehensive report** ✅



