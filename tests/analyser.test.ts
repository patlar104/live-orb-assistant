import { describe, expect, it, vi } from 'vitest';
import { Analyser } from '../analyser';

class FakeAnalyserNode {
  private _fftSize = 0;
  frequencyBinCount = 0;
  data = new Uint8Array(0);

  set fftSize(value: number) {
    this._fftSize = value;
    this.frequencyBinCount = value / 2;
    this.data = new Uint8Array(this.frequencyBinCount);
  }

  get fftSize() {
    return this._fftSize;
  }

  getByteFrequencyData(target: Uint8Array) {
    target.set(this.data);
  }
}

class FakeAudioContext {
  analyser = new FakeAnalyserNode();

  createAnalyser() {
    return this.analyser;
  }
}

describe('Analyser', () => {
  it('connects the audio node and exposes analyser data', () => {
    const context = new FakeAudioContext();
    const node = {
      context,
      connect: vi.fn(),
    } as unknown as AudioNode;

    const analyser = new Analyser(node);

    expect(context.analyser.fftSize).toBe(32);
    expect(context.analyser.frequencyBinCount).toBe(16);
    expect(node.connect).toHaveBeenCalledWith(context.analyser);

    context.analyser.data = Uint8Array.from({ length: 16 }, (_, i) => i);
    analyser.update();

    expect(Array.from(analyser.data.slice(0, 4))).toEqual([0, 1, 2, 3]);
  });
});
