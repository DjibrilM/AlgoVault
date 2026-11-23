import { useRef } from 'react'
import { ConversationHistoryDrawer } from '../components/ConversationHistoryDrawer'
import { FactoryComposer } from '../components/FactoryComposer'
import { FactoryConversation } from '../components/FactoryConversation'
import { FactoryHeader } from '../components/FactoryHeader'
import { GenerationDraftPanel } from '../components/GenerationDraftPanel'
import { GenerationFocusOrbStage } from '../components/GenerationFocusOrbStage'
import { useQuestionsFactory } from '../hooks/useQuestionsFactory'

interface QuestionsFactoryScreenProps {
  onBackToHome: () => void
}

/**
 * Interactive Questions Factory studio combining conversational draft shaping
 * with a live specification panel and infinite-scroll conversation history.
 */
export function QuestionsFactoryScreen({ onBackToHome }: QuestionsFactoryScreenProps) {
  const orbSlotRef = useRef<HTMLDivElement>(null)
  const {
    activeConversationId,
    messages,
    promptText,
    setPromptText,
    attachments,
    fileInputRef,
    draft,
    highlightedFields,
    isGenerating,
    generationOverlayPhase,
    generationProcessStatus,
    isOutputRevealed,
    isRetryPromptVisible,
    retryImpulseSeq,
    retryGeneration,
    cancelGenerationRetry,
    completeOrbReturn,
    generatedQuestions,
    liked,
    disliked,
    effectiveOrbState,
    amplitude,
    isHistoryOpen,
    conversations,
    isHistoryLoading,
    isLoadingMoreHistory,
    hasMoreHistory,
    toggleHistory,
    closeHistory,
    loadMoreHistory,
    resumeConversation,
    startNewConversation,
    handleSubmit,
    retryFailedMessage,
    handleFileChange ,
    removeAttachment,
    handleToggleLike,
    handleToggleDislike,
    handleCopy,
    openWorkspace,
    stopAiActivity,
    aiStatus,
    availableModels,
    isModelsLoading,
    activeProvider,
    activeModelId,
    switchModel,
    isSwitchingModel,
    openAiSettings,
  } = useQuestionsFactory()

  return (
    <div className="h-full flex flex-col bg-[#1A1A1A] text-[#E5E5E5] select-none">
      <FactoryHeader
        isHistoryOpen={isHistoryOpen}
        onBackToHome={onBackToHome}
        onToggleHistory={toggleHistory}
        orbSlotRef={orbSlotRef}
      />

      <div className="relative flex-1 flex min-h-0 overflow-hidden">
        <div className="relative flex-1 flex flex-col min-w-0 min-h-0">
          <FactoryConversation
            disliked={disliked}
            liked={liked}
            messages={messages}
            onCopy={handleCopy}
            onOpenSettings={openAiSettings}
            onRetryMessage={(id) => void retryFailedMessage(id)}
            onToggleDislike={handleToggleDislike}
            onToggleLike={handleToggleLike}
          />

          <FactoryComposer
            activeBaseUrl={aiStatus?.baseUrl}
            activeModelId={activeModelId}
            activeProvider={activeProvider}
            attachments={attachments}
            availableModels={availableModels}
            fileInputRef={fileInputRef}
            isAiConfigured={Boolean(aiStatus?.configured)}
            isModelsLoading={isModelsLoading}
            isSwitchingModel={isSwitchingModel}
            onFileChange={handleFileChange}
            onOpenSettings={openAiSettings}
            onRemoveAttachment={removeAttachment}
            onSelectModel={(modelId, provider) => void switchModel(modelId, provider)}
            onStop={stopAiActivity}
            onSubmit={(val) => void handleSubmit(val)}
            onValueChange={setPromptText}
            state={effectiveOrbState}
            value={promptText}
          />
        </div>

        <GenerationDraftPanel
          draft={draft}
          generatedQuestions={generatedQuestions}
          highlightedFields={highlightedFields}
          isGenerating={isGenerating}
          isOutputRevealed={isOutputRevealed}
          onOpenWorkspace={openWorkspace}
        />

        <ConversationHistoryDrawer
          activeConversationId={activeConversationId}
          conversations={conversations}
          hasNextPage={hasMoreHistory}
          isFetchingNextPage={isLoadingMoreHistory}
          isLoading={isHistoryLoading}
          isOpen={isHistoryOpen}
          onClose={closeHistory}
          onLoadMore={loadMoreHistory}
          onNewConversation={startNewConversation}
          onSelectConversation={resumeConversation}
        />
      </div>

      <GenerationFocusOrbStage
        amplitude={amplitude}
        isRetryPromptVisible={isRetryPromptVisible}
        onCancelRetry={cancelGenerationRetry}
        onRetry={retryGeneration}
        onReturnComplete={completeOrbReturn}
        orbSlotRef={orbSlotRef}
        orbState={effectiveOrbState}
        phase={generationOverlayPhase}
        processStatus={generationProcessStatus}
        retryImpulseSeq={retryImpulseSeq}
      />
    </div>
  )
}

export default QuestionsFactoryScreen
