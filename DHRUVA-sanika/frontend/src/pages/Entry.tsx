import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Login } from './Login';
import { Shield, Radio, Terminal, FastForward } from 'lucide-react';

/**
 * ============================================================================
 * CENTRALIZED CINEMATIC TIMING CONFIGURATION
 * ============================================================================
 * All transition and video synchronization timestamps are configured here.
 * Detected via frame-by-frame analysis of Dhruva_entry.mp4 (1280x720 @ 24fps):
 *  - Total Duration: 10.00s (240 frames)
 *  - splitStart: 2.75s (Frame 66 - Seam ignites and shield halves begin physical separation)
 *  - splitEnd: 8.75s (Frame 210 - Shield doors reach max opening / viewport edges)
 *  - outroEnd: 9.60s (Frame 230 - Shield doors fully clear; video dissolves into Login)
 *  - transitionDuration: 10.00s (Full video length)
 */
export const ENTRY_TIMING = {
  splitStart: 2.75, // Seconds: DHRUVA shield logo begins parting horizontally
  splitEnd: 8.75, // Seconds: Split reaches maximum aperture; Login is fully revealed
  outroEnd: 9.60, // Seconds: Video layer completes and exits cleanly
  transitionDuration: 10.0, // Seconds: Total video duration
};

export type EntryState =
  | 'INTRO' // Initial full-screen logo animation
  | 'SPLIT_REVEAL' // Shield halves separating, Login UI revealing through the opening
  | 'REVEAL_COMPLETE' // Split aperture fully opened (100% visible)
  | 'EXIT_VIDEO' // Smooth dissolution / exit of video layer
  | 'LOGIN'; // Video unmounted completely, Login page fully interactive

export const Entry: React.FC = () => {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const animFrameRef = useRef<number | null>(null);

  const [entryState, setEntryState] = useState<EntryState>('INTRO');
  const [splitProgress, setSplitProgress] = useState<number>(0); // 0.0 -> 1.0
  const [videoOpacity, setVideoOpacity] = useState<number>(1);
  const [hasError, setHasError] = useState<boolean>(false);

  // Skip cinematic intro and jump straight to the interactive Login interface
  const handleSkipToLogin = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
    }
    setEntryState('LOGIN');
    setSplitProgress(1);
    setVideoOpacity(0);

    // Autofocus operator credential input field
    setTimeout(() => {
      document.getElementById('operator-id-input')?.focus();
    }, 50);
  }, []);

  // Check prefers-reduced-motion and keyboard skip (Escape)
  useEffect(() => {
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (motionQuery.matches) {
      handleSkipToLogin();
      return;
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleSkipToLogin();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSkipToLogin]);

  // Video playback loop synchronized with video.currentTime
  useEffect(() => {
    if (entryState === 'LOGIN') return;

    const video = videoRef.current;
    if (!video) return;

    // Attempt video autoplay
    video.play().catch((err) => {
      console.warn('Cinematic autoplay rejected or unplayable. Bypassing to Login.', err);
      handleSkipToLogin();
    });

    const updateFrame = () => {
      if (!video) return;

      const currentTime = video.currentTime;
      const { splitStart, splitEnd, outroEnd } = ENTRY_TIMING;

      if (currentTime < splitStart) {
        // Phase 1: Full-screen intro before split begins
        setEntryState('INTRO');
        setSplitProgress(0);
        setVideoOpacity(1);
      } else if (currentTime >= splitStart && currentTime < splitEnd) {
        // Phase 2: Active logo split reveal
        setEntryState('SPLIT_REVEAL');
        const rawProgress = (currentTime - splitStart) / (splitEnd - splitStart);
        // Smooth cubic easing for physical hydraulic door inertia
        const easedProgress = Math.min(1, Math.max(0, rawProgress));
        setSplitProgress(easedProgress);
        setVideoOpacity(1);
      } else if (currentTime >= splitEnd && currentTime < outroEnd) {
        // Phase 3: Split aperture fully opened; video dissolves
        setEntryState('REVEAL_COMPLETE');
        setSplitProgress(1);

        // Smoothly fade out remaining video elements over the outro interval
        const outroProgress = (currentTime - splitEnd) / (outroEnd - splitEnd);
        setVideoOpacity(Math.max(0, 1 - outroProgress));
      } else if (currentTime >= outroEnd || video.ended) {
        // Phase 4: Video finished, transition to clean Login state
        handleSkipToLogin();
        return;
      }

      animFrameRef.current = requestAnimationFrame(updateFrame);
    };

    animFrameRef.current = requestAnimationFrame(updateFrame);

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [entryState, handleSkipToLogin]);

  // Handle video loading or decoding errors gracefully
  const handleVideoError = () => {
    console.warn('Video source error. Falling back directly to Login.');
    setHasError(true);
    handleSkipToLogin();
  };

  // Calculate opening aperture dimensions based on splitProgress
  // At progress = 0: gap is 0% (leftEdge = 50%, rightEdge = 50%)
  // At progress = 1: gap is 100% (leftEdge = 0%, rightEdge = 100%)
  const apertureWidth = splitProgress * 100;
  const leftEdge = Math.max(0, 50 - apertureWidth / 2);
  const rightEdge = Math.min(100, 50 + apertureWidth / 2);

  // CSS mask for the video overlay: transparent in center, opaque on flanks
  // During INTRO (progress === 0), mask is completely opaque.
  const maskStyle =
    splitProgress > 0 && splitProgress < 1
      ? {
          WebkitMaskImage: `linear-gradient(to right, #000 0%, #000 calc(${leftEdge}% - 12px), transparent ${leftEdge}%, transparent ${rightEdge}%, #000 calc(${rightEdge}% + 12px), #000 100%)`,
          maskImage: `linear-gradient(to right, #000 0%, #000 calc(${leftEdge}% - 12px), transparent ${leftEdge}%, transparent ${rightEdge}%, #000 calc(${rightEdge}% + 12px), #000 100%)`,
        }
      : splitProgress >= 1
      ? {
          WebkitMaskImage: 'none',
          maskImage: 'none',
          opacity: 0,
        }
      : {
          WebkitMaskImage: 'none',
          maskImage: 'none',
          opacity: 1,
        };

  return (
    <div
      id="dhruvaa-cinematic-entry"
      className="relative w-full min-h-screen bg-[#090e1b] overflow-hidden select-none"
    >
      {/* ===================================================================== */}
      {/* LAYER 1: EXISTING LOGIN PAGE (MOUNTED UNDERNEATH AT ALL TIMES)        */}
      {/* ===================================================================== */}
      <div
        id="entry-login-layer"
        className="absolute inset-0 z-0 transition-transform duration-700 ease-out"
        style={{
          // Subtle zoom-in depth as the shield doors separate
          transform: entryState === 'INTRO' ? 'scale(0.96)' : 'scale(1)',
          filter: entryState === 'INTRO' ? 'brightness(0.85)' : 'brightness(1)',
        }}
      >
        <Login />
      </div>

      {/* ===================================================================== */}
      {/* LAYER 2: CINEMATIC VIDEO OVERLAY & REVEAL APERTURE                    */}
      {/* ===================================================================== */}
      {entryState !== 'LOGIN' && !hasError && (
        <div
          id="entry-cinematic-overlay"
          aria-hidden="true"
          className="absolute inset-0 z-40 pointer-events-none transition-opacity duration-300"
          style={{ opacity: videoOpacity }}
        >
          {/* Masked Video Viewport Container */}
          <div
            className="w-full h-full relative overflow-hidden"
            style={maskStyle}
          >
            <video
              ref={videoRef}
              src={`${import.meta.env.BASE_URL}assets/Dhruva_entry.mp4`}
              autoPlay
              muted
              playsInline
              onError={handleVideoError}
              className="w-full h-full object-cover object-center"
              aria-hidden="true"
            />
          </div>

          {/* DUAL ELECTRIC CYAN LASER SEAM EDGES */}
          {/* Synchronized with the separating shield halves */}
          {entryState === 'SPLIT_REVEAL' && (
            <>
              {/* Left Door Laser Seam */}
              <div
                className="absolute top-0 bottom-0 w-[3px] bg-[#00f0ff] shadow-[0_0_15px_#00f0ff,0_0_30px_#00f0ff,0_0_50px_rgba(0,240,255,0.7)] pointer-events-none transition-all duration-75"
                style={{
                  left: `${leftEdge}%`,
                  opacity: Math.sin(splitProgress * Math.PI) * 0.9 + 0.1,
                }}
              >
                {/* Tactical Corner Reticles on Left Door */}
                <div className="absolute top-1/4 -right-1 w-2 h-2 border-t-2 border-r-2 border-[#00f0ff]" />
                <div className="absolute bottom-1/4 -right-1 w-2 h-2 border-b-2 border-r-2 border-[#00f0ff]" />
              </div>

              {/* Right Door Laser Seam */}
              <div
                className="absolute top-0 bottom-0 w-[3px] bg-[#00f0ff] shadow-[0_0_15px_#00f0ff,0_0_30px_#00f0ff,0_0_50px_rgba(0,240,255,0.7)] pointer-events-none transition-all duration-75"
                style={{
                  left: `${rightEdge}%`,
                  opacity: Math.sin(splitProgress * Math.PI) * 0.9 + 0.1,
                }}
              >
                {/* Tactical Corner Reticles on Right Door */}
                <div className="absolute top-1/4 -left-1 w-2 h-2 border-t-2 border-l-2 border-[#00f0ff]" />
                <div className="absolute bottom-1/4 -left-1 w-2 h-2 border-b-2 border-l-2 border-[#00f0ff]" />
              </div>

              {/* Central Energy Glow Aura at Split Origin */}
              <div
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-[#00f0ff]/10 rounded-full blur-3xl pointer-events-none"
                style={{
                  opacity: (1 - splitProgress) * 0.8,
                  transform: `translate(-50%, -50%) scale(${1 + splitProgress * 2})`,
                }}
              />
            </>
          )}

          {/* Quick Non-Intrusive Skip Control */}
          <div className="absolute top-6 right-6 z-50 pointer-events-auto">
            <button
              id="btn-skip-cinematic"
              onClick={handleSkipToLogin}
              className="group px-3 py-1.5 rounded bg-[#090e1b]/80 hover:bg-[#161b29] border border-[#00f0ff]/30 hover:border-[#00f0ff] text-[#b9cacb] hover:text-[#00f0ff] font-mono text-xs uppercase tracking-wider flex items-center gap-2 backdrop-blur-md shadow-lg transition-all cursor-pointer"
              title="Skip intro animation (ESC)"
            >
              <span>SKIP INTRO</span>
              <span className="text-[10px] bg-[#252a38] px-1.5 py-0.5 rounded text-[#849495] group-hover:text-[#00f0ff] border border-[#3b494b]/40">
                ESC
              </span>
              <FastForward className="w-3.5 h-3.5 text-[#00f0ff]" />
            </button>
          </div>

          {/* Bottom Tactical Classification Ticker */}
          <div className="absolute bottom-6 left-6 z-50 pointer-events-none flex items-center gap-2 font-mono text-[11px] text-[#849495]">
            <Shield className="w-3.5 h-3.5 text-[#00f0ff]" />
            <span>PROJECT DHRUVA</span>
            <span>//</span>
            <span className="text-[#00f0ff]">VAULT INITIALIZATION</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default Entry;
