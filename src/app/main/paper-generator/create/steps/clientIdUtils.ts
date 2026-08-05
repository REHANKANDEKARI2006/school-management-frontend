// Utility to assign stable client-side IDs to questions for React key stability.
// These IDs survive state updates and prevent DOM confusion when questions are
// added, removed, or reordered.

import { Question } from "../page";

let clientIdCounter = 0;

/**
 * Generate a unique client-side ID for a question.
 * Uses a monotonic counter + random suffix so IDs are unique even across hot reloads.
 */
export function generateClientId(): string {
  return `cid-${++clientIdCounter}-${Math.random().toString(36).slice(2, 7)}`;
}

/**
 * Ensure every question in the array has a stable `_clientId` in `question_data`.
 * If a question already has one (from a previous save/load), it's preserved.
 * If not, a new one is generated.
 */
export function ensureClientIds(questions: Question[]): Question[] {
  return questions.map((q) => {
    if (q.question_data?._clientId) return q;
    return {
      ...q,
      question_data: {
        ...(q.question_data || {}),
        _clientId: generateClientId(),
      },
    };
  });
}

/**
 * Get the stable key for a question (for use as React key).
 * Prefers _clientId, falls back to question_id, then generates a new one.
 */
export function getQuestionKey(q: Question): string {
  if (q.question_data?._clientId) return q.question_data._clientId;
  if (q.question_id) return `db-${q.question_id}`;
  return generateClientId();
}
