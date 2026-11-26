// React hook'lari — faqat Client Component'larda ishlatiladi.
export { STORAGE_CHANGE_EVENT, createStorageStore } from "./storage";
export { useToday } from "./use-today";
export { useInstallPrompt, useServiceWorker } from "./pwa";
export { useFocusMode } from "./focus-mode";
export { usePlatform, type Platform } from "./platform";
export { canListen, canSpeak, listen, speak, stopSpeaking, useSpeechSupport, type ListenHandlers, type SpeechSupport } from "./speech";
