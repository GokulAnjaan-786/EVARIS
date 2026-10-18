"use client";

import { useState, useRef, useCallback, useEffect } from "react";

export interface AudioCaptureState {
  isCapturing: boolean;
  permissionStatus: "prompt" | "granted" | "denied" | "unsupported";
  permissionError: string | null;
  audioLevel: number;
  framesSent: number;
  processorType: "AudioWorklet" | "ScriptProcessor" | "None";
}

export function useAudioCapture() {
  const [isCapturing, setIsCapturing] = useState<boolean>(false);
  const [permissionStatus, setPermissionStatus] = useState<"prompt" | "granted" | "denied" | "unsupported">("prompt");
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const [framesSent, setFramesSent] = useState<number>(0);
  const [processorType, setProcessorType] = useState<"AudioWorklet" | "ScriptProcessor" | "None">("None");

  const micStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const workletNodeRef = useRef<AudioWorkletNode | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const onChunkCallbackRef = useRef<((pcmBuffer: ArrayBuffer) => void) | null>(null);

  // Downsample Float32 audio samples from source sample rate to 16,000 Hz 16-bit PCM (used in ScriptProcessor fallback)
  const downsampleTo16kPCM = useCallback((inputBuffer: Float32Array, sourceSampleRate: number): Int16Array => {
    if (sourceSampleRate === 16000) {
      const pcm16 = new Int16Array(inputBuffer.length);
      for (let i = 0; i < inputBuffer.length; i++) {
        const s = Math.max(-1, Math.min(1, inputBuffer[i]));
        pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
      }
      return pcm16;
    }

    const ratio = sourceSampleRate / 16000;
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
      const s = Math.max(-1, Math.min(1, avg));
      result[offsetResult] = s < 0 ? s * 0x8000 : s * 0x7fff;
      offsetResult++;
      offsetBuffer = nextOffsetBuffer;
    }
    return result;
  }, []);

  const stopCapture = useCallback(() => {
    if (workletNodeRef.current) {
      try {
        workletNodeRef.current.port.onmessage = null;
        workletNodeRef.current.disconnect();
      } catch (e) {}
      workletNodeRef.current = null;
    }

    if (scriptProcessorRef.current) {
      try {
        scriptProcessorRef.current.disconnect();
      } catch (e) {}
      scriptProcessorRef.current = null;
    }

    if (micStreamRef.current) {
      try {
        micStreamRef.current.getAudioTracks().forEach((track) => {
          track.stop();
        });
      } catch (e) {}
      micStreamRef.current = null;
    }

    if (audioContextRef.current) {
      try {
        audioContextRef.current.close().catch(() => {});
      } catch (e) {}
      audioContextRef.current = null;
    }

    onChunkCallbackRef.current = null;
    setIsCapturing(false);
    setAudioLevel(0);
    setProcessorType("None");
  }, []);

  const startCapture = useCallback(
    async (onChunk: (pcmBuffer: ArrayBuffer) => void): Promise<boolean> => {
      // Clean up previous capture session if any
      stopCapture();
      setPermissionError(null);
      onChunkCallbackRef.current = onChunk;

      if (typeof window === "undefined" || !navigator.mediaDevices?.getUserMedia) {
        setPermissionStatus("unsupported");
        setPermissionError("Audio capture is not supported in this browser environment.");
        return false;
      }

      try {
        // 1. Request microphone access
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            channelCount: 1,
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });

        micStreamRef.current = stream;
        setPermissionStatus("granted");

        // 2. Initialize AudioContext and ensure it is not suspended (handles browser autoplay policies)
        const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
        const audioCtx = new AudioCtxClass();
        audioContextRef.current = audioCtx;

        if (audioCtx.state === "suspended") {
          await audioCtx.resume();
        }

        const source = audioCtx.createMediaStreamSource(stream);
        let workletReady = false;

        // 3. Try AudioWorklet first
        if (audioCtx.audioWorklet) {
          try {
            await audioCtx.audioWorklet.addModule("/audio-processor.worklet.js");
            const workletNode = new AudioWorkletNode(audioCtx, "audio-processor-worklet");
            workletNodeRef.current = workletNode;

            workletNode.port.onmessage = (event) => {
              const { type, pcmBuffer, rms } = event.data;
              if (type === "audio_chunk") {
                if (typeof rms === "number") {
                  setAudioLevel(rms);
                }
                if (pcmBuffer && onChunkCallbackRef.current) {
                  setFramesSent((prev) => prev + 1);
                  onChunkCallbackRef.current(pcmBuffer);
                }
              }
            };

            source.connect(workletNode);
            // Connect to dummy silent gain to keep rendering pipe alive
            const dummyGain = audioCtx.createGain();
            dummyGain.gain.value = 0;
            workletNode.connect(dummyGain);
            dummyGain.connect(audioCtx.destination);

            setProcessorType("AudioWorklet");
            workletReady = true;
          } catch (workletError) {
            console.warn("AudioWorklet initialization failed, falling back to ScriptProcessorNode:", workletError);
          }
        }

        // 4. Fallback to ScriptProcessorNode if AudioWorklet unavailable or failed
        if (!workletReady) {
          const processor = audioCtx.createScriptProcessor(4096, 1, 1);
          scriptProcessorRef.current = processor;

          source.connect(processor);
          processor.connect(audioCtx.destination);

          processor.onaudioprocess = (e) => {
            const inputData = e.inputBuffer.getChannelData(0);

            // Calculate RMS
            let sum = 0;
            for (let i = 0; i < inputData.length; i++) {
              sum += inputData[i] * inputData[i];
            }
            const rms = Math.sqrt(sum / inputData.length);
            const level = Math.min(100, Math.round(rms * 250));
            setAudioLevel(level);

            // Downsample to 16kHz 16-bit PCM
            const pcm16 = downsampleTo16kPCM(inputData, audioCtx.sampleRate);
            if (pcm16.length > 0 && onChunkCallbackRef.current) {
              setFramesSent((prev) => prev + 1);
              onChunkCallbackRef.current(pcm16.buffer as ArrayBuffer);
            }
          };

          setProcessorType("ScriptProcessor");
        }

        setIsCapturing(true);
        return true;
      } catch (err: any) {
        console.error("Microphone capture request failed:", err);
        setPermissionStatus("denied");

        if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
          setPermissionError("Microphone access denied. Please click the lock/settings icon in your browser address bar and allow microphone permissions.");
        } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
          setPermissionError("No physical microphone input device found. Please connect a microphone or headset.");
        } else if (err.name === "NotReadableError") {
          setPermissionError("Microphone hardware is busy or in use by another application.");
        } else {
          setPermissionError(err.message || "Failed to initialize microphone audio stream.");
        }

        stopCapture();
        return false;
      }
    },
    [downsampleTo16kPCM, stopCapture]
  );

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopCapture();
    };
  }, [stopCapture]);

  return {
    isCapturing,
    permissionStatus,
    permissionError,
    audioLevel,
    framesSent,
    processorType,
    startCapture,
    stopCapture,
  };
}
