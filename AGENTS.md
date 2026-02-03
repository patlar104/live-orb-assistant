# Agents

This repo uses specialized agent guides in `.github/agents/`. Those files are the source of truth. This file summarizes when to use each agent, plus the most common workflows and commands.

**Agent Roster**

| Agent                             | Focus                                       | Spec                                                    |
| --------------------------------- | ------------------------------------------- | ------------------------------------------------------- |
| Lit Frontend Architect            | Lit components, UI state, lifecycle, props  | `.github/agents/Frontend-Architect.agent.md`            |
| Audio Data Analyzer               | PCM integrity, frequency bins, timing       | `.github/agents/audio-data-analyzer.agent.md`           |
| Audio Pipeline Engineer           | Web Audio + Gemini PCM pipeline             | `.github/agents/audio-pipeline-engineer.agent.md`       |
| Build & Performance Optimizer     | Vite, lint/format, hooks, bundle            | `.github/agents/build-engineer.agent.md`                |
| Environment Manager               | `.env.local`, secrets, config hygiene       | `.github/agents/environment-manager.agent.md`           |
| Gemini API Integration Specialist | Gemini Live session, callbacks, voice/model | `.github/agents/gemini-integration-specialist.agent.md` |
| Graphics & Shader Specialist      | Three.js, GLSL, EXR, post-processing        | `.github/agents/graphics-specialist.agent.md`           |
| Performance Profiler              | FPS, frame timing, latency budgets          | `.github/agents/performance-profiler.agent.md`          |
| Shader Visual Debugger            | Shader artifacts, uniform validation        | `.github/agents/shader-visual-debugger.agent.md`        |
| Type Safety Auditor               | TypeScript strictness, null safety          | `.github/agents/type-safety-auditor.agent.md`           |

**Workflow Guide**

1. UI or component behavior changes → Lit Frontend Architect. If types fail → Type Safety Auditor. If visuals break → Graphics & Shader Specialist or Shader Visual Debugger.
2. Audio capture/playback issues → Audio Pipeline Engineer. If PCM looks wrong or bins are stuck → Audio Data Analyzer. If visuals stop reacting → Graphics & Shader Specialist.
3. Gemini API connectivity or responses → Gemini API Integration Specialist. If credentials or `.env.local` issues → Environment Manager.
4. Performance regressions (FPS, latency, jank) → Performance Profiler. If shaders are hot → Graphics & Shader Specialist. If audio decode is hot → Audio Pipeline Engineer.
5. Build, lint, format, or tooling errors → Build & Performance Optimizer. If strict TS errors persist → Type Safety Auditor. If snapshots differ → Shader Visual Debugger.

**Recommended Workflows**

**First-time setup**

1. Install deps: `npm install`
2. Create env: `cp .env.example .env.local` and set `GEMINI_API_KEY`
3. Start dev server: `npm run dev`
4. Open http://localhost:3000 and click Start Recording

**Daily dev loop**

1. Run: `npm run dev`
2. If changing UI or Lit props: Lit Frontend Architect
3. If touching audio: Audio Pipeline Engineer or Audio Data Analyzer
4. If touching shaders/Three: Graphics & Shader Specialist or Shader Visual Debugger
5. Before PR: `npm run lint` then `npm run build`

**Visual changes (shader/Three.js)**

1. Run: `npm run dev`
2. Validate deformation and bloom in browser
3. If artifacts appear: Shader Visual Debugger
4. If FPS drops: Performance Profiler

**Audio pipeline changes**

1. Run: `npm run dev`
2. Confirm mic permission and speech round-trip
3. If bins are zero: Audio Data Analyzer
4. If playback gaps: Audio Pipeline Engineer

**Gemini Live API issues**

1. Check `.env.local` for `GEMINI_API_KEY`
2. Run: `npm run dev`
3. If callbacks fail: Gemini API Integration Specialist
4. If key missing/invalid: Environment Manager

**E2E snapshot updates**

1. Run: `npm run test:e2e -- --update-snapshots`
2. If diffs look wrong: Shader Visual Debugger
3. If tests flake: Build & Performance Optimizer

**Release Checklist (Full)**

1. Confirm clean tree: `git status`
2. Update version in `package.json` (and `package-lock.json` if policy requires)
3. Update or create `CHANGELOG.md`
4. Run: `npm run lint`
5. Run: `npm run build`
6. Run: `npm run test:e2e`
7. Run secret/bundle scans (see Env and secret checks)
8. Smoke test: `npm run preview` and verify http://localhost:3000
9. Tag: `git tag -a vX.Y.Z -m "vX.Y.Z"`
10. Push tags: `git push --tags`
11. Draft GitHub release notes from `CHANGELOG.md`

**Performance Profiling (Deep-dive)**

1. Start dev server: `npm run dev`
2. Record 10–20s in Chrome DevTools Performance while speaking
3. Target frame time ≤ 16.7ms and ≥ 60 FPS
4. Target end-to-end audio latency < 200ms
5. Log queue depth: `nextStartTime - currentTime` should stay 0.1–0.5s
6. Use deterministic visuals if needed: `VITE_E2E_STABLE_VISUALS=1 npm run dev`
7. If hot spots appear, escalate to Performance Profiler or Graphics & Shader Specialist

**Shader Debug Recipe (Deep-dive)**

1. Verify `piz_compressed.exr` loads with 200 status in Network tab
2. Confirm `sphere.visible = true` after EXR load
3. Inspect uniforms: `sphereMaterial.userData.shader.uniforms`
4. Validate analyser bins are non-zero: `window.analyser?.data`
5. Common fixes: recompute normals, confirm envMap set, verify time accumulation

**Command Cheatsheet**

Dev and build:

```bash
npm run dev
npm run build
npm run preview
```

Quality:

```bash
npm run lint
npm run format
npx tsc --listFiles --diagnostics
```

E2E:

```bash
npm run test:e2e
npm run test:e2e -- --update-snapshots
npx playwright test --ui
```

Release:

```bash
git status
git tag -a vX.Y.Z -m "vX.Y.Z"
git push --tags
```

Profiling and debug:

```bash
npm run dev
VITE_E2E_STABLE_VISUALS=1 npm run dev
```

Env and secret checks (run after `npm run build` for bundle scans):

```bash
ls -la .env.local
grep "GEMINI_API_KEY" vite.config.ts
grep -r "sk-" dist/
strings dist/assets/index-*.js | grep -i "key\|secret\|api"
git ls-files .env.local
```

Smoke tests:

```bash
npm run build
npm run preview
```

**Notes**

- `.github/copilot-instructions.md` also describes the agent model and escalation guidance.
- Treat `.github/agents/` as authoritative; update this file when those specs change.
