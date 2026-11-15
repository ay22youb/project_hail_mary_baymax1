import { useEffect, useRef } from "react";
import { AudioClassifier, FilesetResolver } from "@mediapipe/tasks-audio";

export default function CoughListener({ onCough, onUnavailable, onReady, armed }) {
  const cough = useRef(onCough);
  const unavailable = useRef(onUnavailable);
  const ready = useRef(onReady);
  const isArmed = useRef(armed);
  cough.current = onCough;
  unavailable.current = onUnavailable;
  ready.current = onReady;
  isArmed.current = armed;

  useEffect(() => {
    let closed = false;
    let stream;
    let context;
    let classifier;
    let worklet;
    let source;
    let silentOutput;
    let softerHits = 0;
    let lastHit = 0;
    let lastDetection = 0;

    (async () => {
      try {
        const files = await FilesetResolver.forAudioTasks("/audio-model");
        classifier = await AudioClassifier.createFromOptions(files, {
          baseOptions: { modelAssetPath: "/audio-model/yamnet.tflite" },
          categoryAllowlist: ["Cough"],
          maxResults: 1,
        });
        if (closed) { classifier.close(); return; }
        stream = await navigator.mediaDevices.getUserMedia({ audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        } });
        if (closed) { stream.getTracks().forEach(track => track.stop()); return; }
        context = new AudioContext({ sampleRate: 16000 });
        await context.audioWorklet.addModule("/audio-model/cough-audio-worklet.js");
        if (closed) return;
        source = context.createMediaStreamSource(stream);
        worklet = new AudioWorkletNode(context, "cough-audio-processor", {
          processorOptions: { windowSize: Math.round(context.sampleRate * 1.1) },
        });
        worklet.port.onmessage = ({ data }) => {
          if (closed || !isArmed.current) return;
          try {
            const results = classifier.classify(data, context.sampleRate);
            const score = Math.max(0, ...results.flatMap(result => result.classifications.flatMap(item =>
              item.categories.filter(category => category.categoryName === "Cough").map(category => category.score)
            )));
            const now = performance.now();
            if (now - lastDetection < 30000) return;
            if (now - lastHit > 3500) softerHits = 0;
            if (score >= 0.4) {
              lastDetection = now;
              softerHits = 0;
              cough.current();
            } else if (score >= 0.2) {
              softerHits += 1;
              lastHit = now;
              if (softerHits >= 2) {
                lastDetection = now;
                softerHits = 0;
                cough.current();
              }
            }
          } catch {
            unavailable.current?.();
          }
        };
        source.connect(worklet);
        silentOutput = context.createGain();
        silentOutput.gain.value = 0;
        worklet.connect(silentOutput);
        silentOutput.connect(context.destination);
        await context.resume();
        ready.current?.();
      } catch {
        if (!closed) unavailable.current?.();
      }
    })();

    return () => {
      closed = true;
      worklet?.disconnect();
      silentOutput?.disconnect();
      source?.disconnect();
      stream?.getTracks().forEach(track => track.stop());
      context?.close();
      classifier?.close();
    };
  }, []);
  return null;
}
