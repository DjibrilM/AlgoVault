import { ConversationHistoryDrawer } from '../components/ConversationHistoryDrawer'
import { FactoryComposer } from '../components/FactoryComposer'
import { FactoryConversation } from '../components/FactoryConversation'
import { FactoryHeader } from '../components/FactoryHeader'
import { GenerationDraftPanel } from '../components/GenerationDraftPanel'
import { useQuestionsFactory } from '../hooks/useQuestionsFactory'

interface QuestionsFactoryScreenProps {
  onBackToHome: () => void
}

/**
 * Interactive Questions Factory studio combining conversational draft shaping
 * with a live specification panel and infinite-scroll conversation history.
 */
export function QuestionsFactoryScreen({ onBackToHome }: QuestionsFactoryScreenProps) {
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
    generatedQuestions,
    isSimulating,
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
    handleFileChange,
    removeAttachment,
    handleToggleLike,
    handleToggleDislike,
    handleCopy,
    openWorkspace,
    runSimulation,
    stopSimulation,
    stopAiActivity,
  } = useQuestionsFactory()

  return (
    <div className="h-full flex flex-col bg-[#1A1A1A] text-[#E5E5E5] select-none">
      <FactoryHeader
        amplitude={amplitude}
        isHistoryOpen={isHistoryOpen}
        isSimulating={isSimulating}
        onBackToHome={onBackToHome}
        onToggleHistory={toggleHistory}
        onToggleSimulation={() => (isSimulating ? stopSimulation() : void runSimulation())}
        orbState={effectiveOrbState}
      />

      <div className="relative flex-1 flex min-h-0 overflow-hidden">
        <div className="relative flex-1 flex flex-col min-w-0 min-h-0">
          <FactoryConversation
            disliked={disliked}
            liked={liked}
            messages={messages}
            onCopy={handleCopy}
            onToggleDislike={handleToggleDislike}
            onToggleLike={handleToggleLike}
          />

          <FactoryComposer
            attachments={attachments}
            fileInputRef={fileInputRef}
            onFileChange={handleFileChange}
            onRemoveAttachment={removeAttachment}
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
    </div>
  )
}

export default QuestionsFactoryScreen
