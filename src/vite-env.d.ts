/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

interface Window {
  __DSK_APP__?: {
    ready: boolean;
    scene: string;
    questionIndex?: number;
    answerIndex?: number;
    score?: number;
    stars?: number;
  };
}
