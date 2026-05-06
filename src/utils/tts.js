class TTSPlayer {
  constructor() {
    this.synth = window.speechSynthesis;
    this.audio = null;
    this.onEndCallback = null;
    this.currentRequestId = 0;
    
    // 환경 설정
    this.engine = 'edge';
    this.voice = 'hyunsu';
    this.rate = 1.0;
    this.volume = 1.0;

    const hostname = window.location.hostname;
    const protocol = window.location.protocol;
    this.baseUrl = `${protocol}//${hostname}:8504`;
    this.currentFetchController = null;
  }

  stop() {
    this.currentRequestId++;
    if (this.synth) this.synth.cancel();
    if (this.audio) {
      this.audio.pause();
      this.audio.onended = null;
      // src를 비우지 않고 일시정지만 함으로써 위치 정보 보존 시도
      // 단, 완전히 새로운 speak 호출 시에는 초기화
    }
  }

  async speak(text, onEnd) {
    const requestId = ++this.currentRequestId;
    
    // 이전 오디오 즉시 중지 및 정리
    if (this.audio) {
      this.audio.pause();
      this.audio.onended = null;
      this.audio = null; 
    }
    if (this.synth) this.synth.cancel();
    
    // 이전 fetch 요청이 있다면 중단
    if (this.currentFetchController) {
      this.currentFetchController.abort();
    }

    this.onEndCallback = onEnd;

    if (this.engine === 'edge') {
      const fetchController = new AbortController();
      this.currentFetchController = fetchController;

      try {
        // 현재 이 요청 전용 타입아웃 설정
        const timeoutId = setTimeout(() => fetchController.abort(), 3000); 

        const res = await fetch(`${this.baseUrl}/naver_tts`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: fetchController.signal,
          body: JSON.stringify({ text, speaker: this.voice, rate: this.rate, pitch: '0' })
        });
        clearTimeout(timeoutId);

        if (res.ok && requestId === this.currentRequestId) {
          const data = await res.json();
          if (data.success && data.audio && requestId === this.currentRequestId) {
            this.audio = new Audio(`data:audio/mpeg;base64,${data.audio}`);
            this.audio.volume = this.volume;
            this.audio.onended = () => {
              if (requestId === this.currentRequestId && this.onEndCallback) {
                this.onEndCallback();
              }
            };
            await this.audio.play();
            return;
          }
        }
      } catch (e) {
        if (e.name !== 'AbortError' && requestId === this.currentRequestId) {
          console.warn("[TTS] Edge fail, jumping to native");
        }
      } finally {
        if (this.currentFetchController === fetchController) {
          this.currentFetchController = null;
        }
      }
    }

    // Edge 엔진 실패 시나 요청이 여전히 유효할 때 Native로 시도
    if (requestId === this.currentRequestId) {
      this.speakNative(text, requestId);
    }
  }

  speakNative(text, requestId) {
    if (!this.synth) return;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = this.rate;
    utterance.volume = this.volume;
    utterance.lang = 'ko-KR';

    const voices = this.synth.getVoices();
    const isFemale = ['sunhi', 'nara', 'ara'].includes(this.voice);
    let v = voices.find(v => v.lang.includes('KR') && (isFemale ? /sunhi|heami|yumi|jihye|female|woman/i.test(v.name) : /injoon|minho|hyunsu|dae-ho|male|man/i.test(v.name)));
    if (!v) v = voices.find(v => v.lang.includes('KR'));
    if (v) utterance.voice = v;

    utterance.onend = () => {
      if (requestId === this.currentRequestId && this.onEndCallback) {
        this.onEndCallback();
      }
    };
    this.synth.speak(utterance);
  }

  pause() {
    if (this.audio) this.audio.pause();
    if (this.synth) this.synth.pause();
  }

  resume() {
    // 멈춘 위치에서 그대로 재생
    if (this.audio && this.audio.paused) {
      this.audio.play().catch(e => console.error("Resume failed", e));
    }
    if (this.synth && this.synth.paused) {
      this.synth.resume();
    }
  }

  canResume() {
    if (this.engine === 'native') return this.synth && this.synth.paused;
    // 오디오 객체가 존재하고, 끝까지 가지 않았으며, 현재 일시정지 상태인 경우만 resume 가능
    return this.audio && !this.audio.ended && this.audio.paused;
  }

  setEngine(e) { this.engine = e; }
  setVoice(v) { this.voice = v; }
  setRate(r) { this.rate = r; }
  setVolume(v) { this.volume = v; }
}

export const tts = new TTSPlayer();
