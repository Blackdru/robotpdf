# RobotPDF Vibrant Futuristic Theme

## 🎨 Color Palette

### Primary Colors
- **Purple**: `#6C00FF` - Main brand color, represents intelligence and innovation
- **Pink**: `#FF0099` - Energy and creativity
- **Orange**: `#FF7A00` - Warmth and approachability

### Accent Colors
- **Teal**: `#2DE2E6` - Fresh, modern accent
- **Blue**: `#4D7CFF` - Trust and reliability
- **Yellow**: `#FFD600` - Optimism and brightness
- **Red**: `#FF1744` - Urgency and importance

### Extended Palette
- Purple Light: `#8B3DFF`
- Purple Dark: `#5500CC`
- Pink Light: `#FF33B5`
- Pink Dark: `#CC0077`
- Orange Light: `#FF9933`
- Orange Dark: `#CC6200`
- Teal Light: `#5EEAEE`
- Teal Dark: `#00B8BC`

## 🎭 Gradients

### Hero Gradients
```css
/* Main Hero */
background: linear-gradient(135deg, #6C00FF 0%, #FF0099 50%, #FF7A00 100%);

/* Alternative Hero */
background: linear-gradient(120deg, #6C00FF 0%, #FF0099 40%, #FF7A00 80%, #FFD600 100%);

/* Radial Hero */
background: radial-gradient(circle at top right, #6C00FF 0%, #FF0099 40%, #FF7A00 100%);
```

### Tool Card Gradients
```css
/* Purple-Pink (OCR, AI Tools) */
background: linear-gradient(135deg, #6C00FF 0%, #FF0099 100%);

/* Pink-Orange (Chat, Interactive) */
background: linear-gradient(135deg, #FF0099 0%, #FF7A00 100%);

/* Blue-Teal (Convert, Transform) */
background: linear-gradient(135deg, #4D7CFF 0%, #2DE2E6 100%);

/* Yellow-Orange (Summarize, Extract) */
background: linear-gradient(135deg, #FFD600 0%, #FF7A00 100%);
```

### Soft Background Gradients
```css
/* Soft Hero Background */
background: linear-gradient(135deg, rgba(108, 0, 255, 0.1) 0%, rgba(255, 0, 153, 0.1) 50%, rgba(255, 122, 0, 0.1) 100%);

/* Soft Purple */
background: linear-gradient(135deg, rgba(108, 0, 255, 0.15) 0%, rgba(139, 61, 255, 0.1) 100%);
```

## 🎯 Component Classes

### Buttons
- `.btn-robot-primary` - Main CTA button with animated gradient
- `.btn-robot-purple` - Purple gradient button
- `.btn-robot-pink` - Pink gradient button
- `.btn-robot-orange` - Orange gradient button
- `.btn-robot-teal` - Teal gradient button
- `.btn-robot-gradient-1` - Purple to Pink
- `.btn-robot-gradient-2` - Pink to Orange
- `.btn-robot-gradient-3` - Blue to Teal
- `.btn-robot-gradient-4` - Yellow to Orange
- `.btn-robot-outline` - Outlined button with hover fill
- `.btn-robot-glass` - Glassmorphism button

### Cards
- `.robot-card` - Basic card with subtle border
- `.robot-card-hover` - Card with hover lift effect
- `.robot-card-gradient` - Card with gradient background
- `.robot-card-glow` - Card with glow effect
- `.robot-glass-card` - Glassmorphism card

### Tool Cards (Specific Colors)
- `.robot-tool-card-purple` - For OCR, AI tools
- `.robot-tool-card-pink` - For Chat, Interactive features
- `.robot-tool-card-orange` - For Conversion tools
- `.robot-tool-card-teal` - For Transform tools

### Text Gradients
- `.text-gradient-robot` - Full rainbow gradient
- `.text-gradient-robot-purple` - Purple gradient
- `.text-gradient-robot-pink` - Pink gradient
- `.text-gradient-robot-orange` - Orange gradient
- `.text-gradient-robot-teal` - Teal gradient

### Backgrounds
- `.bg-robot-hero` - Hero section gradient
- `.bg-robot-soft` - Soft background gradient

### Badges
- `.robot-badge` - Standard badge
- `.robot-badge-glow` - Badge with pulsing glow

### Icons
- `.robot-icon-wrapper` - Icon container with gradient
- `.robot-icon-wrapper-glow` - Icon container with glow

## 🎬 Animations

### Available Animations
- `animate-float` - Gentle floating motion (6s)
- `animate-float-slow` - Slower floating with rotation (8s)
- `animate-blob` - Organic blob movement (7s)
- `animate-pulse-glow` - Pulsing glow effect (2s)
- `animate-robot-glow` - Robot-themed glow (3s)
- `animate-shimmer` - Shimmer effect (3s)
- `animate-gradient-shift` - Gradient position shift (5s)
- `animate-bounce-slow` - Slow bounce (3s)

## 📦 Shadow System

### Standard Shadows
- `shadow-robot-purple` - Purple-tinted shadow
- `shadow-robot-pink` - Pink-tinted shadow
- `shadow-robot-orange` - Orange-tinted shadow
- `shadow-robot-teal` - Teal-tinted shadow
- `shadow-robot-blue` - Blue-tinted shadow
- `shadow-robot-yellow` - Yellow-tinted shadow

### Glow Effects
- `shadow-robot-glow` - Standard glow
- `shadow-robot-glow-strong` - Intense glow
- `shadow-robot-glow-purple` - Purple glow
- `shadow-robot-glow-pink` - Pink glow
- `shadow-robot-glow-orange` - Orange glow
- `shadow-robot-glow-teal` - Teal glow

### Card Shadows
- `shadow-robot-card` - Standard card shadow
- `shadow-robot-card-hover` - Hover state shadow
- `shadow-robot-float` - Floating card shadow

## 🎨 Design Principles

### Visual Style
1. **Vibrant & Colorful**: Use saturated, bright colors
2. **Smooth Gradients**: Always use gradient transitions
3. **Soft Shapes**: Rounded corners (2xl, 3xl)
4. **Floating Elements**: Use subtle animations
5. **Glowing Effects**: Add depth with shadows and glows

### Typography
- **Headings**: Bold, large, gradient text
- **Body**: Clean, readable, black on white
- **Accents**: Use gradient text for emphasis

### Spacing
- **Cards**: Large padding (p-6 to p-8)
- **Sections**: Generous spacing (py-16 to py-24)
- **Elements**: Consistent gaps (gap-6 to gap-8)

### Interactions
- **Hover**: Lift effect (-translate-y-2)
- **Active**: Scale down (scale-95)
- **Transitions**: Smooth (duration-300)

## 🤖 Robot Mascot Guidelines

### Character Traits
- Friendly and approachable
- Modern and futuristic
- Rounded body shape
- Glowing screen/face
- Colorful accents matching brand

### Usage
- Hero sections (right side)
- Tool cards (as icons)
- Loading states
- Empty states
- Success messages

## 📱 Responsive Design

### Breakpoints
- Mobile: < 640px
- Tablet: 640px - 1024px
- Desktop: > 1024px

### Mobile Considerations
- Larger touch targets (min-h-[56px])
- Simplified gradients
- Reduced animations
- Stacked layouts

## 🎯 Tool Color Mapping

### By Category
- **OCR Tools**: Purple-Pink gradient
- **Chat/AI Tools**: Pink-Red gradient
- **Convert Tools**: Blue-Teal gradient
- **Summarize Tools**: Yellow-Orange gradient
- **Merge Tools**: Purple-Orange gradient
- **Split Tools**: Teal-Blue gradient

## 🌟 Best Practices

1. **Always use gradients** for primary actions
2. **Add shadows** to create depth
3. **Animate on hover** for interactivity
4. **Use white backgrounds** for cards
5. **Keep text readable** (black on white)
6. **Add glow effects** for premium feel
7. **Use rounded corners** consistently
8. **Maintain color hierarchy** (purple > pink > orange)
