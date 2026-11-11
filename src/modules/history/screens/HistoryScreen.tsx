import { Clock } from 'lucide-react'
import { ModulePlaceholder } from '@/shared'
import { HistoryScreenProps } from '../types'
import { useHistory } from '../hooks'

export function HistoryScreen({ onReturnHome }: HistoryScreenProps) {
  const { returnHome } = useHistory()

  return (
    <ModulePlaceholder
      icon={<Clock className="h-8 w-8" />}
      iconColorClass="text-[#10B981]"
      title="Submissions History"
      description="Audit trail of past runs, execution times, memory graphs, and benchmark percentiles."
      onReturnHome={onReturnHome ?? returnHome}
    />
  )
}

export default HistoryScreen
