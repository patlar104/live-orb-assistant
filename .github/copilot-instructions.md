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
  - Attaches `AnalyserNode` to audio node, extracts frequency bin data
  - Exposes `.data` (Uint8Array) for real-time frequency values

### Audio Data Flow

```
Mic → InputAudioContext (16kHz) → ScriptProcessorNode → Gemini API
                                                          ↓
Gemini API → OutputAudioContext (24kHz) → AudioBufferSourceNode → Speaker
```

### Shaders & Visual Rendering

- **`backdrop-shader.ts`**: RawShaderMaterial (GLSL3) for environment background
- **`sphere-shader.ts`**: Vertex shader modifying sphere based on uniform data
- Uniforms passed each frame: `time`, `inputData` (3 frequency bands), `outputData` (3 bands)
- Animation loop updates shader uniforms from frequency analyzer data

## Development Workflows

### Essential Commands

```bash
npm run dev        # Vite dev server (http://localhost:5173)
npm run build      # Production build → dist/
npm run preview    # Preview built app locally
npm run lint       # ESLint checking (no auto-fix by default)
npm run format     # Prettier format all files
```

### Environment Setup

- Copy `.env.example` → `.env.local`
- Set `GEMINI_API_KEY` to your Google Gemini API key
- Key used in `index.tsx` constructor: `new GoogleGenAI({apiKey: process.env.GEMINI_API_KEY})`

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

- Two separate contexts required: Gemini input (16kHz) and output (24kHz)
- Always call `audioContext.resume()` before recording (browser autoplay policy)
- Use `ScriptProcessor` for PCM capture; convert Float32 → Int16 for Gemini API (`utils.ts`)
- Clean up: disconnect nodes and stop media stream tracks in `stopRecording()`

### Gemini Live API Integration

- Model: `gemini-2.5-flash-native-audio-preview-09-2025`
- Session callbacks: `onopen`, `onmessage`, `onerror`, `onclose`
- Audio output comes as base64-encoded 24kHz data in `message.serverContent?.modelTurn?.parts[0]?.inlineData`
- Use `decode()` and `decodeAudioData()` from `utils.ts` to convert to `AudioBuffer`
- Handle `interrupted` flag to stop playback when user speaks

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
- No wildcard imports in production code; use named imports

### File Organization

- Component files match custom element names: `GdmLiveAudio` → `index.tsx`, `GdmLiveAudioVisuals3D` → `visual-3d.ts`
- Utility modules (e.g., `utils.ts`, `analyser.ts`) are private to this project; no public exports

## Critical Integration Points

### Browser APIs

- **`MediaDevices.getUserMedia()`**: Request mic access; handle rejection gracefully
- **`AudioContext`**: Created with custom sample rates; call `.resume()` before playback
- **`ScriptProcessor` (deprecated but used here)**: Legacy API for PCM buffer access; plan for replacement with `AudioWorklet` if latency issues arise

### Gemini API Quirks

- Interrupted flag may arrive without audio data; handle stopping playback
- Base64-encoded audio requires decoding before Web Audio API use
- Voice name: `'Orus'` (specify in `speechConfig.voiceConfig.prebuiltVoiceConfig`)
- Session remains open; call `.close()` to reset

### Loading Assets

- EXR texture (`piz_compressed.exr`) loaded from root public dir; ensure file exists in build output
- `EXRLoader` is async; sphere remains hidden until texture loads for visual consistency

## Debugging & Common Issues

- **No sound output**: Check `outputNode.connect(outputAudioContext.destination)` and speaker volume
- **Microphone not working**: Ensure HTTPS (or localhost) for `getUserMedia()`; check browser permissions
- **Analyser data always zero**: Confirm `Analyser` instance attached to correct audio node and `update()` called each frame
- **Shader uniforms not updating**: Verify `sphereMaterial.userData.shader` exists (only after first fragment compiled)
- **Build fails**: Run `npm install` and check `process.env.GEMINI_API_KEY` is set in `.env.local`
