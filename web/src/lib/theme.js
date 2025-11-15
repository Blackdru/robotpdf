// Centralized theme configuration - Professional Clean Design System
export const theme = {
  // Core color palette
  colors: {
    // Primary Indigo Scale
    primary: {
      50: '#EEF2FF',
      100: '#E0E7FF',
      200: '#C7D2FE',
      300: '#A5B4FC',
      400: '#818CF8',
      500: '#6366F1',
      600: '#4F46E5',
      700: '#4338CA',
      800: '#3730A3',
      900: '#312E81',
    },
    
    // Secondary Purple Scale
    secondary: {
      50: '#FAF5FF',
      100: '#F3E8FF',
      200: '#E9D5FF',
      300: '#D8B4FE',
      400: '#C084FC',
      500: '#8B5CF6',
      600: '#7C3AED',
      700: '#6D28D9',
      800: '#5B21B6',
      900: '#4C1D95',
    },
    
    // Accent colors - Professional Palette
    accent: {
      purple: '#8B5CF6',
      pink: '#EC4899',
      orange: '#F97316',
      cyan: '#06B6D4',
      blue: '#3B82F6',
      emerald: '#10B981',
    },
    
    // Semantic colors
    background: '#FFFFFF',
    foreground: '#0F172A',
    surface: '#FFFFFF',
    border: '#E5E7EB',
    input: '#F9FAFB',
    ring: '#6366F1',
  },
  
  // Component-specific color mappings - Professional Theme
  components: {
    button: {
      default: {
        bg: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
        text: '#FFFFFF',
        hover: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
      },
      outline: {
        border: '#6366F1',
        text: '#6366F1',
        hover: {
          bg: 'rgba(99, 102, 241, 0.05)',
          border: '#4F46E5',
          text: '#4F46E5',
        },
      },
      ghost: {
        text: '#6366F1',
        hover: {
          bg: 'rgba(99, 102, 241, 0.05)',
          text: '#4F46E5',
        },
      },
    },
    
    card: {
      bg: '#FFFFFF',
      border: '#E2E8F0',
      text: '#0F172A',
    },
    
    input: {
      bg: '#F9FAFB',
      border: '#E5E7EB',
      text: '#0F172A',
      placeholder: '#9CA3AF',
      focus: {
        border: '#6366F1',
        ring: 'rgba(99, 102, 241, 0.2)',
      },
    },
    
    dropdown: {
      bg: '#FFFFFF',
      border: '#E5E7EB',
      text: '#0F172A',
      item: {
        hover: {
          bg: 'rgba(99, 102, 241, 0.05)',
          text: '#6366F1',
        },
      },
    },
    
    dialog: {
      overlay: 'rgba(15, 23, 42, 0.5)',
      bg: '#FFFFFF',
      border: '#E5E7EB',
    },
  },
  
  // Typography
  typography: {
    fontFamily: {
      sans: ['Inter', 'sans-serif'],
      display: ['Poppins', 'sans-serif'],
      mono: ['JetBrains Mono', 'monospace'],
    },
    
    fontSize: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '1.875rem',
      '4xl': '2.25rem',
      '5xl': '3rem',
      '6xl': '3.75rem',
      '7xl': '4.5rem',
    },
    
    fontWeight: {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
      extrabold: '800',
    },
  },
  
  // Spacing
  spacing: {
    xs: '0.5rem',
    sm: '0.75rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    '2xl': '3rem',
    '3xl': '4rem',
  },
  
  // Border radius
  borderRadius: {
    sm: '0.5rem',
    md: '0.75rem',
    lg: '1rem',
    xl: '1.5rem',
    '2xl': '2rem',
    '3xl': '3rem',
  },
  
  // Shadows - Professional with subtle indigo tint
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(99, 102, 241, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(99, 102, 241, 0.15), 0 4px 6px -4px rgba(0, 0, 0, 0.08)',
    xl: '0 20px 25px -5px rgba(99, 102, 241, 0.2), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
    '2xl': '0 25px 50px -12px rgba(99, 102, 241, 0.25)',
    glow: '0 0 20px rgba(99, 102, 241, 0.3), 0 0 40px rgba(139, 92, 246, 0.2)',
  },
  
  // Gradients - Professional Clean
  gradients: {
    primary: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
    secondary: 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)',
    hero: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 50%, #EC4899 100%)',
    surface: 'linear-gradient(180deg, #FFFFFF 0%, #F8FAFC 100%)',
    page: 'linear-gradient(180deg, #FFFFFF 0%, #F1F5F9 50%, #FFFFFF 100%)',
    blue: 'linear-gradient(135deg, #3B82F6 0%, #6366F1 100%)',
    purple: 'linear-gradient(135deg, #8B5CF6 0%, #A855F7 100%)',
    pink: 'linear-gradient(135deg, #EC4899 0%, #F472B6 100%)',
    orange: 'linear-gradient(135deg, #F97316 0%, #FB923C 100%)',
  },
  
  // Animation durations
  animation: {
    fast: '150ms',
    normal: '300ms',
    slow: '500ms',
  },
  
  // Breakpoints
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },
}

// Utility functions for theme usage
export const getColor = (path) => {
  const keys = path.split('.')
  let value = theme.colors
  
  for (const key of keys) {
    value = value[key]
    if (!value) return null
  }
  
  return value
}

export const getComponentColor = (component, variant = 'default', state = 'default') => {
  const componentColors = theme.components[component]
  if (!componentColors) return null
  
  if (variant === 'default' && state === 'default') {
    return componentColors
  }
  
  const variantColors = componentColors[variant]
  if (!variantColors) return null
  
  if (state === 'default') {
    return variantColors
  }
  
  return variantColors[state] || variantColors
}

export default theme
