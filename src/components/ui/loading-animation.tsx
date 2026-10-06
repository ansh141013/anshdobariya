import React, { useEffect, useMemo, useRef, useState } from 'react';

export interface KineticTypographyLoaderProps {
  words?: string[];
  onComplete?: () => void;
  maxCycles?: number;
  className?: string;
  textColor?: string;
  theme?: 'light' | 'dark';
  subtitle?: string;
}

export const KineticTypographyLoader: React.FC<KineticTypographyLoaderProps> = ({
  words = ["INITIALIZING", "CALIBRATING", "ROBOTICS CORE", "ANSH DOBARIYA"],
  onComplete,
  maxCycles = 1,
  className = "",
  textColor = "text-neutral-900",
  theme = "light",
  subtitle = "AUTONOMOUS SYSTEMS // KINEMATICS & AI",
}) => {
  const [wordIndex, setWordIndex] = useState(0);
  const [isExitingWord, setIsExitingWord] = useState(false);

  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const currentWords = useMemo(() => (words && words.length > 0 ? words : ["LOADING"]), [words]);
  const cycleCountRef = useRef(0);

  useEffect(() => {
    let exitTimer: ReturnType<typeof setTimeout>;
    let nextWordTimer: ReturnType<typeof setTimeout>;

    setIsExitingWord(false);

    // Trigger fly-out
    exitTimer = setTimeout(() => {
      setIsExitingWord(true);
    }, 1250);

    // Trigger next word or complete
    nextWordTimer = setTimeout(() => {
      if (wordIndex === currentWords.length - 1) {
        cycleCountRef.current += 1;
        if (maxCycles > 0 && cycleCountRef.current >= maxCycles) {
          if (onCompleteRef.current) {
            onCompleteRef.current();
          }
          return;
        }
      }
      setWordIndex((prev) => (prev + 1) % currentWords.length);
    }, 1650);

    return () => {
      clearTimeout(exitTimer);
      clearTimeout(nextWordTimer);
    };
  }, [wordIndex, currentWords.length, maxCycles]);

  const currentWord = currentWords[wordIndex] || "";
  const isLight = theme === 'light';

  return (
    <div
      className={`loader-container flex flex-col items-center justify-center min-h-[320px] w-full select-none ${className}`}
      style={{ perspective: '1200px' }}
    >
      {subtitle && (
        <div className="flex items-center gap-2 mb-6 tracking-[0.28em] text-[10px] sm:text-xs font-semibold uppercase text-[#ff6a00] font-mono animate-pulse">
          <span className="inline-block w-2 h-2 rounded-full bg-[#ff6a00] shadow-[0_0_8px_#ff6a00]" />
          <span>{subtitle}</span>
        </div>
      )}

      <h1
        className={`text-4xl sm:text-6xl lg:text-8xl font-extrabold tracking-tight whitespace-nowrap text-center ${textColor} ${
          isLight ? 'drop-shadow-sm' : 'text-white'
        }`}
        style={{
          fontFamily: "'Space Grotesk', system-ui, sans-serif",
          letterSpacing: '-0.04em',
        }}
      >
        {currentWord.split('').map((char, index) => {
          const xOffsetIn = (index - currentWord.length / 2) * 4;
          const xOffsetOut = (index - currentWord.length / 2) * 2;
          const transformFrom = `translate3d(${xOffsetIn}px, 28px, -50px) rotateX(24deg) scale(0.92)`;
          const transformTo = `translate3d(${xOffsetOut}px, -22px, -35px) rotateX(-16deg) scale(0.94)`;

          return (
            <span
              key={`${wordIndex}-${index}-${char}`}
              className="char"
              style={{
                '--transform-from': transformFrom,
                '--transform-to': transformTo,
                animationName: isExitingWord ? 'fly-out' : 'fly-in',
                animationDelay: isExitingWord ? `${index * 0.018}s` : `${index * 0.032}s`,
                animationDuration: isExitingWord ? '0.42s' : '0.55s',
              } as React.CSSProperties}
            >
              {char === ' ' ? '\u00A0' : char}
            </span>
          );
        })}
      </h1>

      <div className="mt-8 flex items-center gap-3">
        <div className="w-24 sm:w-36 h-[2px] bg-gradient-to-r from-transparent via-[#ff6a00] to-transparent animate-pulse" />
      </div>
    </div>
  );
};
