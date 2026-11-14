import { AICategory, MarathonStep, MarathonTrack, Problem } from '@/shared/types/problem'

export interface ActiveCategory {
  name: string
  isMarathon: boolean
}

export interface HomeScreenProps {
  categories?: AICategory[]
  marathonSteps?: MarathonStep[]
  marathons?: MarathonTrack[]
  problems?: Problem[]
  onSelectCategory?: (categoryName: string, isMarathon?: boolean) => void
  onSelectMarathon?: (marathon: MarathonTrack) => void
  onViewAllMarathons?: () => void
  onGenerateCategory?: (prompt: string) => void
  onOpenAiStudio?: () => void
}

export interface MarathonCardProps {
  marathonSteps: MarathonStep[]
  onSelect: () => void
}

export interface MarathonCarouselProps {
  marathons: MarathonTrack[]
  onSelectMarathon: (marathon: MarathonTrack) => void
  onViewAll?: () => void
}

export interface TopicCardProps {
  category: AICategory
  problems: Problem[]
  onSelect: () => void
}

export interface AiGeneratorBarProps {
  onOpenStudio: () => void
}

