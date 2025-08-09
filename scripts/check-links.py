#!/usr/bin/env python3
import os
import re
import sys

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))

md_links = re.compile(r"\[[^\]]*\]\(([^)]+)\)")

def is_external(link: str) -> bool:
    l = link.strip()
    return (
        l.startswith('http://') or l.startswith('https://') or l.startswith('mailto:') or l.startswith('#')
    )

def normalize_target(base_dir: str, link: str) -> str:
    target = link.split('#', 1)[0].strip()
    if not target:
        return ''
    if target.startswith('/'):
        # treat as absolute path outside project; mark for now
        return os.path.normpath(target)
    return os.path.normpath(os.path.join(base_dir, target))

broken = []

def skip_dir(path: str) -> bool:
    p = path.replace('\\', '/')
    return (
        '/docs/archive/' in p
        or p.endswith('/docs/archive')
        or '/context/SESSIONS-ARCHIVE/' in p
        or p.endswith('/context/SESSIONS-ARCHIVE')
    )

for dirpath, dirnames, filenames in os.walk(ROOT):
    # prune ignored directories
    dirnames[:] = [d for d in dirnames if not skip_dir(os.path.join(dirpath, d))]
    for fn in filenames:
        if not fn.endswith('.md'):
            continue
        path = os.path.join(dirpath, fn)
        try:
            with open(path, 'r', encoding='utf-8', errors='ignore') as f:
                for i, line in enumerate(f, 1):
                    for m in md_links.finditer(line):
                        link = m.group(1)
                        if is_external(link):
                            continue
                        target = normalize_target(os.path.dirname(path), link)
                        if not target:
                            continue
                        if not os.path.exists(target):
                            broken.append((path, i, link))
        except Exception as e:
            print(f"ERROR: failed to read {path}: {e}", file=sys.stderr)

for p, ln, lk in broken:
    print(f"BROKEN: {p}:{ln} -> {lk}")

print(f"Done. Broken links: {len(broken)}")


