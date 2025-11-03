# Visualization Workflow Diagram (ASCII)

Code in Cursor → Save → Next.js Fast Refresh → Browser updates (~1s)

+------------------+        save        +------------------+        HMR        +------------------+
|  Cursor Editor   | -----------------> |  Next.js Dev     |  --------------> |  Browser Preview |
|  (Next.js code)  |                    |  Server (3000)   |                  |  (Chrome / SB)   |
+------------------+                    +------------------+                  +------------------+

Legend:
- “SB” = Simple Browser inside Cursor (optional)
- External browser recommended for full DevTools and compatibility
