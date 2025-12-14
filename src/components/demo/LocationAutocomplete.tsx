/**
 * LocationAutocomplete.tsx
 * Location input with autocomplete suggestions for global locations.
 * 
 * Best practice location selector with typeahead functionality.
 */

import React, { useState, useEffect, useRef } from 'react';
import colors from '@/lib/design/colors';

export interface LocationAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  id?: string;
  style?: React.CSSProperties;
}

/**
 * Global locations database (curated list of popular cities and locations)
 */
const GLOBAL_LOCATIONS = [
  // Major US Cities
  'San Francisco, CA',
  'New York, NY',
  'Los Angeles, CA',
  'Chicago, IL',
  'Seattle, WA',
  'Boston, MA',
  'Austin, TX',
  'Miami, FL',
  'Denver, CO',
  'Portland, OR',
  'Nashville, TN',
  'New Orleans, LA',
  'Las Vegas, NV',
  'San Diego, CA',
  'Portland, ME',
  'Charleston, SC',
  'Savannah, GA',
  'Asheville, NC',
  'Boulder, CO',
  'Santa Fe, NM',
  
  // International Cities
  'London, UK',
  'Paris, France',
  'Tokyo, Japan',
  'Sydney, Australia',
  'Toronto, Canada',
  'Vancouver, Canada',
  'Amsterdam, Netherlands',
  'Berlin, Germany',
  'Barcelona, Spain',
  'Rome, Italy',
  'Lisbon, Portugal',
  'Dublin, Ireland',
  'Edinburgh, Scotland',
  'Copenhagen, Denmark',
  'Stockholm, Sweden',
  'Oslo, Norway',
  'Reykjavik, Iceland',
  'Zurich, Switzerland',
  'Vienna, Austria',
  'Prague, Czech Republic',
  'Budapest, Hungary',
  'Warsaw, Poland',
  'Istanbul, Turkey',
  'Dubai, UAE',
  'Singapore',
  'Hong Kong',
  'Bangkok, Thailand',
  'Bali, Indonesia',
  'Melbourne, Australia',
  'Auckland, New Zealand',
  'Mexico City, Mexico',
  'Buenos Aires, Argentina',
  'Rio de Janeiro, Brazil',
  'Santiago, Chile',
  'Lima, Peru',
  'Cape Town, South Africa',
  'Marrakech, Morocco',
  'Cairo, Egypt',
  
  // Generic/Common Locations
  'Home',
  'Outdoors',
  'Nearby',
  'Downtown',
  'Beach',
  'Mountains',
  'City Center',
  'Waterfront',
  'Park',
  'Historic District',
];

/**
 * Filters locations based on search query
 */
function filterLocations(query: string): string[] {
  if (!query || query.trim().length === 0) {
    return GLOBAL_LOCATIONS.slice(0, 10); // Show top 10 when empty
  }
  
  const lowerQuery = query.toLowerCase().trim();
  const matches = GLOBAL_LOCATIONS.filter(location =>
    location.toLowerCase().includes(lowerQuery)
  );
  
  // Sort by relevance (exact matches first, then starts with, then contains)
  return matches.sort((a, b) => {
    const aLower = a.toLowerCase();
    const bLower = b.toLowerCase();
    
    if (aLower === lowerQuery) return -1;
    if (bLower === lowerQuery) return 1;
    if (aLower.startsWith(lowerQuery)) return -1;
    if (bLower.startsWith(lowerQuery)) return 1;
    return 0;
  }).slice(0, 8); // Limit to 8 suggestions
}

/**
 * LocationAutocomplete component
 */
export default function LocationAutocomplete({
  value,
  onChange,
  placeholder = 'e.g., San Francisco, home, outdoors',
  disabled = false,
  id = 'location',
  style,
}: LocationAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Update suggestions when value changes
  useEffect(() => {
    if (isFocused && value) {
      const filtered = filterLocations(value);
      setSuggestions(filtered);
      setShowSuggestions(filtered.length > 0);
    } else if (isFocused && !value) {
      // Show top suggestions when focused but empty
      setSuggestions(GLOBAL_LOCATIONS.slice(0, 10));
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
    setHighlightedIndex(-1);
  }, [value, isFocused]);

  // Close suggestions on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
        setIsFocused(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
  };

  // Handle input focus
  const handleFocus = () => {
    setIsFocused(true);
    if (value) {
      const filtered = filterLocations(value);
      setSuggestions(filtered);
      setShowSuggestions(filtered.length > 0);
    } else {
      setSuggestions(GLOBAL_LOCATIONS.slice(0, 10));
      setShowSuggestions(true);
    }
  };

  // Handle input blur (with delay to allow click on suggestion)
  const handleBlur = () => {
    setTimeout(() => {
      setIsFocused(false);
      setShowSuggestions(false);
    }, 200);
  };

  // Handle suggestion selection
  const handleSelectSuggestion = (suggestion: string) => {
    onChange(suggestion);
    setShowSuggestions(false);
    setIsFocused(false);
    inputRef.current?.blur();
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || suggestions.length === 0) {
      if (e.key === 'ArrowDown' && isFocused) {
        e.preventDefault();
        const filtered = filterLocations(value);
        if (filtered.length > 0) {
          setSuggestions(filtered);
          setShowSuggestions(true);
          setHighlightedIndex(0);
        }
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev =>
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => (prev > 0 ? prev - 1 : -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < suggestions.length) {
          handleSelectSuggestion(suggestions[highlightedIndex]);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setHighlightedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  };

  return (
    <div style={{ ...styles.container, ...style }} ref={containerRef}>
      <input
        ref={inputRef}
        id={id}
        type="text"
        value={value}
        onChange={handleInputChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        autoComplete="off"
        aria-autocomplete="list"
        aria-expanded={showSuggestions}
        aria-haspopup="listbox"
        aria-controls={showSuggestions ? `${id}-suggestions` : undefined}
        style={styles.input}
      />
      {showSuggestions && suggestions.length > 0 && (
        <div
          id={`${id}-suggestions`}
          ref={suggestionsRef}
          role="listbox"
          style={styles.suggestions}
        >
          {suggestions.map((suggestion, index) => (
            <button
              key={suggestion}
              type="button"
              role="option"
              aria-selected={index === highlightedIndex}
              onClick={() => handleSelectSuggestion(suggestion)}
              onMouseEnter={() => setHighlightedIndex(index)}
              style={{
                ...styles.suggestionItem,
                ...(index === highlightedIndex ? styles.suggestionItemHighlighted : {}),
              }}
            >
              {suggestion}
            </button>
          ))}
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
  input: {
    width: '100%',
    padding: '0.75rem',
    fontSize: '1rem',
    border: `2px solid ${colors.border}`,
    borderRadius: '8px',
    outline: 'none',
    transition: 'border-color 0.2s',
    backgroundColor: colors.bgPrimary,
    color: colors.textPrimary,
  },
  suggestions: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    marginTop: '0.25rem',
    backgroundColor: colors.bgPrimary,
    border: `1px solid ${colors.border}`,
    borderRadius: '0.5rem',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    maxHeight: '240px',
    overflowY: 'auto',
    zIndex: 1000,
    display: 'flex',
    flexDirection: 'column',
  },
  suggestionItem: {
    width: '100%',
    padding: '0.75rem 1rem',
    fontSize: '0.9375rem',
    textAlign: 'left',
    backgroundColor: 'transparent',
    border: 'none',
    borderBottom: `1px solid ${colors.bgHover}`,
    cursor: 'pointer',
    transition: 'background-color 0.15s',
    outline: 'none',
    color: colors.textPrimary,
  },
  suggestionItemHighlighted: {
    backgroundColor: colors.bgHover,
  },
};

// Add hover and focus styles
if (typeof document !== 'undefined') {
  const styleId = 'location-autocomplete-styles';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      #location:focus {
        border-color: ${colors.primary} !important;
        box-shadow: 0 0 0 3px rgba(29, 66, 137, 0.1) !important;
      }
      [role="option"]:hover {
        background-color: ${colors.bgHover} !important;
      }
      [role="option"]:focus {
        outline: 2px solid ${colors.primary};
        outline-offset: -2px;
      }
      /* Scrollbar styling for suggestions */
      [role="listbox"]::-webkit-scrollbar {
        width: 8px;
      }
      [role="listbox"]::-webkit-scrollbar-track {
        background: ${colors.bgHover};
        border-radius: 4px;
      }
      [role="listbox"]::-webkit-scrollbar-thumb {
        background: ${colors.border};
        border-radius: 4px;
      }
      [role="listbox"]::-webkit-scrollbar-thumb:hover {
        background: ${colors.textMuted};
      }
    `;
    if (document.head) {
      document.head.appendChild(style);
    }
  }
}

