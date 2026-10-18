/**
 * EVARIS Audio Worklet Processor.
 * 
 * Runs off the browser main thread in Web Audio AudioWorkletGlobalScope.
 * Ingests microphone audio at hardware sample rate (e.g. 44.1kHz or 48kHz),
 * computes acoustic RMS energy, downsamples to 16kHz 16-bit signed integer mono PCM,
 * and transfers ArrayBuffers with zero-copy overhead to the main thread.
 */

class AudioProcessorWorklet extends AudioWorkletProcessor {
  constructor() {
    super();
    this.sourceSampleRate = sampleRate; // Global in AudioWorkletGlobalScope
    this.targetSampleRate = 16000;
    // Accumulate ~2048 input samples before downsampling (~42ms at 48kHz)
    this.bufferSize = 2048;
    this.inputAccumulator = new Float32Array(this.bufferSize);
    this.accumIndex = 0;
  }

  downsampleTo16k(inputBuffer) {
    if (this.sourceSampleRate === 16000) {
      const pcm16 = new Int16Array(inputBuffer.length);
      for (let i = 0; i < inputBuffer.length; i++) {
        const s = Math.max(-1, Math.min(1, inputBuffer[i]));
        pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
      }
      return pcm16;
    }

    const ratio = this.sourceSampleRate / 16000;
    const newLength = Math.round(inputBuffer.length / ratio);
    const result = new Int16Array(newLength);
    let offsetResult = 0;
    let offsetBuffer = 0;

    while (offsetResult < result.length) {
      const nextOffsetBuffer = Math.round((offsetResult + 1) * ratio);
      let accum = 0;
      let count = 0;
      for (let i = offsetBuffer; i < nextOffsetBuffer && i < inputBuffer.length; i++) {
        accum += inputBuffer[i];
        count++;
      }
      const avg = count > 0 ? accum / count : 0;
      // Clipping guard
      const s = Math.max(-1, Math.min(1, avg));
      result[offsetResult] = s < 0 ? s * 0x8000 : s * 0x7fff;
      offsetResult++;
      offsetBuffer = nextOffsetBuffer;
    }
    return result;
  }

  process(inputs) {
    const input = inputs[0];
    if (!input || !input[0] || input[0].length === 0) {
      return true;
    }

    const channelData = input[0]; // 128 samples per render quantum

    for (let i = 0; i < channelData.length; i++) {
      this.inputAccumulator[this.accumIndex++] = channelData[i];

      if (this.accumIndex >= this.bufferSize) {
        // 1. Calculate RMS acoustic energy
        let sum = 0;
        for (let j = 0; j < this.bufferSize; j++) {
          sum += this.inputAccumulator[j] * this.inputAccumulator[j];
        }
        const rms = Math.sqrt(sum / this.bufferSize);
        const rmsLevel = Math.min(100, Math.round(rms * 250));

        // 2. Downsample to 16kHz 16-bit PCM
        const pcm16 = this.downsampleTo16k(this.inputAccumulator);

        // 3. Post to main thread with transferable ArrayBuffer
        if (pcm16.length > 0) {
          const buffer = pcm16.buffer;
          this.port.postMessage(
            {
              type: "audio_chunk",
              pcmBuffer: buffer,
              rms: rmsLevel,
              timestamp: Date.now(),
            },
            [buffer]
          );
        }

        this.accumIndex = 0;
      }
    }

    return true;
  }
}

registerProcessor("audio-processor-worklet", AudioProcessorWorklet);
