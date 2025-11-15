import { Moon } from 'lucide-react'
import { useTheme } from '../contexts/ThemeContext'

const ThemeToggle = () => {
  const { mounted } = useTheme()

  // Single theme mode - component is hidden but kept for compatibility
  // Return null to hide the toggle completely
  return null

  // Alternative: Show a disabled moon icon (uncomment if you want to show it)
  /*
  if (!mounted) {
    return null
  }

  return (
    <div
      className="p-2 rounded-xl bg-card border border-border opacity-50 cursor-not-allowed"
      title="Single theme mode"
    >
      <Moon className="w-5 h-5 text-accent-blue" />
    </div>
  )
  */
}

export default ThemeToggle
