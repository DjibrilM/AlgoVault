import type { ChallengeContextDto } from '@/shared/types/ai'
import type { Problem } from '@/shared/types/problem'

export function toChallengeContextDto(problem: Problem): ChallengeContextDto {
  return {
    id: problem.id,
    title: problem.title,
    difficulty: problem.difficulty,
    category: problem.category,
    description: problem.description,
    constraints: problem.constraints,
    examples: problem.examples.map((ex) => ({
      input: ex.input,
      output: ex.output,
      ...(ex.explanation ? { explanation: ex.explanation } : {}),
    })),
    hints: problem.hints,
    tags: problem.tags,
  }
}
