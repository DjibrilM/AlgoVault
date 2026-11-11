import { Settings } from 'lucide-react'
import { ModulePlaceholder } from '@/shared'
import { SettingsScreenProps } from '../types'
import { useSettings } from '../hooks'

export function SettingsScreen({ onReturnHome }: SettingsScreenProps) {
  const { returnHome } = useSettings()

  return (
    <ModulePlaceholder
      icon={<Settings className="h-8 w-8" />}
      iconColorClass="text-[#6366F1]"
      title="AlgoVault Settings"
      description="Configure your self-hosted judge environment, compiler flags, and theme preferences."
      onReturnHome={onReturnHome ?? returnHome}
    />
  )
}

export default SettingsScreen
