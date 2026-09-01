export type PronunciationAccent = 'en-US' | 'en-GB';

export function isSpeechSynthesisSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

function pickVoice(accent: PronunciationAccent): SpeechSynthesisVoice | undefined {
  const voices = window.speechSynthesis.getVoices();
  return (
    voices.find((voice) => voice.lang === accent) ??
    voices.find((voice) => voice.lang.toLowerCase().startsWith(accent.slice(0, 2).toLowerCase()))
  );
}

export function speakWord(word: string, accent: PronunciationAccent): void {
  const trimmed = word.trim();
  if (!isSpeechSynthesisSupported() || !trimmed) return;

  const utterance = new SpeechSynthesisUtterance(trimmed);
  utterance.lang = accent;
  const voice = pickVoice(accent);
  if (voice) utterance.voice = voice;

  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
}
