/**
 * Email/Calendar Agent Design System
 * Premium dark theme inspired by wealth management apps
 */

export const designTokens = {
  // Color Palette - Premium Dark Theme
  colors: {
    // Primary brand colors
    primary: {
      50: '#eff6ff',
      100: '#dbeafe',
      200: '#bfdbfe',
      300: '#93c5fd',
      400: '#60a5fa',
      500: '#3b82f6', // Main brand blue
      600: '#2563eb',
      700: '#1d4ed8',
      800: '#1e40af',
      900: '#1e3a8a',
    },
    
    // Secondary accent colors
    secondary: {
      50: '#f0f9ff',
      100: '#e0f2fe',
      200: '#bae6fd',
      300: '#7dd3fc',
      400: '#38bdf8',
      500: '#0ea5e9',
      600: '#0284c7',
      700: '#0369a1',
      800: '#075985',
      900: '#0c4a6e',
    },
    
    // Success/Calendar green
    success: {
      50: '#f0fdf4',
      100: '#dcfce7',
      200: '#bbf7d0',
      300: '#86efac',
      400: '#4ade80',
      500: '#22c55e',
      600: '#16a34a',
      700: '#15803d',
      800: '#166534',
      900: '#14532d',
    },
    
    // Warning/Email amber
    warning: {
      50: '#fffbeb',
      100: '#fef3c7',
      200: '#fde68a',
      300: '#fcd34d',
      400: '#fbbf24',
      500: '#f59e0b',
      600: '#d97706',
      700: '#b45309',
      800: '#92400e',
      900: '#78350f',
    },
    
    // Error/Danger red
    error: {
      50: '#fef2f2',
      100: '#fee2e2',
      200: '#fecaca',
      300: '#fca5a5',
      400: '#f87171',
      500: '#ef4444',
      600: '#dc2626',
      700: '#b91c1c',
      800: '#991b1b',
      900: '#7f1d1d',
    },
    
    // Grayscale - Main UI colors
    gray: {
      50: '#f9fafb',
      100: '#f3f4f6',
      200: '#e5e7eb',
      300: '#d1d5db',
      400: '#9ca3af',
      500: '#6b7280',
      600: '#4b5563',
      700: '#374151',
      800: '#1f2937', // Card backgrounds
      850: '#1a1f2e', // Slightly lighter than 900
      900: '#111827', // Main background
      950: '#0a0e1a', // Darkest background
    },
  },
  
  // Typography Scale
  typography: {
    fontFamily: {
      sans: ['Inter', 'system-ui', 'sans-serif'],
      mono: ['JetBrains Mono', 'Consolas', 'monospace'],
    },
    fontSize: {
      xs: ['0.75rem', { lineHeight: '1rem' }],      // 12px
      sm: ['0.875rem', { lineHeight: '1.25rem' }],  // 14px
      base: ['1rem', { lineHeight: '1.5rem' }],     // 16px
      lg: ['1.125rem', { lineHeight: '1.75rem' }],  // 18px
      xl: ['1.25rem', { lineHeight: '1.75rem' }],   // 20px
      '2xl': ['1.5rem', { lineHeight: '2rem' }],    // 24px
      '3xl': ['1.875rem', { lineHeight: '2.25rem' }], // 30px
      '4xl': ['2.25rem', { lineHeight: '2.5rem' }], // 36px
    },
    fontWeight: {
      light: '300',
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
      extrabold: '800',
    },
  },
  
  // Spacing Scale
  spacing: {
    px: '1px',
    0: '0',
    0.5: '0.125rem',  // 2px
    1: '0.25rem',     // 4px
    1.5: '0.375rem',  // 6px
    2: '0.5rem',      // 8px
    2.5: '0.625rem',  // 10px
    3: '0.75rem',     // 12px
    3.5: '0.875rem',  // 14px
    4: '1rem',        // 16px
    5: '1.25rem',     // 20px
    6: '1.5rem',      // 24px
    7: '1.75rem',     // 28px
    8: '2rem',        // 32px
    9: '2.25rem',     // 36px
    10: '2.5rem',     // 40px
    12: '3rem',       // 48px
    16: '4rem',       // 64px
    20: '5rem',       // 80px
    24: '6rem',       // 96px
  },
  
  // Border Radius
  borderRadius: {
    none: '0',
    xs: '0.125rem',   // 2px
    sm: '0.25rem',    // 4px
    base: '0.375rem', // 6px
    md: '0.5rem',     // 8px
    lg: '0.75rem',    // 12px
    xl: '1rem',       // 16px
    '2xl': '1.5rem',  // 24px
    '3xl': '2rem',    // 32px
    full: '9999px',
  },
  
  // Box Shadow
  boxShadow: {
    xs: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    sm: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
    base: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    md: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    lg: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
    xl: '0 25px 50px -12px rgb(0 0 0 / 0.25)',
    '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
    inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
    // Custom premium shadows
    premium: '0 20px 40px -12px rgba(0, 0, 0, 0.4), 0 8px 16px -8px rgba(0, 0, 0, 0.3)',
    glow: '0 0 20px 2px rgba(59, 130, 246, 0.15)',
    card: '0 4px 16px 0 rgba(0, 0, 0, 0.12), 0 1px 4px 0 rgba(0, 0, 0, 0.08)',
  },
  
  // Animation & Transitions
  animation: {
    transition: {
      fast: '150ms cubic-bezier(0.4, 0, 0.2, 1)',
      base: '300ms cubic-bezier(0.4, 0, 0.2, 1)',
      slow: '500ms cubic-bezier(0.4, 0, 0.2, 1)',
    },
    easing: {
      linear: 'linear',
      in: 'cubic-bezier(0.4, 0, 1, 1)',
      out: 'cubic-bezier(0, 0, 0.2, 1)',
      inOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
      // Premium easings
      bounceIn: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
      smoothIn: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
      smoothOut: 'cubic-bezier(0.23, 1, 0.320, 1)',
    },
  },
};

// Component-specific styles
export const componentStyles = {
  // Button variants
  button: {
    primary: {
      background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
      hover: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
      shadow: '0 4px 14px 0 rgba(59, 130, 246, 0.25)',
      text: '#ffffff',
    },
    secondary: {
      background: 'rgba(75, 85, 99, 0.8)',
      hover: 'rgba(75, 85, 99, 1)',
      border: '1px solid rgba(156, 163, 175, 0.3)',
      text: '#d1d5db',
    },
    ghost: {
      background: 'transparent',
      hover: 'rgba(75, 85, 99, 0.2)',
      text: '#9ca3af',
    },
  },
  
  // Card styles
  card: {
    primary: {
      background: 'rgba(31, 41, 55, 0.95)',
      border: '1px solid rgba(75, 85, 99, 0.3)',
      shadow: '0 4px 16px 0 rgba(0, 0, 0, 0.12)',
      backdrop: 'blur(12px)',
    },
    hover: {
      background: 'rgba(31, 41, 55, 1)',
      border: '1px solid rgba(75, 85, 99, 0.5)',
      shadow: '0 8px 24px 0 rgba(0, 0, 0, 0.15)',
      transform: 'translateY(-2px)',
    },
  },
  
  // Input styles
  input: {
    primary: {
      background: 'rgba(31, 41, 55, 0.8)',
      border: '1px solid rgba(75, 85, 99, 0.5)',
      focus: {
        border: '1px solid #3b82f6',
        shadow: '0 0 0 3px rgba(59, 130, 246, 0.1)',
      },
      text: '#f3f4f6',
      placeholder: '#9ca3af',
    },
  },
  
  // Chat bubble styles
  chat: {
    user: {
      background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
      text: '#ffffff',
      shadow: '0 2px 8px 0 rgba(59, 130, 246, 0.2)',
    },
    ai: {
      background: 'rgba(31, 41, 55, 0.9)',
      text: '#f3f4f6',
      border: '1px solid rgba(75, 85, 99, 0.3)',
      shadow: '0 2px 8px 0 rgba(0, 0, 0, 0.1)',
    },
  },
  
  // Status indicators
  status: {
    online: '#22c55e',
    away: '#f59e0b',
    busy: '#ef4444',
    offline: '#6b7280',
    unread: '#3b82f6',
  },
  
  // Gradients
  gradients: {
    primary: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
    secondary: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)',
    success: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
    warning: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
    dark: 'linear-gradient(135deg, #111827 0%, #0f172a 100%)',
    surface: 'linear-gradient(135deg, rgba(31, 41, 55, 0.95) 0%, rgba(17, 24, 39, 0.95) 100%)',
    overlay: 'linear-gradient(180deg, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 0.8) 100%)',
    // Premium wealth-management inspired gradients
    wealth: 'linear-gradient(135deg, #1e40af 0%, #7c3aed 50%, #059669 100%)',
    gold: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
    platinum: 'linear-gradient(135deg, #6b7280 0%, #374151 100%)',
  },
};

// Responsive breakpoints
export const breakpoints = {
  sm: '640px',   // Mobile landscape
  md: '768px',   // Tablet
  lg: '1024px',  // Desktop
  xl: '1280px',  // Large desktop
  '2xl': '1536px', // Extra large desktop
};

// Z-index scale
export const zIndex = {
  base: 0,
  dropdown: 1000,
  sticky: 1020,
  fixed: 1030,
  modal: 1040,
  popover: 1050,
  tooltip: 1060,
  toast: 1070,
  max: 2147483647,
};

// Animation keyframes
export const keyframes = {
  fadeIn: {
    from: { opacity: 0 },
    to: { opacity: 1 },
  },
  fadeOut: {
    from: { opacity: 1 },
    to: { opacity: 0 },
  },
  slideUp: {
    from: { transform: 'translateY(100%)', opacity: 0 },
    to: { transform: 'translateY(0)', opacity: 1 },
  },
  slideDown: {
    from: { transform: 'translateY(-100%)', opacity: 0 },
    to: { transform: 'translateY(0)', opacity: 1 },
  },
  scaleIn: {
    from: { transform: 'scale(0.95)', opacity: 0 },
    to: { transform: 'scale(1)', opacity: 1 },
  },
  pulse: {
    '0%, 100%': { opacity: 1 },
    '50%': { opacity: 0.5 },
  },
  bounce: {
    '0%, 20%, 53%, 80%, 100%': {
      transform: 'translate3d(0,0,0)',
    },
    '40%, 43%': {
      transform: 'translate3d(0, -30px, 0)',
    },
    '70%': {
      transform: 'translate3d(0, -15px, 0)',
    },
    '90%': {
      transform: 'translate3d(0, -4px, 0)',
    },
  },
  shimmer: {
    '0%': {
      backgroundPosition: '-200px 0',
    },
    '100%': {
      backgroundPosition: 'calc(200px + 100%) 0',
    },
  },
};

// Utility classes for common patterns
export const utilities = {
  // Glass morphism effects
  glass: {
    background: 'rgba(255, 255, 255, 0.05)',
    backdropFilter: 'blur(16px)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
  },
  
  // Premium card effect
  premiumCard: {
    background: 'rgba(31, 41, 55, 0.95)',
    backdropFilter: 'blur(12px)',
    border: '1px solid rgba(75, 85, 99, 0.3)',
    boxShadow: '0 4px 16px 0 rgba(0, 0, 0, 0.12), 0 1px 4px 0 rgba(0, 0, 0, 0.08)',
    borderRadius: '12px',
  },
  
  // Gradient text
  gradientText: {
    background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  },
  
  // Focus ring
  focusRing: {
    outline: '2px solid transparent',
    outlineOffset: '2px',
    boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)',
  },
  
  // Scrollbar styling
  scrollbar: {
    '&::-webkit-scrollbar': {
      width: '4px',
    },
    '&::-webkit-scrollbar-track': {
      background: 'rgba(75, 85, 99, 0.1)',
    },
    '&::-webkit-scrollbar-thumb': {
      background: 'rgba(156, 163, 175, 0.3)',
      borderRadius: '2px',
    },
    '&::-webkit-scrollbar-thumb:hover': {
      background: 'rgba(156, 163, 175, 0.5)',
    },
  },
};

export default designTokens;