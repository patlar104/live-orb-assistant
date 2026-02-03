# Custom AI Agents for Live Orb Assistant

Ten specialized AI agent personas defined in this directory for VS Code Copilot Agent selection.

## 📋 Available Agents

### Core (5)

1. **audio-pipeline-engineer.md** — Web Audio API + PCM pipeline
2. **graphics-specialist.md** — Three.js + shaders
3. **frontend-architect.md** — Lit components + UI state
4. **gemini-integration-specialist.md** — Gemini Live API + session config
5. **build-engineer.md** — Vite + tooling + performance

### Specialists (5)

6. **performance-profiler.md** — FPS, frame budget, latency profiling
7. **type-safety-auditor.md** — TypeScript strictness + null safety
8. **shader-visual-debugger.md** — Visual shader inspection + artifacts
9. **audio-data-analyzer.md** — PCM validation + frequency bins
10. **environment-manager.md** — .env, API keys, build config hygiene

---

## 🚀 How to Use These Agents

### In VS Code

1. Open command palette: `Cmd+Shift+P` (Mac) or `Ctrl+Shift+P` (Windows/Linux)
2. Search: `GitHub Copilot: Select Agent`
3. Choose one of the custom agents from `.vscode/agents/`
4. Ask a question related to that agent's domain

---

## 🤝 Agent Collaboration

Each agent has clear ownership and escalation rules. Core agents should escalate to specialists when needed.

| Agent                  | Escalates To                                                   |
| ---------------------- | -------------------------------------------------------------- |
| Audio Engineer         | Audio Data Analyzer, Performance Profiler, Environment Manager |
| Graphics Specialist    | Shader Visual Debugger, Performance Profiler                   |
| Frontend Architect     | Type Safety Auditor, Graphics Specialist                       |
| Gemini Specialist      | Environment Manager, Audio Engineer                            |
| Build Engineer         | Type Safety Auditor, Performance Profiler                      |
| Performance Profiler   | Graphics Specialist, Audio Engineer                            |
| Type Safety Auditor    | Frontend Architect, Build Engineer                             |
| Shader Visual Debugger | Graphics Specialist                                            |
| Audio Data Analyzer    | Audio Engineer, Performance Profiler                           |
| Environment Manager    | Build Engineer, Gemini Specialist                              |

---

## 📝 Agent Structure

Each agent file contains:

```yaml
---
agent: true # Marks as VS Code custom agent
name: Display Name # Your chosen agent name
description: Brief description
---
# Full markdown instructions:
- Expertise
- Ownership (what they own vs. escalate)
- Key responsibilities
- Commands to run
- Success criteria
- Rules to follow
- When to escalate
```

---

## 💡 Best Practices

1. **One Agent Per Question**: Ask one agent, get focused expertise
2. **Provide Context**: Include error messages, file paths, symptoms
3. **Follow Escalation**: If agent says "ask X", do that next
4. **Reference Personas**: Agents reference `.github/personas.md` for collaboration rules
5. **Check Instructions**: Read `.github/copilot-instructions.md` for project context

---

## ⚡ Quick Agent Selector

- 🔊 Audio not working? → **Audio Pipeline Engineer**
- 📈 Latency or FPS drops? → **Performance Profiler**
- 🎬 Visuals not responding? → **Graphics Specialist**
- 🧪 Shader artifacts? → **Shader Visual Debugger**
- 🧠 Typescript errors? → **Type Safety Auditor**
- 📊 Frequency data wrong? → **Audio Data Analyzer**
- 🖱️ UI button broken? → **Lit Frontend Architect**
- 🔑 API won't connect? → **Gemini Specialist**
- 📦 Build errors? → **Build Engineer**
- 🔐 Env/key issues? → **Environment Manager**
