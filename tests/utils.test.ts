import { describe, expect, it } from 'vitest';
import { createBlob, decode, decodeAudioData, encode } from '../utils';

const g = globalThis as typeof globalThis & {
  atob?: (data: string) => string;
  btoa?: (data: string) => string;
};

if (!g.atob) {
  g.atob = (base64: string) => Buffer.from(base64, 'base64').toString('binary');
}
if (!g.btoa) {
  g.btoa = (binary: string) => Buffer.from(binary, 'binary').toString('base64');
}

class FakeAudioBuffer {
  readonly channels: Float32Array[];

  constructor(
    public readonly numberOfChannels: number,
    public readonly length: number,
    public readonly sampleRate: number
  ) {
    this.channels = Array.from(
      { length: numberOfChannels },
      () => new Float32Array(length)
    );
  }

  copyToChannel(data: Float32Array, channel: number) {
    this.channels[channel].set(data);
  }

  getChannelData(channel: number) {
    return this.channels[channel];
  }
}

class FakeAudioContext {
  createBuffer(numChannels: number, length: number, sampleRate: number) {
    return new FakeAudioBuffer(numChannels, length, sampleRate);
  }
}

describe('utils encode/decode', () => {
  it('round-trips bytes through base64 helpers', () => {
    const bytes = new Uint8Array([0, 1, 2, 250, 255]);
    const encoded = encode(bytes);
    const decoded = decode(encoded);

    expect(Array.from(decoded)).toEqual(Array.from(bytes));
  });
});

describe('utils createBlob', () => {
  it('encodes float32 PCM into 16-bit PCM blob', () => {
    const blob = createBlob(new Float32Array([-1, 0, 1]));

    expect(blob.mimeType).toBe('audio/pcm;rate=16000');

    const decoded = decode(blob.data);
    const int16 = new Int16Array(decoded.buffer);

    // Current behavior uses a 32768 scale; 1.0 overflows to -32768 in int16.
    expect(Array.from(int16)).toEqual([-32768, 0, -32768]);
  });
});

describe('utils decodeAudioData', () => {
  it('splits mono PCM into a single channel buffer', async () => {
    const samples = new Int16Array([0, 32767]);
    const data = new Uint8Array(samples.buffer);

    const buffer = await decodeAudioData(
      data,
      new FakeAudioContext() as unknown as AudioContext,
      16000,
      1
    );

    const channel = buffer.getChannelData(0);
    expect(channel.length).toBe(2);
    expect(channel[0]).toBeCloseTo(0);
    expect(channel[1]).toBeCloseTo(32767 / 32768, 5);
  });

  it('deinterleaves stereo PCM into per-channel buffers', async () => {
    const samples = new Int16Array([0, 1000, 2000, 3000]);
    const data = new Uint8Array(samples.buffer);

    const buffer = await decodeAudioData(
      data,
      new FakeAudioContext() as unknown as AudioContext,
      16000,
      2
    );

    const left = buffer.getChannelData(0);
    const right = buffer.getChannelData(1);

    expect(Array.from(left)).toEqual([0 / 32768, 2000 / 32768]);
    expect(Array.from(right)).toEqual([1000 / 32768, 3000 / 32768]);
  });
});
