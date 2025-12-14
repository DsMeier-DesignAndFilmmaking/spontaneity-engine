/**
 * SmartInput.tsx
 * Primary input component for natural language spontaneity requests.
 * 
 * Replaces the three separate fields (Vibe, Duration, Location) with a single,
 * prominent text input that parses natural language and updates hidden legacy components.
 * Includes voice input functionality using Web Speech API.
 */

import React, { useState, useEffect, useRef } from 'react';
import colors from '@/lib/design/colors';
import { parseSpontaneityRequest } from '@/lib/utils/parseSpontaneityRequest';

export interface SmartInputProps {
  value: string;
  onChange: (value: string) => void;
  onParsedChange?: (parsed: { vibe: string; duration: string; location: string }) => void;
  disabled?: boolean;
  placeholder?: string;
}

// Check for Speech Recognition API support
const getSpeechRecognition = () => {
  if (typeof window === 'undefined') return null;
  
  const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  return SpeechRecognition ? new SpeechRecognition() : null;
};

/**
 * SmartInput component - Natural language input for spontaneity requests.
 */
export default function SmartInput({
  value,
  onChange,
  onParsedChange,
  disabled = false,
  placeholder = "Where should we go?",
}: SmartInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Check for speech recognition support
  useEffect(() => {
    const recognition = getSpeechRecognition();
    if (recognition) {
      setSpeechSupported(true);
      recognitionRef.current = recognition;
      
      // Configure recognition
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';
      
      recognition.onstart = () => {
        setIsListening(true);
      };
      
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        onChange(value + (value ? ' ' : '') + transcript);
        setIsListening(false);
      };
      
      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        
        // Show user-friendly error messages
        if (event.error === 'no-speech') {
          // User didn't speak, silently stop
        } else if (event.error === 'not-allowed') {
          alert('Microphone permission denied. Please enable microphone access in your browser settings.');
        } else {
          alert('Voice input is not available. Please type your request instead.');
        }
      };
      
      recognition.onend = () => {
        setIsListening(false);
      };
    }
  }, [value, onChange]);

  // Parse input on change and notify parent
  useEffect(() => {
    if (value.trim() && onParsedChange) {
      const parsed = parseSpontaneityRequest(value);
      onParsedChange(parsed);
    }
  }, [value, onParsedChange]);

  const handleVoiceClick = () => {
    if (!speechSupported || !recognitionRef.current || disabled) return;
    
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
      } catch (error) {
        console.error('Failed to start speech recognition:', error);
        setIsListening(false);
      }
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.inputWrapper}>
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          disabled={disabled}
          style={{
            ...styles.input,
            ...(isFocused ? styles.inputFocused : {}),
            ...(disabled ? styles.inputDisabled : {}),
            paddingRight: speechSupported ? '3.5rem' : '1.25rem',
          }}
          rows={3}
          maxLength={500}
        />
        {speechSupported && (
          <button
            type="button"
            onClick={handleVoiceClick}
            disabled={disabled}
            style={{
              ...styles.voiceButton,
              ...(isListening ? styles.voiceButtonListening : {}),
              ...(disabled ? styles.voiceButtonDisabled : {}),
            }}
            aria-label={isListening ? 'Stop listening' : 'Start voice input'}
            title={isListening ? 'Stop listening' : 'Start voice input'}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              style={styles.voiceIcon}
            >
              {isListening ? (
                // Stop icon (square)
                <path
                  d="M6 6H18V18H6V6Z"
                  fill="currentColor"
                  stroke="currentColor"
                  strokeWidth="2"
                />
              ) : (
                // Microphone icon
                <>
                  <path
                    d="M12 1C10.34 1 9 2.34 9 4V12C9 13.66 10.34 15 12 15C13.66 15 15 13.66 15 12V4C15 2.34 13.66 1 12 1Z"
                    fill="currentColor"
                  />
                  <path
                    d="M19 10V12C19 15.87 15.87 19 12 19M5 10V12C5 15.87 8.13 19 12 19M12 19V23M8 23H16"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                  />
                </>
              )}
            </svg>
          </button>
        )}
      </div>
      {value.length > 0 && (
        <div style={styles.characterCount}>
          {value.length}/500
        </div>
      )}
      {isListening && (
        <div style={styles.listeningIndicator} role="status" aria-live="polite">
          <div style={styles.listeningPulse}></div>
          Listening...
        </div>
      )}
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    position: 'relative',
    width: '100%',
  },
  inputWrapper: {
    position: 'relative',
    width: '100%',
  },
  input: {
    width: '100%',
    padding: '1.25rem',
    fontSize: '1.125rem',
    lineHeight: '1.6',
    borderWidth: '2px',
    borderStyle: 'solid',
    borderColor: `var(--sdk-border-color, ${colors.border})`,
    borderRadius: '12px',
    outline: 'none',
    transition: 'all 0.2s ease',
    fontFamily: 'inherit',
    backgroundColor: 'var(--sdk-bg-color, ' + colors.bgPrimary + ')',
    color: 'var(--sdk-text-color, ' + colors.textPrimary + ')',
    resize: 'vertical',
    minHeight: '120px',
    boxSizing: 'border-box',
  },
  inputFocused: {
    borderColor: `var(--sdk-primary-color, ${colors.primary})`,
    boxShadow: `0 0 0 4px rgba(29, 66, 137, 0.1)`,
  },
  inputDisabled: {
    opacity: 0.6,
    cursor: 'not-allowed',
    backgroundColor: colors.bgHover,
  },
  voiceButton: {
    position: 'absolute',
    right: '0.75rem',
    top: '0.75rem',
    width: '36px',
    height: '36px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    color: 'var(--sdk-text-muted, ' + colors.textMuted + ')',
    transition: 'all 0.2s ease',
    outline: 'none',
  },
  voiceButtonListening: {
    color: 'var(--sdk-error-color, ' + colors.error + ')',
    backgroundColor: 'var(--sdk-bg-accent, ' + colors.bgAccent + ')',
    animation: 'pulse 1.5s ease-in-out infinite',
  },
  voiceButtonDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
  voiceIcon: {
    width: '20px',
    height: '20px',
  },
  characterCount: {
    position: 'absolute',
    bottom: '0.75rem',
    right: '1rem',
    fontSize: '0.75rem',
    color: 'var(--sdk-text-muted, ' + colors.textMuted + ')',
    backgroundColor: 'var(--sdk-bg-color, ' + colors.bgPrimary + ')',
    padding: '0.25rem 0.5rem',
    borderRadius: '4px',
  },
  listeningIndicator: {
    position: 'absolute',
    top: '100%',
    left: 0,
    marginTop: '0.5rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontSize: '0.875rem',
    color: 'var(--sdk-primary-color, ' + colors.primary + ')',
    fontWeight: '500',
  },
  listeningPulse: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    backgroundColor: 'var(--sdk-error-color, ' + colors.error + ')',
    animation: 'pulse 1.5s ease-in-out infinite',
  },
};

// Add pulse animation
if (typeof document !== 'undefined') {
  const styleId = 'smart-input-voice-styles';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      @keyframes pulse {
        0%, 100% {
          opacity: 1;
          transform: scale(1);
        }
        50% {
          opacity: 0.5;
          transform: scale(1.1);
        }
      }
      button[aria-label*="voice"]:hover:not(:disabled) {
        background-color: ${colors.bgHover} !important;
        color: ${colors.primary} !important;
      }
      button[aria-label*="voice"]:focus {
        outline: 2px solid ${colors.primary};
        outline-offset: 2px;
      }
    `;
    if (document.head) {
      document.head.appendChild(style);
    }
  }
}
