/* tslint:disable */
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  GoogleGenAI,
  LiveServerMessage,
  Modality,
  Session,
} from '@google/genai';
import { LitElement, css, html } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { createBlob, decode, decodeAudioData } from './utils';
import './visual-3d';
import type { GdmLiveAudioVisuals3D } from './visual-3d';

@customElement('gdm-live-audio')
export class GdmLiveAudio extends LitElement {
  @state() isRecording = false;
  @state() status = '';
  @state() error = '';
  @state() isShareBusy = false;
  @state() shareToast = '';

  private client: GoogleGenAI;
  private session: Session;
  private inputAudioContext = new (
    window.AudioContext || window.webkitAudioContext
  )({ sampleRate: 16000 });
  private outputAudioContext = new (
    window.AudioContext || window.webkitAudioContext
  )({ sampleRate: 24000 });
  @state() inputNode = this.inputAudioContext.createGain();
  @state() outputNode = this.outputAudioContext.createGain();
  private nextStartTime = 0;
  private mediaStream: MediaStream;
  private sourceNode: AudioBufferSourceNode;
  private scriptProcessorNode: ScriptProcessorNode;
  private sources = new Set<AudioBufferSourceNode>();
  private readonly liveDisabled = import.meta.env.VITE_E2E_DISABLE_LIVE === '1';

  static styles = css`
    :host {
      position: relative;
      display: block;
      width: 100vw;
      height: 100vh;
      font-family: 'Space Grotesk', 'IBM Plex Sans', 'Segoe UI', sans-serif;
      color: #f8f4ff;
    }

    #status {
      position: absolute;
      bottom: 4.5vh;
      left: 0;
      right: 0;
      z-index: 10;
      text-align: center;
      font-size: 13px;
      letter-spacing: 0.04em;
      color: rgba(255, 227, 227, 0.95);
      text-transform: uppercase;
    }

    #shareToast {
      position: absolute;
      bottom: 19vh;
      left: 0;
      right: 0;
      z-index: 10;
      text-align: center;
      color: #f6f2ff;
      font-size: 13px;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      text-shadow: 0 2px 12px rgba(0, 0, 0, 0.6);
    }

    .controls {
      z-index: 10;
      position: absolute;
      bottom: 8vh;
      left: 50%;
      transform: translateX(-50%);
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      padding: 14px 16px;
      border-radius: 999px;
      background: rgba(12, 10, 18, 0.62);
      border: 1px solid rgba(255, 255, 255, 0.12);
      backdrop-filter: blur(14px);
      box-shadow:
        0 20px 40px rgba(5, 2, 14, 0.45),
        inset 0 1px 0 rgba(255, 255, 255, 0.05);
      flex-wrap: wrap;
      max-width: min(720px, 92vw);
    }

    .control-button {
      --accent: #9ae6ff;
      --accent-soft: rgba(154, 230, 255, 0.2);
      display: inline-flex;
      align-items: center;
      gap: 10px;
      padding: 10px 16px 10px 12px;
      border-radius: 999px;
      border: 1px solid rgba(255, 255, 255, 0.14);
      appearance: none;
      outline: none;
      background: linear-gradient(
        135deg,
        rgba(255, 255, 255, 0.12),
        rgba(255, 255, 255, 0.04)
      );
      color: #f7f3ff;
      cursor: pointer;
      font-size: 13px;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      box-shadow: 0 8px 18px rgba(8, 5, 20, 0.35);
      transition:
        transform 0.18s ease,
        box-shadow 0.18s ease,
        border-color 0.18s ease,
        background 0.18s ease;
    }

    .control-button .icon {
      display: grid;
      place-items: center;
      width: 28px;
      height: 28px;
      border-radius: 999px;
      background: radial-gradient(
        circle at 30% 30%,
        var(--accent),
        var(--accent-soft)
      );
      color: #0c0b14;
      box-shadow: inset 0 0 12px rgba(255, 255, 255, 0.35);
    }

    .control-button .label {
      white-space: nowrap;
    }

    .control-button:hover {
      transform: translateY(-1px);
      border-color: rgba(255, 255, 255, 0.3);
      box-shadow:
        0 10px 24px rgba(8, 5, 20, 0.45),
        0 0 20px rgba(255, 255, 255, 0.08);
    }

    .control-button:active {
      transform: translateY(1px) scale(0.98);
    }

    .control-button:focus-visible {
      outline: 2px solid var(--accent);
      outline-offset: 3px;
    }

    .control-button.start {
      --accent: #ff9ab3;
      --accent-soft: rgba(255, 154, 179, 0.25);
    }

    .control-button.stop {
      --accent: #ffd6a6;
      --accent-soft: rgba(255, 214, 166, 0.22);
    }

    .control-button.reset {
      --accent: #9ad8ff;
      --accent-soft: rgba(154, 216, 255, 0.22);
    }

    .control-button.share {
      --accent: #b6fbd3;
      --accent-soft: rgba(182, 251, 211, 0.24);
    }

    .controls button[disabled] {
      display: none;
    }

    @media (max-width: 640px) {
      .controls {
        gap: 10px;
        padding: 12px 14px;
      }

      .control-button {
        padding: 10px 14px 10px 12px;
        font-size: 12px;
      }
    }
  `;

  constructor() {
    super();
    this.initClient();
  }

  private initAudio() {
    this.nextStartTime = this.outputAudioContext.currentTime;
  }

  private async initClient() {
    this.initAudio();

    this.outputNode.connect(this.outputAudioContext.destination);

    if (this.liveDisabled) {
      this.session = {
        sendRealtimeInput: () => {},
        close: () => {},
      } as Session;
      this.updateStatus('Live session disabled for tests.');
      return;
    }

    this.client = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
    });

    this.initSession();
  }

  private async initSession() {
    const model = 'gemini-2.5-flash-native-audio-preview-09-2025';

    try {
      this.session = await this.client.live.connect({
        model: model,
        callbacks: {
          onopen: () => {
            this.updateStatus('Opened');
          },
          onmessage: async (message: LiveServerMessage) => {
            const audio =
              message.serverContent?.modelTurn?.parts[0]?.inlineData;

            if (audio) {
              this.nextStartTime = Math.max(
                this.nextStartTime,
                this.outputAudioContext.currentTime
              );

              const audioBuffer = await decodeAudioData(
                decode(audio.data),
                this.outputAudioContext,
                24000,
                1
              );
              const source = this.outputAudioContext.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(this.outputNode);
              source.addEventListener('ended', () => {
                this.sources.delete(source);
              });

              source.start(this.nextStartTime);
              this.nextStartTime = this.nextStartTime + audioBuffer.duration;
              this.sources.add(source);
            }

            const interrupted = message.serverContent?.interrupted;
            if (interrupted) {
              for (const source of this.sources.values()) {
                source.stop();
                this.sources.delete(source);
              }
              this.nextStartTime = 0;
            }
          },
          onerror: (e: ErrorEvent) => {
            this.updateError(e.message);
          },
          onclose: (e: CloseEvent) => {
            this.updateStatus('Close:' + e.reason);
          },
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Orus' } },
            // languageCode: 'en-GB'
          },
        },
      });
    } catch (e) {
      console.error(e);
    }
  }

  private updateStatus(msg: string) {
    this.status = msg;
  }

  private updateError(msg: string) {
    this.error = msg;
  }

  private trackEvent(name: string, props: Record<string, unknown> = {}): void {
    const payload = { name, props, ts: Date.now() };
    window.dispatchEvent(new CustomEvent('app:analytics', { detail: payload }));
    const dataLayer = (window as Window & { dataLayer?: unknown[] }).dataLayer;
    if (Array.isArray(dataLayer)) {
      dataLayer.push({ event: name, ...props });
    }
    if (import.meta.env.DEV) {
      console.info('[analytics]', payload);
    }
  }

  private showShareToast(message: string) {
    this.shareToast = message;
    window.setTimeout(() => {
      if (this.shareToast === message) {
        this.shareToast = '';
      }
    }, 2500);
  }

  private async shareSnapshot() {
    if (this.isShareBusy) {
      return;
    }

    this.isShareBusy = true;
    this.trackEvent('share_clicked', { surface: 'controls' });

    const visuals = this.renderRoot.querySelector(
      'gdm-live-audio-visuals-3d'
    ) as GdmLiveAudioVisuals3D | null;

    try {
      const blob = await visuals?.captureSnapshot();
      const shareUrl = window.location.href;
      const shareText = 'I just spoke with the Live Orb Assistant.';
      const shareTitle = 'Live Orb Assistant';
      const fileName = `live-orb-${new Date()
        .toISOString()
        .replace(/[:.]/g, '-')}.png`;
      const file = blob
        ? new File([blob], fileName, { type: 'image/png' })
        : null;

      const shareData: ShareData = {
        title: shareTitle,
        text: shareText,
        url: shareUrl,
      };

      if (file && navigator.canShare && navigator.canShare({ files: [file] })) {
        shareData.files = [file];
      }

      if (navigator.share) {
        await navigator.share(shareData);
        this.trackEvent('share_completed', {
          method: 'native',
          withImage: Boolean(shareData.files?.length),
        });
        this.showShareToast('Shared! Thanks for spreading the orb.');
        return;
      }

      if (file && navigator.clipboard?.write) {
        await navigator.clipboard.write([
          new ClipboardItem({ [file.type]: file }),
        ]);
        this.trackEvent('share_completed', {
          method: 'clipboard_image',
          withImage: true,
        });
        this.showShareToast('Snapshot copied to clipboard.');
        return;
      }

      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(`${shareText} ${shareUrl}`);
        this.trackEvent('share_completed', {
          method: 'clipboard_text',
          withImage: false,
        });
        this.showShareToast('Share link copied to clipboard.');
        return;
      }

      this.showShareToast('Sharing not supported in this browser.');
    } catch (err) {
      console.error('Share failed:', err);
      this.trackEvent('share_failed', {
        reason: err instanceof Error ? err.message : 'unknown',
      });
      this.showShareToast('Share failed. Try again.');
    } finally {
      this.isShareBusy = false;
    }
  }

  private async startRecording() {
    if (this.isRecording) {
      return;
    }

    if (!this.session) {
      this.updateStatus('Live session not ready.');
      return;
    }

    this.inputAudioContext.resume();

    this.updateStatus('Requesting microphone access...');

    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false,
      });

      this.updateStatus('Microphone access granted. Starting capture...');

      this.sourceNode = this.inputAudioContext.createMediaStreamSource(
        this.mediaStream
      );
      this.sourceNode.connect(this.inputNode);

      const bufferSize = 256;
      this.scriptProcessorNode = this.inputAudioContext.createScriptProcessor(
        bufferSize,
        1,
        1
      );

      this.scriptProcessorNode.onaudioprocess = (audioProcessingEvent) => {
        if (!this.isRecording) return;

        const inputBuffer = audioProcessingEvent.inputBuffer;
        const pcmData = inputBuffer.getChannelData(0);

        this.session.sendRealtimeInput({ media: createBlob(pcmData) });
      };

      this.sourceNode.connect(this.scriptProcessorNode);
      this.scriptProcessorNode.connect(this.inputAudioContext.destination);

      this.isRecording = true;
      this.updateStatus('🔴 Recording... Capturing PCM chunks.');
    } catch (err) {
      console.error('Error starting recording:', err);
      this.updateStatus(`Error: ${err.message}`);
      this.stopRecording();
    }
  }

  private stopRecording() {
    if (!this.isRecording && !this.mediaStream && !this.inputAudioContext)
      return;

    this.updateStatus('Stopping recording...');

    this.isRecording = false;

    if (this.scriptProcessorNode && this.sourceNode && this.inputAudioContext) {
      this.scriptProcessorNode.disconnect();
      this.sourceNode.disconnect();
    }

    this.scriptProcessorNode = null;
    this.sourceNode = null;

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
    }

    this.updateStatus('Recording stopped. Click Start to begin again.');
  }

  private reset() {
    this.session?.close();
    this.initSession();
    this.updateStatus('Session cleared.');
  }

  render() {
    return html`
      <div>
        <div class="controls">
          <button
            id="resetButton"
            class="control-button reset"
            @click=${this.reset}
            ?disabled=${this.isRecording}
          >
            <span class="icon">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                width="18px"
                height="18px"
                fill="none"
                stroke="currentColor"
                stroke-width="1.8"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M3 12a9 9 0 1 0 3-6.7" />
                <path d="M3 4v5h5" />
              </svg>
            </span>
            <span class="label">Reset</span>
          </button>
          <button
            id="startButton"
            class="control-button start"
            @click=${this.startRecording}
            ?disabled=${this.isRecording}
          >
            <span class="icon">
              <svg
                viewBox="0 0 24 24"
                width="18px"
                height="18px"
                fill="currentColor"
                xmlns="http://www.w3.org/2000/svg"
              >
                <circle cx="12" cy="12" r="6.5" />
              </svg>
            </span>
            <span class="label">Start</span>
          </button>
          <button
            id="stopButton"
            class="control-button stop"
            @click=${this.stopRecording}
            ?disabled=${!this.isRecording}
          >
            <span class="icon">
              <svg
                viewBox="0 0 24 24"
                width="18px"
                height="18px"
                fill="currentColor"
                xmlns="http://www.w3.org/2000/svg"
              >
                <rect x="7" y="7" width="10" height="10" rx="2" />
              </svg>
            </span>
            <span class="label">Stop</span>
          </button>
          <button
            id="shareButton"
            class="control-button share"
            @click=${this.shareSnapshot}
          >
            <span class="icon">
              <svg
                viewBox="0 0 24 24"
                width="18px"
                height="18px"
                fill="none"
                stroke="currentColor"
                stroke-width="1.8"
                stroke-linecap="round"
                stroke-linejoin="round"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7" />
                <path d="M12 3v12" />
                <path d="M7 8l5-5 5 5" />
              </svg>
            </span>
            <span class="label">Share</span>
          </button>
        </div>

        <div id="status">${this.error}</div>
        <div id="shareToast">${this.shareToast}</div>
        <gdm-live-audio-visuals-3d
          .inputNode=${this.inputNode}
          .outputNode=${this.outputNode}
        ></gdm-live-audio-visuals-3d>
      </div>
    `;
  }
}
