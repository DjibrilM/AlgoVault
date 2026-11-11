import { AICategory, MarathonStep, Problem } from '@/shared/types/problem'

export interface ActiveCategory {
  name: string
  isMarathon: boolean
}

export interface HomeScreenProps {
  categories?: AICategory[]
  marathonSteps?: MarathonStep[]
  problems?: Problem[]
  onSelectCategory?: (categoryName: string, isMarathon?: boolean) => void
  onGenerateCategory?: (prompt: string) => void
}

export interface MarathonCardProps {
  marathonSteps: MarathonStep[]
  onSelect: () => void
}

export interface TopicCardProps {
  category: AICategory
  problems: Problem[]
  onSelect: () => void
}

export interface AiGeneratorBarProps {
  onSubmit: (prompt: string) => void
}
