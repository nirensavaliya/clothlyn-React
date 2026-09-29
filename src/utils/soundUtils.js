// Play success beep sound - like physical scanner
export const playSuccessBeep = () => {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;

    const audioContext = new AudioCtx();
    const play = () => {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      // Sharp short beep like a physical scanner
      oscillator.frequency.value = 1200;
      oscillator.type = 'square';

      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.4, audioContext.currentTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.08);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.1);

      // Free context after beep finishes
      oscillator.onended = () => {
        try {
          audioContext.close();
        } catch (_) {
          /* ignore */
        }
      };
    };

    // Browsers often start AudioContext suspended until a user gesture
    if (audioContext.state === 'suspended') {
      audioContext.resume().then(play).catch(() => {
        try {
          play();
        } catch (e) {
          console.error('Error playing beep sound:', e);
        }
      });
    } else {
      play();
    }
  } catch (error) {
    console.error('Error playing beep sound:', error);
  }
};

// Play double beep for special success (optional)
export const playDoubleBeep = () => {
  playSuccessBeep();
  setTimeout(() => playSuccessBeep(), 150);
};
