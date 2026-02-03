# AI Agent Instructions — Live Orb Assistant

## Project Overview

**Live Orb Assistant** is a Lit-based web app streaming audio to Gemini Live API with real-time 3D audio visualization. It captures 16kHz PCM mic input, sends to Gemini, receives 24kHz audio output, and renders an interactive Three.js orb that responds to audio frequency data.

## Architecture & Key Components

### Component Structure (Lit Web Components)

- **`index.tsx`** (`GdmLiveAudio`): Main Lit component managing Gemini Live session, audio I/O, and lifecycle
  - Two separate `AudioContext` instances: input (16kHz) and output (24kHz)
  - Audio chains: mic → `ScriptProcessorNode` (256 buffer) → Gemini API
  - Gemini responses decoded and queued via `AudioBufferSourceNode`
  - Controls: Start/Stop recording, Reset session
- **`visual-3d.ts`** (`GdmLiveAudioVisuals3D`): Three.js renderer managing 3D orb and backdrop
  - Receives `inputNode` and `outputNode` as Lit properties
  - Creates `Analyser` instances (see below) attached to audio nodes
  - Renders with post-processing: bloom + FXAA (currently FXAA disabled)
  - EXR environment texture (`piz_compressed.exr`) for sphere reflection

- **`analyser.ts`**: Audio frequency analyzer wrapper
  - Hardcoded FFT size: 32 (resulting in 16 frequency bins via `frequencyBinCount`)
  - Attaches `AnalyserNode` to audio node, extracts frequency bin data via `getByteFrequencyData()`
  - Exposes `.data` (Uint8Array, 0–255 range) for real-time frequency values
  - **Legacy**: `visual.ts` contains unused 2D canvas-based visualizer; `visual-3d.ts` is the active 3D renderer

### Audio Data Flow

```
Mic → InputAudioContext (16kHz) → ScriptProcessorNode → Gemini API
                                                          ↓
Gemini API → OutputAudioContext (24kHz) → AudioBufferSourceNode → Speaker
```

### Shaders & Visual Rendering

- **`backdrop-shader.ts`**: RawShaderMaterial (GLSL3) with distance-based gradient and procedural noise
  - Uniforms: `resolution`, `rand` (randomized each frame for noise variation)
  - E2E mode: `VITE_E2E_STABLE_VISUALS=1` forces `rand=0` for deterministic snapshots
- **`sphere-shader.ts`**: Vertex shader applying audio-driven spherical deformation
  - Uniforms: `time` (accumulates), `inputData` (Vec4), `outputData` (Vec4)
  - Each uniform component frequency band (x, y, z) controls different deformation amplitudes
  - Deformation uses sine waves: `sin(band * pos.component + time)` for organic ripple effect
  - Recalculates normals via tangent/bitangent cross product for correct lighting
- Animation loop updates shader uniforms from frequency analyzer data; frequency scaling factors:
  - Input band scales: x=1, y=0.1, z=10; Output band scales: x=2, y=0.1, z=10

## Development Workflows

### Essential Commands

```bash
npm run dev        # Vite dev server (http://localhost:3000, hosted on 0.0.0.0)
npm run build      # Production build → dist/ (note: large bundle as Three.js bundled)
npm run preview    # Preview built app locally
npm run lint       # ESLint checking (no auto-fix by default)
npm run test:e2e   # Playwright e2e + visual snapshots
npm run format     # Prettier format all files
```

### Environment Setup

- Copy `.env.example` → `.env.local`
- Set `GEMINI_API_KEY` to your Google Gemini API key
- Vite config defines both `process.env.GEMINI_API_KEY` and `process.env.API_KEY` (legacy name)
- Vite `define` injects: `process.env.GEMINI_API_KEY` at build time from `.env.local`
- Key accessed in `index.tsx` constructor: `new GoogleGenAI({apiKey: process.env.GEMINI_API_KEY})`
- Playwright e2e sets `VITE_E2E_DISABLE_LIVE=1` and `VITE_E2E_STABLE_VISUALS=1` in `playwright.config.ts` for deterministic tests

### Git Hooks (Husky + lint-staged)

- **Pre-commit**: Auto-formats staged `.ts/.tsx` files with Prettier, then runs ESLint --fix. Blocks commit if lint errors remain.
- **Pre-push**: Runs `npm run build` to ensure code compiles.

## Code Patterns & Conventions

### Lit Web Components

- Use `@customElement()` for registration
- Use `@state()` for reactive properties, `@property()` for inputs
- Static `styles` with tagged template literals
- `render()` method returns `html` template
- Lifecycle: `connectedCallback()`, `firstUpdated()`, `updated()`

### Audio Context Management

- **Two separate contexts required**: Gemini input (16kHz) and output (24kHz)
- Always call `audioContext.resume()` before recording (browser autoplay policy)
- **Input pipeline**: `getUserMedia()` → `mediaStreamSource` → `inputNode` (GainNode) → `scriptProcessorNode` (256 buffer) → PCM chunks via `createBlob()`
- **Output pipeline**: Gemini API → base64 → `decode()` → `decodeAudioData()` (24kHz) → `AudioBufferSourceNode` → `outputNode` → destination
- **Audio Playback Timing**: Uses `nextStartTime` to queue buffers sequentially (prevents overlapping audio)
  - On audio response: `nextStartTime = max(nextStartTime, currentTime)`, then `source.start(nextStartTime); nextStartTime += audioBuffer.duration`
  - On interrupted flag: stop all sources, reset `nextStartTime = 0`
- Convert Float32 → Int16 for Gemini API in `createBlob()` from `utils.ts`
- Clean up: disconnect nodes and stop media stream tracks in `stopRecording()`

### Gemini Live API Integration

- Model: `gemini-2.5-flash-native-audio-preview-09-2025`
- Session initialization: `client.live.connect({model, callbacks:{onopen, onmessage, onerror, onclose}, config:{responseModalities, speechConfig}})`
- **Config specifics**: `responseModalities: [Modality.AUDIO]`, voice name: `'Orus'` in `prebuiltVoiceConfig`
- **Response handling**: Audio output is base64-encoded 24kHz PCM in `message.serverContent?.modelTurn?.parts[0]?.inlineData`
- **Output audio decoding**: `decode(audio.data)` → Uint8Array → `decodeAudioData()` with context, sampleRate (24000), numChannels (1)
- **Interrupted flag**: `message.serverContent?.interrupted` signals user speech detected; immediately stop all playing sources and reset playback queue
- Convert and send PCM: `session.sendRealtimeInput({media: createBlob(pcmData)})` on each `scriptProcessorNode.onaudioprocess` event
- Session persists; call `.close()` to reset or create new session
- E2E mode: `VITE_E2E_DISABLE_LIVE=1` skips live session init and uses a no-op session for UI tests

### Three.js & Shaders

- Use `RawShaderMaterial` for custom GLSL3 shaders (requires `glslVersion: THREE.GLSL3`)
- Load EXR texture early with `EXRLoader` and apply to sphere via PMREM generator
- Update shader uniforms each animation frame via `sphereMaterial.userData.shader.uniforms`
- Analyser data (0–255 range) is passed directly to shaders; normalize as needed

### Type System

- **Target**: ES2022 with ESNext modules
- **Decorators**: Experimental decorators enabled (`experimentalDecorators: true`)
- **JSX**: `react-jsx` (for Lit's `html` template tag compatibility)
- No explicit type annotations needed for Lit decorators; infer from initial state
- Use `AudioNode` type for audio context nodes (parent of `AnalyserNode`, `GainNode`, etc.)

## Code Style

### Linting & Formatting

- **ESLint**: Flat config (v9.0+) with TypeScript support; enforces `@typescript-eslint` rules
- **Prettier**: Single quotes, 80-char line width, trailing commas (es5), 2-space tabs
- No semicolon stripping (semi: true)
- Disabled conflicting ESLint rules via `eslint-config-prettier`

### Import Organization

- ES modules throughout (`"type": "module"` in package.json)
- Import from specific files: `import {GdmLiveAudio} from './index'` (no barrel exports)
- Avoid wildcard imports except `import * as THREE` (preferred for Three.js) or when required by library APIs

### File Organization

- Component files match custom element names: `GdmLiveAudio` → `index.tsx`, `GdmLiveAudioVisuals3D` → `visual-3d.ts`
- Utility modules (e.g., `utils.ts`, `analyser.ts`) are private to this project; no public exports

## Critical Integration Points

### Dependency Loading

- **importmap (esm.sh CDN)**: `index.html` uses CDN imports for `lit`, `@lit/context`, `@google/genai`, `three`
  - Vite build **bundles** dependencies into `dist/assets` by default; importmap remains but is largely unused in the bundled output
  - Keep importmap versions aligned with `package.json` to avoid dev/prod mismatches
  - Chunk size warning in build output (814kB) indicates `three` is bundled; treat regressions as a signal to code-split or externalize

### Browser APIs

- **`MediaDevices.getUserMedia()`**: Request mic access; handle rejection gracefully; call `.resume()` on input context after grant
- **`AudioContext`**: Custom sample rates (16kHz input, 24kHz output); contexts created in `index.tsx` constructor
- **`ScriptProcessorNode`** (deprecated but used here): 256-sample buffer for PCM capture; plan replacement with `AudioWorklet` for lower-latency apps

### Gemini API Quirks

- Interrupted flag may arrive without audio data; handle stopping playback
- Base64-encoded audio requires decoding before Web Audio API use
- Voice name: `'Orus'` (specify in `speechConfig.voiceConfig.prebuiltVoiceConfig`)
- Session remains open; call `.close()` to reset

### Loading Assets

- EXR texture (`piz_compressed.exr`) must reside in `public/` directory; Vite copies to dist root
- `EXRLoader` is async (`.load()` callback); sphere (`visible=false`) until texture loaded and PMREM generator applies it
- **Critical**: If texture fails to load, sphere renders black (visible: false remains); check console for 404 errors

## Specialized Skills & Expert Agents

### Available Skill Specialists (2026)

The project leverages 5 specialized expert agents beyond the 5 core personas (10 total). `.github/agents/` is the source of truth; `.vscode/agents/` mirrors these for VS Code Copilot selection.

- **Performance Profiler**: Real-time FPS monitoring, audio latency tracking (input→API→output), frame budget analysis, shader performance metrics
- **Type Safety Auditor**: TypeScript validation, unsafe pattern detection, strict type enforcement, null safety checks
- **Shader Visual Debugger**: Image-based shader inspection, normal lighting artifact detection, bloom effect analysis using VS Code `imageInput` capability
- **Audio Data Analyzer**: PCM buffer inspection, frequency bin validation, timing precision checks, corruption detection
- **Environment Manager**: `.env.local` validation, API key security, build configuration management, secret rotation

### Quick Escalation Guide

```
Issue: FPS drops at startup
→ Performance Profiler → Graphics Specialist (if shader) → Build Engineer

Issue: TypeScript errors after refactor
→ Type Safety Auditor → Frontend Architect

Issue: Shader artifacts visible
→ Shader Visual Debugger → Graphics Specialist

Issue: Audio stuttering/dropout
→ Audio Data Analyzer → Audio Engineer

Issue: Build key missing
→ Environment Manager → Build Engineer
```

## Debugging & Common Issues

- **No sound output**: Verify `outputNode.connect(outputAudioContext.destination)` in `index.tsx`; check speaker volume; confirm audio context resumed
  - 🔧 **Use**: Audio Data Analyzer to inspect PCM buffers, Audio Engineer to check interrupts
- **Microphone not working**: Use HTTPS or localhost for `getUserMedia()`; check browser permissions; verify media stream callbacks in "Requesting microphone access" UI state
  - 🔧 **Use**: Audio Engineer for getUserMedia flow, Performance Profiler for timing
- **Analyser data always zero**: Confirm `Analyser` instance attached to output/input node (set via Lit property); call `update()` every animation frame in `visual-3d.ts`
  - 🔧 **Use**: Performance Profiler to check animation frame timing, Audio Data Analyzer for bin validation
- **Sphere not visible until texture loads**: Expected behavior; wait for EXR async load; check Network tab for `piz_compressed.exr` 200 status
  - 🔧 **Use**: Shader Visual Debugger to inspect texture load state
- **Shader uniforms not updating**: Verify `sphereMaterial.userData.shader` populated after first fragment compile; confirm `this.sphere.visible = true` after texture load
  - 🔧 **Use**: Shader Visual Debugger with image capture to debug uniform state, Performance Profiler for frame timing
- **Frequency deformation not responsive**: Confirm Analyser connected to correct output node; scale factors (x=2, y=0.1, z=10) may be too extreme—adjust in `visual-3d.ts` line assigning `uniforms.outputData`
  - 🔧 **Use**: Audio Data Analyzer to check frequency bin ranges, Graphics Specialist to adjust scales
- **Build fails**: Run `npm install`; verify `process.env.GEMINI_API_KEY` defined in `.env.local`; check Vite define in vite.config.ts
  - 🔧 **Use**: Environment Manager for config validation, Build Engineer for compilation
- **Large bundle size (814kB)**: Expected; Three.js bundled in the main chunk. If reducing size, check `dist/assets/index-*.js` and consider code-splitting
  - 🔧 **Use**: Build Engineer for bundle analysis, Performance Profiler for load time metrics
- **Playwright snapshot failures**: Rebaseline with `npm run test:e2e -- --update-snapshots`; snapshots are OS-specific (darwin/linux/win)
  - 🔧 **Use**: Shader Visual Debugger for visual diffs, Build Engineer for test config
