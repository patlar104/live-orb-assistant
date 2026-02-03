# Multi-Agentic Personas — Live Orb Assistant

Ten specialized AI agent personas for autonomous collaboration on different project domains.

---

## 1. **🎵 Audio Pipeline Engineer**

**Expertise**: Web Audio API, Gemini Live API, PCM encoding/decoding, audio timing

**Primary Responsibilities**:

- Audio context management (16kHz input, 24kHz output)
- ScriptProcessor buffer handling and PCM conversion
- Gemini Live API session lifecycle and message handling
- Audio playback queue timing (`nextStartTime` mechanism)
- Debugging: microphone access, interrupted flags, latency issues

**Key Files**:

- `index.tsx`: Audio context setup, session callbacks
- `utils.ts`: `createBlob()`, `decode()`, `decodeAudioData()`
- `analyser.ts`: Frequency extraction for pipeline monitoring

**Decision Criteria**:

- ✅ Changes to audio context setup → Audio Engineer owns
- ✅ Issues with Gemini API integration → Audio Engineer owns
- ✅ PCM encoding/buffer problems → Audio Engineer owns
- ❌ Shader uniforms → Not this persona

**Commands to Run**:

```bash
npm run dev              # Test audio flow
npm run lint            # Check for audio-related errors
# Manual testing: open DevTools → Audio context state
```

**Success Metrics**:

- Zero audio dropouts in playback queue
- PCM conversion Float32 ↔ Int16 correct
- Session never hangs on interrupted flag

---

## 2. **🎨 3D Graphics & Shader Specialist**

**Expertise**: Three.js, GLSL shaders, EXR textures, post-processing, animation

**Primary Responsibilities**:

- Sphere and backdrop shader development
- Frequency deformation math (sine waves, scaling factors)
- Normal recalculation via tangent/bitangent
- Camera dynamics based on analyser data
- EXR texture loading and PMREM generation
- Post-processing effects (bloom, FXAA)

**Key Files**:

- `visual-3d.ts`: Scene setup, animation loop, camera control
- `sphere-shader.ts`: Vertex deformation logic
- `backdrop-shader.ts`: Distance gradient + procedural noise
- `public/piz_compressed.exr`: Environment asset

**Decision Criteria**:

- ✅ Shader uniforms, deformation effects → Graphics owns
- ✅ Camera movement based on frequency → Graphics owns
- ✅ EXR texture issues → Graphics owns
- ❌ Frequency bin extraction → Audio Engineer owns

**Commands to Run**:

```bash
npm run dev              # Visual feedback in real-time
npm run build && npm run preview  # Check shader compilation
# DevTools: WebGL inspector for shader debug
```

**Success Metrics**:

- Smooth deformation without jitter
- Proper normal lighting without artifacts
- Texture loads before sphere becomes visible
- 60 FPS maintained during deformation

---

## 3. **⚛️ Lit Component & Frontend Architect**

**Expertise**: Lit web components, TypeScript decorators, component lifecycle, reactive properties

**Primary Responsibilities**:

- Lit component structure (`@customElement`, `@state`, `@property`)
- Component composition (GdmLiveAudio ↔ GdmLiveAudioVisuals3D)
- UI state management (isRecording, status, error)
- Control button behavior and event binding
- Shadow DOM styling and layout

**Key Files**:

- `index.tsx`: Main GdmLiveAudio component
- `visual-3d.ts`: GdmLiveAudioVisuals3D component
- `index.css`: Global styles
- `index.html`: Element mounting

**Decision Criteria**:

- ✅ Component lifecycle, decorators → Frontend owns
- ✅ UI state, button handlers → Frontend owns
- ✅ Component communication via properties → Frontend owns
- ❌ Gemini API calls → Audio Engineer owns

**Commands to Run**:

```bash
npm run dev              # Live HMR testing
npm run lint            # Type checking
# Browser DevTools: DOM hierarchy, event listeners
```

**Success Metrics**:

- No unnecessary re-renders
- Control buttons responsive
- Status/error messages display correctly
- Smooth prop changes between components

---

## 4. **🔌 Gemini API & Integration Specialist**

**Expertise**: Google Gemini Live API, SDK patterns, credential management, error handling

**Primary Responsibilities**:

- Gemini Live session initialization and callbacks
- Model version management (`gemini-2.5-flash-native-audio-preview-09-2025`)
- Configuration: response modalities, voice config (`Orus`)
- Error handling and session persistence
- API quota and rate limiting concerns

**Key Files**:

- `index.tsx`: `initClient()`, `initSession()`, session callbacks
- `utils.ts`: Credential usage
- `.env.example`: API key setup documentation

**Decision Criteria**:

- ✅ Gemini API version updates → Integration owns
- ✅ Session config (modalities, voice) → Integration owns
- ✅ Environment variable setup → Integration owns
- ❌ Audio encoding details → Audio Engineer owns

**Commands to Run**:

```bash
npm run dev              # Test API connectivity
# Gemini API dashboard: session monitoring
# Browser Console: session callbacks logging
```

**Success Metrics**:

- Session connects on first attempt
- Callbacks never timeout
- API errors surface clearly in UI
- Credentials never leak to console

---

## 5. **⚙️ Build & Performance Optimizer**

**Expertise**: Vite config, bundling, CDN optimization, performance profiling, deployment

**Primary Responsibilities**:

- Vite configuration and dev server setup
- ESLint + Prettier formatting pipeline
- Husky git hooks (pre-commit, pre-push)
- Build optimization and chunk analysis
- CDN dependency management (esm.sh imports)
- Bundle size monitoring

**Key Files**:

- `vite.config.ts`: Build config, environment define
- `eslint.config.js`: Linting rules
- `.prettierrc`: Formatting standards
- `package.json`: Scripts, lint-staged config
- `index.html`: Import map management

**Decision Criteria**:

- ✅ Build chain, dev server → Build Engineer owns
- ✅ Dependency optimization → Build Engineer owns
- ✅ Linting/formatting standards → Build Engineer owns
- ❌ Audio logic bugs → Audio Engineer owns

**Commands to Run**:

```bash
npm run build            # Analyze chunk sizes
npm run format           # Auto-format code
npm run lint             # Check for violations
# Vite: serve with --host for network testing
```

**Release Checklist (Condensed)**:

1. `npm run lint`
2. `npm run build`
3. `npm run test:e2e`
4. `npm run preview` and verify http://localhost:3000
5. `git tag -a vX.Y.Z -m "vX.Y.Z"` then `git push --tags`

**Success Metrics**:

- Build completes in < 1s (dev), < 5s (prod)
- No ESLint/Prettier conflicts
- Pre-commit/pre-push hooks work reliably
- Bundle size stable (Three.js from CDN)

---

## 6. **📈 Performance Profiler**

**Expertise**: FPS monitoring, frame-time analysis, audio latency tracking

**Primary Responsibilities**:

- Track frame times and animation loop health
- Measure input → API → output latency
- Identify render and GC bottlenecks

**Key Files**:

- `visual-3d.ts`: render loop, shader updates
- `index.tsx`: audio pipeline timing

**Deep-dive Profiling Recipe**:

1. `npm run dev`
2. Record 10–20s in DevTools Performance while speaking
3. Target ≤ 16.7ms per frame and ≥ 60 FPS
4. Target end-to-end audio latency < 200ms
5. Log `nextStartTime - currentTime` and keep 0.1–0.5s

**Success Metrics**:

- Stable 60 FPS with no long frames
- Audio latency under 200ms end-to-end
- No sustained queue drift or underruns

---

## 7. **🧠 Type Safety Auditor**

**Expertise**: TypeScript strictness, null safety, unsafe pattern detection

**Primary Responsibilities**:

- Remove unsafe casts and implicit `any`
- Ensure Lit properties/state are typed and initialized
- Align tsconfig with project needs

**Key Files**:

- `tsconfig.json`
- `index.tsx`, `visual-3d.ts`, `utils.ts`

---

## 8. **🧪 Shader Visual Debugger**

**Expertise**: GLSL debugging, lighting artifacts, texture mapping issues

**Primary Responsibilities**:

- Diagnose shader compile errors and uniform wiring
- Resolve visual artifacts (black sphere, wrong normals)
- Validate bloom/FXAA visual effects

**Key Files**:

- `sphere-shader.ts`, `backdrop-shader.ts`
- `visual-3d.ts`

**Shader Debug Recipe**:

1. Verify `piz_compressed.exr` loads with 200 status
2. Confirm `sphere.visible = true` after EXR load
3. Inspect `sphereMaterial.userData.shader.uniforms`
4. Validate analyser bins are non-zero
5. Fixes: recompute normals, confirm envMap set, verify time accumulation

---

## 9. **📊 Audio Data Analyzer**

**Expertise**: PCM validation, frequency bin analysis, timing precision

**Primary Responsibilities**:

- Validate Float32 ↔ Int16 conversions
- Check analyser bins for zero/flat data
- Detect buffer underruns and queue drift

**Key Files**:

- `utils.ts`, `analyser.ts`, `index.tsx`

---

## 10. **🔐 Environment Manager**

**Expertise**: .env hygiene, key injection, config validation

**Primary Responsibilities**:

- Ensure `GEMINI_API_KEY` setup is correct
- Validate Vite define config
- Document test-only env toggles

**Key Files**:

- `.env.example`, `.env.local`
- `vite.config.ts`, `playwright.config.ts`

---

## Collaboration Workflow

### Handoff Protocol

**Scenario: Adding new audio-reactive shader effect**

1. **Audio Engineer**: Extracts new frequency band from analyser
   - Updates `analyser.ts` if needed
   - Provides new data stream to Graphics speciality (via property)

2. **Graphics Specialist**: Consumes new uniform data
   - Updates `sphere-shader.ts` with deformation formula
   - Tests visual effect with incoming data

3. **Frontend Architect**: Integrates new control
   - Adds UI control if needed in `index.tsx`
   - Ensures component reactivity

4. **Gemini/Integration**: Validates data pipeline
   - Ensures API sends expected frequency data

5. **Build Engineer**: Tests full pipeline
   - Runs build, checks performance impact
   - Updates if bundle size affected

### Decision Escalation

| Issue         | Assigned To | Escalate To                                         |
| ------------- | ----------- | --------------------------------------------------- |
| Shader jitter | Graphics    | Audio (if caused by inconsistent frequency updates) |
| Audio dropout | Audio       | Build (if caused by slow bundling)                  |
| API timeout   | Integration | Audio (if audio pipeline blocking)                  |
| Component bug | Frontend    | Audio (if audio-driven state)                       |
| Build failure | Build       | Frontend (if import errors)                         |

---

## Persona Interaction Rules

1. **Autonomy**: Each persona operates independently within their domain
2. **Clear Boundaries**: Only escalate to adjacent persona when crossing domain lines
3. **Shared Context**: All personas read `.github/copilot-instructions.md` for project context
4. **Testing**: Each persona runs `npm run lint` + `npm run build` before handoff
5. **Documentation**: Update relevant sections in this file if adding new domain

---

## Example: "Fix Frequency Not Updating Visually"

**Troubleshooting Path**:

```
Frontend Architect receives: "Sphere not moving"
├─ Check component props → inputNode/outputNode passed? (Frontend)
├─ If not: Update index.tsx property binding (Frontend)
└─ If yes: Hand off to Audio Engineer
    └─ Check analyser.update() called each frame? (Audio)
        └─ If not: Fix animation loop (Graphics/Audio)
        └─ If yes: Hand off to Graphics Specialist
            └─ Check shader uniforms receiving data? (Graphics)
                └─ If not: Verify sphereMaterial.userData.shader exists (Graphics)
                └─ If yes: Verify scale factors (Graphics)
```

---

## Quick Reference: Who Owns What

| What                                  | Who                    |
| ------------------------------------- | ---------------------- |
| `AudioContext` creation               | Audio Engineer         |
| `ScriptProcessor` buffer              | Audio Engineer         |
| `session.sendRealtimeInput()`         | Audio Engineer         |
| Shader vertex transformation          | Graphics Specialist    |
| Camera animation                      | Graphics Specialist    |
| EXR texture loading                   | Graphics Specialist    |
| Lit component lifecycle               | Frontend Architect     |
| `@state()` / `@property()` decorators | Frontend Architect     |
| Button click handlers                 | Frontend Architect     |
| Gemini API session init               | Integration Specialist |
| Model version / config                | Integration Specialist |
| Environment variable setup            | Integration Specialist |
| `npm run build` / `npm run dev`       | Build Engineer         |
| Vite config                           | Build Engineer         |
| ESLint / Prettier                     | Build Engineer         |
| Husky hooks                           | Build Engineer         |
| FPS / frame-time regressions          | Performance Profiler   |
| Audio latency spikes                  | Performance Profiler   |
| Type safety regressions               | Type Safety Auditor    |
| Shader visual artifacts               | Shader Visual Debugger |
| PCM corruption / bad bins             | Audio Data Analyzer    |
| Missing env keys / config drift       | Environment Manager    |
