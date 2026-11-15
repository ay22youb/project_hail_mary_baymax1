class CoughAudioProcessor extends AudioWorkletProcessor {
  constructor({ processorOptions }) {
    super();
    this.buffer = new Float32Array(processorOptions?.windowSize || 17600);
    this.offset = 0;
    this.step = Math.floor(this.buffer.length / 2);
  }

  process(inputs) {
    const input = inputs[0]?.[0];
    if (!input) return true;
    for (const sample of input) {
      this.buffer[this.offset++] = sample;
      if (this.offset === this.buffer.length) {
        this.port.postMessage(this.buffer.slice());
        this.buffer.copyWithin(0, this.step);
        this.offset = this.buffer.length - this.step;
      }
    }
    return true;
  }
}

registerProcessor("cough-audio-processor", CoughAudioProcessor);
