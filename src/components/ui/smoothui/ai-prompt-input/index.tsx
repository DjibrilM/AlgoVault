"use client";

import SmoothButton from "../smooth-button";
import { cn } from "@/lib/utils";
import { ArrowUp, Plus, Square, X } from "lucide-react";
import {
  AnimatePresence,
  motion,
  type Transition,
  useReducedMotion,
} from "motion/react";
import {
  type ChangeEvent,
  type KeyboardEvent,
  type ReactNode,
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { type AIState, getAIStateMotion } from "../ai-core";

const SUBMIT_ICON_SIZE = 15;
const STOP_ICON_SIZE = 11;

const MIN_ROWS = 1;
const MAX_ROWS = 8;
const COUNTER_VISIBLE_RATIO = 0.8;
const SPRING_DEFAULT: Transition = {
  bounce: 0.1,
  duration: 0.25,
  type: "spring",
};
const SPRING_SNAPPY: Transition = {
  bounce: 0,
  duration: 0.2,
  type: "spring",
};
const EASE_OUT = [0.23, 1, 0.32, 1] as const;
const ATTACHMENT_STAGGER = 0.035;

export type AIPromptAttachment = {
  id: string;
  /** Bytes. Rendered as a human-readable size when present. */
  size?: number;
  name: string;
};

export type AIPromptInputProps = {
  /**
   * Accessible name for the field. Without it the placeholder is the only thing
   * naming the textarea, which is fine on its own but not when the composer is
   * embedded in a larger surface that needs to say what the prompt is *for*.
   */
  "aria-label"?: string;
  /** Files already attached to the draft. */
  attachments?: AIPromptAttachment[];
  /** Extra controls rendered on the left of the toolbar — model pickers etc. */
  children?: ReactNode;
  className?: string;
  disabled?: boolean;
  /** Shows a counter once the draft passes 80% of the limit. */
  maxLength?: number;
  onAttach?: () => void;
  onRemoveAttachment?: (id: string) => void;
  /** Called when the submit control is pressed while `state` is `streaming` or `thinking`. */
  onStop?: () => void;
  onSubmit?: (value: string) => void;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  /** Shared AI state. `streaming`/`thinking` turns submit into stop. */
  state?: AIState;
  /** Controlled draft. Leave undefined to let the component own it. */
  value?: string;
};

const formatSize = (bytes: number): string => {
  const kilobyte = 1024;
  if (bytes < kilobyte) {
    return `${bytes} B`;
  }
  const megabyte = kilobyte * kilobyte;
  if (bytes < megabyte) {
    return `${Math.round(bytes / kilobyte)} KB`;
  }
  return `${(bytes / megabyte).toFixed(1)} MB`;
};

/**
 * The prompt composer.
 *
 * Growth is animated with a layout spring rather than a CSS height transition,
 * so a pasted paragraph settles instead of snapping — and because the height is
 * measured from the textarea's own scroll height, the surrounding page never
 * reflows mid-keystroke.
 */
const AIPromptInput = ({
  "aria-label": ariaLabel,
  attachments = [],
  children,
  className,
  disabled = false,
  maxLength,
  onAttach,
  onRemoveAttachment,
  onStop,
  onSubmit,
  onValueChange,
  placeholder = "Ask anything…",
  state = "idle",
  value,
}: AIPromptInputProps) => {
  const shouldReduceMotion = useReducedMotion();
  const stateMotion = getAIStateMotion(state);

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const [internalValue, setInternalValue] = useState("");
  const [isFocused, setIsFocused] = useState(false);

  const isControlled = value !== undefined;
  const draft = isControlled ? value : internalValue;
  const isStreaming = state === "streaming" || state === "thinking";
  const canSubmit = draft.trim().length > 0 && !disabled;

  const resize = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) {
      return;
    }
    textarea.style.height = "auto";
    const lineHeight = Number.parseFloat(
      getComputedStyle(textarea).lineHeight || "20"
    );
    const maxHeight = lineHeight * MAX_ROWS;
    textarea.style.height = `${Math.min(textarea.scrollHeight, maxHeight)}px`;
    textarea.style.overflowY =
      textarea.scrollHeight > maxHeight ? "auto" : "hidden";
  }, []);

  useLayoutEffect(() => {
    if (draft.length === 0 && textareaRef.current) {
      textareaRef.current.style.height = "";
    }
    resize();
  }, [draft, resize]);

  const handleChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    const next = event.target.value;
    if (!isControlled) {
      setInternalValue(next);
    }
    onValueChange?.(next);
  };

  const submit = () => {
    if (isStreaming) {
      onStop?.();
      return;
    }
    if (!canSubmit) {
      return;
    }
    onSubmit?.(draft.trim());
    if (!isControlled) {
      setInternalValue("");
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      submit();
    }
  };

  const counterVisible =
    maxLength !== undefined &&
    draft.length >= maxLength * COUNTER_VISIBLE_RATIO;
  const overLimit = maxLength !== undefined && draft.length > maxLength;

  return (
    <motion.div
      className={cn(
        "relative w-full rounded-2xl border bg-[#212124] transition-colors",
        isFocused ? "border-white/[0.14]" : "border-white/[0.08]",
        disabled && "opacity-60",
        className
      )}
      layout={shouldReduceMotion ? false : "position"}
      transition={shouldReduceMotion ? { duration: 0 } : SPRING_DEFAULT}
    >
      <AnimatePresence initial={false}>
        {attachments.length > 0 && (
          <motion.ul
            animate={{ height: "auto", opacity: 1 }}
            className="flex list-none flex-wrap gap-2 overflow-hidden px-3.5 pt-3"
            exit={
              shouldReduceMotion
                ? { opacity: 0, transition: { duration: 0 } }
                : { height: 0, opacity: 0 }
            }
            initial={
              shouldReduceMotion
                ? { height: "auto", opacity: 1 }
                : { height: 0, opacity: 0 }
            }
            transition={shouldReduceMotion ? { duration: 0 } : SPRING_DEFAULT}
          >
            {attachments.map((attachment, index) => (
              <motion.li
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.04] py-1 pr-1 pl-2 text-xs text-[#E5E5E5]"
                exit={
                  shouldReduceMotion
                    ? { opacity: 0, transition: { duration: 0 } }
                    : { opacity: 0, scale: 0.9 }
                }
                initial={
                  shouldReduceMotion
                    ? { opacity: 1, scale: 1, y: 0 }
                    : { opacity: 0, scale: 0.9, y: 4 }
                }
                key={attachment.id}
                layout={!shouldReduceMotion}
                transition={
                  shouldReduceMotion
                    ? { duration: 0 }
                    : { ...SPRING_DEFAULT, delay: index * ATTACHMENT_STAGGER }
                }
              >
                <span className="max-w-40 truncate">{attachment.name}</span>
                {attachment.size !== undefined && (
                  <span className="text-[#8C8C8C]">
                    {formatSize(attachment.size)}
                  </span>
                )}
                {onRemoveAttachment ? (
                  <SmoothButton
                    aria-label={`Remove ${attachment.name}`}
                    className="size-6 text-[#8C8C8C] hover:text-white"
                    onClick={() => onRemoveAttachment(attachment.id)}
                    size="icon-sm"
                    type="button"
                    variant="ghost"
                  >
                    <X aria-hidden="true" size={12} />
                  </SmoothButton>
                ) : null}
              </motion.li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>

      <textarea
        aria-label={ariaLabel}
        className="max-h-64 w-full resize-none bg-transparent px-4 pt-3.5 pb-2.5 text-base text-white outline-none placeholder:text-[#737373] md:text-sm"
        disabled={disabled}
        onBlur={() => setIsFocused(false)}
        onChange={handleChange}
        onFocus={() => setIsFocused(true)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        ref={textareaRef}
        rows={MIN_ROWS}
        value={draft}
      />

      <div className="flex items-center justify-between gap-2 px-2.5 pb-2.5">
        <div className="flex min-w-0 items-center gap-1.5">
          {onAttach ? (
            <button
              aria-label="Add attachment"
              className="flex size-7 items-center justify-center rounded-lg text-[#8C8C8C] hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer disabled:opacity-40"
              disabled={disabled}
              onClick={onAttach}
              type="button"
            >
              <Plus aria-hidden="true" size={16} />
            </button>
          ) : null}
          {children}
        </div>

        <div className="flex items-center gap-2">
          <AnimatePresence initial={false}>
            {counterVisible ? (
              <motion.span
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  "text-xs tabular-nums",
                  overLimit ? "text-rose-400" : "text-[#737373]"
                )}
                exit={
                  shouldReduceMotion
                    ? { opacity: 0, transition: { duration: 0 } }
                    : { opacity: 0, y: 4 }
                }
                initial={
                  shouldReduceMotion
                    ? { opacity: 1, y: 0 }
                    : { opacity: 0, y: 4 }
                }
                transition={
                  shouldReduceMotion ? { duration: 0 } : SPRING_SNAPPY
                }
              >
                {draft.length}/{maxLength}
              </motion.span>
            ) : null}
          </AnimatePresence>

          <AIPromptSubmit
            disabled={disabled || !(canSubmit || isStreaming)}
            isStreaming={isStreaming}
            onClick={submit}
            shouldReduceMotion={Boolean(shouldReduceMotion)}
            speed={stateMotion.speed}
          />
        </div>
      </div>
    </motion.div>
  );
};

type AIPromptSubmitProps = {
  disabled: boolean;
  isStreaming: boolean;
  onClick: () => void;
  shouldReduceMotion: boolean;
  speed: number;
};

const AIPromptSubmit = ({
  disabled,
  isStreaming,
  onClick,
  shouldReduceMotion,
  speed,
}: AIPromptSubmitProps) => (
  <motion.button
    aria-label={isStreaming ? "Stop generating" : "Send message"}
    className={cn(
      "flex size-8 items-center justify-center rounded-full transition-colors cursor-pointer disabled:cursor-default",
      isStreaming
        ? "bg-white/[0.08] hover:bg-white/[0.14]"
        : disabled
          ? "bg-white/[0.06] text-[#525252]"
          : "bg-white text-[#111111] hover:bg-[#E5E5E5]"
    )}
    disabled={disabled}
    onClick={onClick}
    transition={shouldReduceMotion ? { duration: 0 } : SPRING_DEFAULT}
    type="button"
    whileHover={disabled || shouldReduceMotion ? undefined : { scale: 1.05 }}
    whileTap={disabled || shouldReduceMotion ? undefined : { scale: 0.95 }}
  >
    <AnimatePresence initial={false} mode="popLayout">
      <motion.span
        animate={{ opacity: 1, scale: 1 }}
        className="flex items-center justify-center"
        exit={
          shouldReduceMotion
            ? { opacity: 0, transition: { duration: 0 } }
            : { opacity: 0, scale: 0.6 }
        }
        initial={
          shouldReduceMotion ? { opacity: 1 } : { opacity: 0, scale: 0.6 }
        }
        key={isStreaming ? "stop" : "send"}
        transition={
          shouldReduceMotion
            ? { duration: 0 }
            : { duration: 0.18 / speed, ease: EASE_OUT }
        }
      >
        {isStreaming ? (
          <Square
            aria-hidden="true"
            className="fill-[#F45B5B] text-[#F45B5B]"
            size={STOP_ICON_SIZE}
            strokeWidth={0}
          />
        ) : (
          <ArrowUp aria-hidden="true" size={SUBMIT_ICON_SIZE} />
        )}
      </motion.span>
    </AnimatePresence>
  </motion.button>
);

export default AIPromptInput;
