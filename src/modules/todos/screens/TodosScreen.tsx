import { CheckSquare } from 'lucide-react'
import { ModulePlaceholder } from '@/shared'
import { TodosScreenProps } from '../types'
import { useTodos } from '../hooks'

export function TodosScreen({ onReturnHome }: TodosScreenProps) {
  const { returnHome } = useTodos()

  return (
    <ModulePlaceholder
      icon={<CheckSquare className="h-8 w-8" />}
      iconColorClass="text-[#F59E0B]"
      title="To-dos & Bookmarks"
      description="Your targeted practice queue. Star problems to add them to this list."
      onReturnHome={onReturnHome ?? returnHome}
    />
  )
}

export default TodosScreen
