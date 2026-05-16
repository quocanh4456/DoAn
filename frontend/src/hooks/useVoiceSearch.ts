import { useState, useRef, useCallback } from 'react';

export type VoiceTarget = 'origin' | 'destination' | null;

interface UseVoiceSearchOptions {
  onResult: (text: string, target: VoiceTarget) => void;
  onError?: (error: string) => void;
}

interface UseVoiceSearchReturn {
  isListening: boolean;
  activeTarget: VoiceTarget;
  isSupported: boolean;
  startListening: (target: VoiceTarget) => void;
  stopListening: () => void;
}

export function useVoiceSearch({ onResult, onError }: UseVoiceSearchOptions): UseVoiceSearchReturn {
  const [isListening, setIsListening] = useState(false);
  const [activeTarget, setActiveTarget] = useState<VoiceTarget>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const isSupported =
    typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsListening(false);
    setActiveTarget(null);
  }, []);

  const startListening = useCallback(
    (target: VoiceTarget) => {
      if (!isSupported) {
        onError?.('Trình duyệt của bạn không hỗ trợ nhận diện giọng nói');
        return;
      }

      // Stop any ongoing recognition first
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        recognitionRef.current = null;
      }

      const SpeechRecognitionAPI =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      const recognition: SpeechRecognition = new SpeechRecognitionAPI();
      recognition.lang = 'vi-VN';
      recognition.interimResults = false;
      recognition.maxAlternatives = 3;
      recognition.continuous = false;

      recognition.onstart = () => {
        setIsListening(true);
        setActiveTarget(target);
      };

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        const results = event.results[0];
        let transcript = results[0].transcript.trim();

        // Normalize common Vietnamese city name pronunciations
        transcript = normalizeVietnameseLocation(transcript);

        onResult(transcript, target);
        setIsListening(false);
        setActiveTarget(null);
        recognitionRef.current = null;
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        let msg = 'Lỗi nhận diện giọng nói';
        switch (event.error) {
          case 'no-speech':
            msg = 'Không nghe thấy giọng nói. Vui lòng thử lại';
            break;
          case 'not-allowed':
            msg = 'Vui lòng cho phép truy cập microphone';
            break;
          case 'network':
            msg = 'Lỗi kết nối mạng khi nhận diện giọng nói';
            break;
          default:
            msg = `Lỗi: ${event.error}`;
        }
        onError?.(msg);
        setIsListening(false);
        setActiveTarget(null);
        recognitionRef.current = null;
      };

      recognition.onend = () => {
        setIsListening(false);
        setActiveTarget(null);
        recognitionRef.current = null;
      };

      recognitionRef.current = recognition;
      recognition.start();
    },
    [isSupported, onResult, onError],
  );

  return { isListening, activeTarget, isSupported, startListening, stopListening };
}

/**
 * Normalize common mispronunciations / abbreviations for Vietnamese city names.
 */
function normalizeVietnameseLocation(text: string): string {
  const map: Record<string, string> = {
    'thành phố hồ chí minh': 'TP. Hồ Chí Minh',
    'hồ chí minh': 'TP. Hồ Chí Minh',
    'sài gòn': 'TP. Hồ Chí Minh',
    'saigon': 'TP. Hồ Chí Minh',
    'tp hcm': 'TP. Hồ Chí Minh',
    'hà nội': 'Hà Nội',
    'hanoi': 'Hà Nội',
    'đà nẵng': 'Đà Nẵng',
    'da nang': 'Đà Nẵng',
    'đà lạt': 'Đà Lạt',
    'da lat': 'Đà Lạt',
    'nha trang': 'Nha Trang',
    'vũng tàu': 'Vũng Tàu',
    'vung tau': 'Vũng Tàu',
    'cần thơ': 'Cần Thơ',
    'can tho': 'Cần Thơ',
    'huế': 'Huế',
    'hue': 'Huế',
    'hội an': 'Hội An',
    'hoi an': 'Hội An',
    'sapa': 'Sapa',
    'sa pa': 'Sapa',
    'phú quốc': 'Phú Quốc',
    'phu quoc': 'Phú Quốc',
    'phan thiết': 'Phan Thiết',
    'phan thiet': 'Phan Thiết',
    'biên hòa': 'Biên Hòa',
    'bien hoa': 'Biên Hòa',
    'long xuyên': 'Long Xuyên',
    'mỹ tho': 'Mỹ Tho',
    'bến tre': 'Bến Tre',
    'vinh': 'Vinh',
    'thanh hóa': 'Thanh Hóa',
    'hải phòng': 'Hải Phòng',
    'hai phong': 'Hải Phòng',
    'quảng ngãi': 'Quảng Ngãi',
    'quảng nam': 'Quảng Nam',
    'bình dương': 'Bình Dương',
    'đồng nai': 'Đồng Nai',
    'tây ninh': 'Tây Ninh',
  };

  const lower = text.toLowerCase();
  for (const [key, value] of Object.entries(map)) {
    if (lower === key || lower.includes(key)) {
      return value;
    }
  }

  // Capitalize first letter of each word as fallback
  return text
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
