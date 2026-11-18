// Voice & Speech Service for Clarivo

// Web Speech API Types
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export interface VoiceState {
  isSupported: boolean;
  isListening: boolean;
  isSpeaking: boolean;
  error: string | null;
}

class VoiceManager {
  private recognition: any = null;
  private currentAudio: HTMLAudioElement | null = null;
  private onTranscriptCallback: ((text: string, isFinal: boolean) => void) | null = null;
  private onSpeechEndCallback: (() => void) | null = null;
  private isSpeaking = false;
  private isListening = false;

  constructor() {
    if (typeof window !== "undefined") {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        this.recognition = new SpeechRecognition();
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        this.recognition.lang = "en-US";

        this.recognition.onresult = (event: any) => {
          let interimTranscript = "";
          let finalTranscript = "";

          for (let i = event.resultIndex; i < event.results.length; ++i) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTranscript += transcript;
            } else {
              interimTranscript += transcript;
            }
          }

          if (this.onTranscriptCallback) {
            const text = finalTranscript || interimTranscript;
            if (text) {
              this.onTranscriptCallback(text, Boolean(finalTranscript));
            }
          }
        };

        this.recognition.onerror = (event: any) => {
          console.warn("Speech recognition notice:", event.error);
        };

        this.recognition.onend = () => {
          if (this.isListening && !this.isSpeaking) {
            // Auto restart if intended to be listening
            try {
              this.recognition.start();
            } catch {
              // ignore
            }
          }
        };
      }
    }
  }

  public isSpeechSupported(): boolean {
    if (typeof window === "undefined") return false;
    return Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);
  }

  public isTtsSupported(): boolean {
    if (typeof window === "undefined") return false;
    return "speechSynthesis" in window;
  }

  public async requestMicrophonePermission(): Promise<boolean> {
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      return false;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => track.stop());
      return true;
    } catch {
      return false;
    }
  }

  public startListening(
    onTranscript: (text: string, isFinal: boolean) => void,
    onSpeechEnd?: () => void
  ): boolean {
    if (!this.recognition) return false;
    this.stopSpeaking();
    this.onTranscriptCallback = onTranscript;
    this.onSpeechEndCallback = onSpeechEnd || null;
    this.isListening = true;

    try {
      this.recognition.start();
      return true;
    } catch {
      return false;
    }
  }

  public stopListening(): void {
    this.isListening = false;
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch {
        // ignore
      }
    }
  }

  public stopSpeaking(): void {
    this.isSpeaking = false;
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio = null;
    }
  }

  public speak(
    text: string,
    onStart?: () => void,
    onEnd?: () => void
  ): Promise<void> {
    return new Promise((resolve) => {
      // Pause speech recognition while AI speaks to prevent feedback loop
      const wasListening = this.isListening;
      if (wasListening) {
        this.stopListening();
      }

      this.stopSpeaking();
      this.isSpeaking = true;
      if (onStart) onStart();

      if (!this.isTtsSupported()) {
        this.isSpeaking = false;
        if (onEnd) onEnd();
        if (wasListening && this.onTranscriptCallback) {
          this.startListening(this.onTranscriptCallback, this.onSpeechEndCallback || undefined);
        }
        resolve();
        return;
      }

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.lang = "en-US";

      // Select voice: prefer natural/female voices
      const voices = window.speechSynthesis.getVoices();
      const preferred = voices.find(
        (v) =>
          (v.name.includes("Samantha") ||
            v.name.includes("Google UK English Female") ||
            v.name.includes("Microsoft Zira") ||
            v.name.includes("Natural") ||
            v.name.includes("Female")) &&
          v.lang.startsWith("en")
      );
      if (preferred) {
        utterance.voice = preferred;
      }

      utterance.onend = () => {
        this.isSpeaking = false;
        if (onEnd) onEnd();
        // Resume listening if candidate was listening
        if (wasListening && this.onTranscriptCallback) {
          this.startListening(this.onTranscriptCallback, this.onSpeechEndCallback || undefined);
        }
        resolve();
      };

      utterance.onerror = () => {
        this.isSpeaking = false;
        if (onEnd) onEnd();
        if (wasListening && this.onTranscriptCallback) {
          this.startListening(this.onTranscriptCallback, this.onSpeechEndCallback || undefined);
        }
        resolve();
      };

      window.speechSynthesis.speak(utterance);
    });
  }
}

export const voice = new VoiceManager();
