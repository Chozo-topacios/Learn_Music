# Graph Report - Learn_Music  (2026-11-09)

## Corpus Check
- 7 files · ~13,797 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 2 file(s) not represented in the graph (top: .webmanifest 1, .css 1)

## Summary
- 162 nodes · 312 edges · 13 communities (9 shown, 4 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 9 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `700c443b`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- app.js
- h
- pages.yml
- dayKey
- isBlack
- shuffle
- playNote
- 🎹 Notitas — piano y música jugando
- importCode
- exportCode
- CLAUDE.md
- .claude/CLAUDE.md
- sw.js

## God Nodes (most connected - your core abstractions)
1. `h()` - 27 edges
2. `go()` - 15 edges
3. `leagueScreen()` - 13 edges
4. `screen()` - 12 edges
5. `profileScreen()` - 12 edges
6. `dayKey()` - 11 edges
7. `runChallenge()` - 11 edges
8. `profilesScreen()` - 11 edges
9. `me()` - 10 edges
10. `homeScreen()` - 10 edges

## Surprising Connections (you probably didn't know these)
- `go()` --indirect_call--> `challengeScreen()`  [INFERRED]
  app.js → app.js  _Bridges community 1 → community 3_
- `runChallenge()` --calls--> `rnd()`  [EXTRACTED]
  app.js → app.js  _Bridges community 5 → community 3_
- `result()` --calls--> `pick()`  [EXTRACTED]
  app.js → app.js  _Bridges community 5 → community 1_
- `piano()` --calls--> `h()`  [EXTRACTED]
  app.js → app.js  _Bridges community 1 → community 4_
- `handleSync()` --calls--> `toast()`  [EXTRACTED]
  app.js → app.js  _Bridges community 1 → community 8_

## Import Cycles
- None detected.

## Communities (13 total, 4 thin omitted)

### Community 0 - "app.js"
Cohesion: 0.04
Nodes (44): ALL12, app, AVATARS, BADGES, BASS1, BASS2, BASS3, BLK (+36 more)

### Community 1 - "h"
Cohesion: 0.19
Nodes (29): boot(), createScreen(), figSVG(), freshen(), go(), h(), homeScreen(), isUnlocked() (+21 more)

### Community 2 - "pages.yml"
Cohesion: 0.08
Nodes (23): concurrency, cancel-in-progress, group, environment, runs-on, steps, name, url (+15 more)

### Community 3 - "dayKey"
Cohesion: 0.20
Nodes (15): addXp(), challengeScreen(), confetti(), dayKey(), hashStr(), mulberry32(), newPlayer(), pad() (+7 more)

### Community 4 - "isBlack"
Cohesion: 0.22
Nodes (10): chordName(), isBlack(), noteName(), pcName(), piano(), rangeFor(), songLesson(), staffSVG() (+2 more)

### Community 5 - "shuffle"
Cohesion: 0.22
Nodes (9): buildLesson(), noteChoices(), numChoices(), pick(), pickOthers(), randMelody(), rnd(), shuffle() (+1 more)

### Community 6 - "playNote"
Cohesion: 0.33
Nodes (6): audio(), freq(), playChord(), playNote(), playSeq(), tone()

### Community 7 - "🎹 Notitas — piano y música jugando"
Cohesion: 0.33
Nodes (5): Competir en dispositivos distintos, Cómo abrirla, Desarrollo, 🎹 Notitas — piano y música jugando, ¿Qué tiene?

### Community 8 - "importCode"
Cohesion: 0.50
Nodes (4): b64d(), handleSync(), importCode(), mergePlayer()

## Knowledge Gaps
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `h()` connect `h` to `app.js`, `dayKey`, `isBlack`?**
  _High betweenness centrality (0.027) - this node is a cross-community bridge._
- **Are the 4 inferred relationships involving `go()` (e.g. with `challengeScreen()` and `homeScreen()`) actually correct?**
  _`go()` has 4 INFERRED edges - model-reasoned connections that need verification._
- **Should `app.js` be split into smaller, more focused modules?**
  _Cohesion score 0.0392156862745098 - nodes in this community are weakly interconnected._
- **Are the 2 inferred relationships involving `leagueScreen()` (e.g. with `go()` and `freshen()`) actually correct?**
  _`leagueScreen()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **Should `pages.yml` be split into smaller, more focused modules?**
  _Cohesion score 0.08333333333333333 - nodes in this community are weakly interconnected._
- **Are the 2 inferred relationships involving `profileScreen()` (e.g. with `go()` and `profilesScreen()`) actually correct?**
  _`profileScreen()` has 2 INFERRED edges - model-reasoned connections that need verification._