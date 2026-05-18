import { SetupDraft } from '../page'

export interface StepProps {
  draft: Partial<SetupDraft>
  onNext: (partial: Partial<SetupDraft>) => void
  onBack: () => void
  isLastStep: boolean
}
