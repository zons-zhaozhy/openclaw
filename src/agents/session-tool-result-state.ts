export type PendingToolCall = { id: string; name?: string };

export type PendingToolCallState = {
  size: () => number;
  entries: () => IterableIterator<[string, string | undefined]>;
  getToolName: (id: string) => string | undefined;
  delete: (id: string) => void;
  clear: () => void;
  trackToolCalls: (calls: PendingToolCall[]) => void;
  getPendingIds: () => string[];
  shouldFlushForSanitizedDrop: () => boolean;
  shouldFlushBeforeNonToolResult: (nextRole: unknown, toolCallCount: number) => boolean;
  shouldFlushBeforeNewToolCalls: (toolCallCount: number) => boolean;
  /**
   * If pending state requires flushing due to a sanitized assistant drop, invoke
   * `flushFn` immediately. Prevents callers from accidentally ignoring the flush.
   */
  flushIfNeededForSanitizedDrop: (flushFn: () => void) => void;
  /**
   * If pending state requires flushing before a non-tool-result message, invoke
   * `flushFn` immediately. Prevents callers from accidentally ignoring the flush.
   */
  flushIfNeededBeforeNonToolResult: (
    nextRole: unknown,
    toolCallCount: number,
    flushFn: () => void,
  ) => void;
  /**
   * If pending state requires flushing before new tool calls, invoke `flushFn`
   * immediately. Prevents callers from accidentally ignoring the flush.
   */
  flushIfNeededBeforeNewToolCalls: (toolCallCount: number, flushFn: () => void) => void;
};

export function createPendingToolCallState(): PendingToolCallState {
  const pending = new Map<string, string | undefined>();

  const needsFlushBeforeNonToolResult = (nextRole: unknown, toolCallCount: number): boolean =>
    pending.size > 0 && (toolCallCount === 0 || nextRole !== "assistant");

  const needsFlushBeforeNewToolCalls = (toolCallCount: number): boolean =>
    pending.size > 0 && toolCallCount > 0;

  return {
    size: () => pending.size,
    entries: () => pending.entries(),
    getToolName: (id: string) => pending.get(id),
    delete: (id: string) => {
      pending.delete(id);
    },
    clear: () => {
      pending.clear();
    },
    trackToolCalls: (calls: PendingToolCall[]) => {
      for (const call of calls) {
        pending.set(call.id, call.name);
      }
    },
    getPendingIds: () => Array.from(pending.keys()),
    shouldFlushForSanitizedDrop: () => pending.size > 0,
    shouldFlushBeforeNonToolResult: needsFlushBeforeNonToolResult,
    shouldFlushBeforeNewToolCalls: needsFlushBeforeNewToolCalls,
    flushIfNeededForSanitizedDrop: (flushFn) => {
      if (pending.size > 0) {
        flushFn();
      }
    },
    flushIfNeededBeforeNonToolResult: (nextRole, toolCallCount, flushFn) => {
      if (needsFlushBeforeNonToolResult(nextRole, toolCallCount)) {
        flushFn();
      }
    },
    flushIfNeededBeforeNewToolCalls: (toolCallCount, flushFn) => {
      if (needsFlushBeforeNewToolCalls(toolCallCount)) {
        flushFn();
      }
    },
  };
}
