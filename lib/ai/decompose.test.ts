import { describe, expect, it } from 'vitest';

import { normalizeClarityOutput } from '@/lib/ai/decompose';
import { parseAnswerLines } from '@/lib/ai/parse-answers';

describe('normalizeClarityOutput', () => {
  it('returns provided questions when the task is unclear', () => {
    const result = normalizeClarityOutput({
      isClear: false,
      questions: ['What is the deliverable?', 'Who is the owner?'],
    });

    expect(result).toEqual({
      isClear: false,
      questions: ['What is the deliverable?', 'Who is the owner?'],
    });
  });

  it('falls back to default questions when unclear output has none', () => {
    const result = normalizeClarityOutput({
      isClear: false,
    });

    expect(result.isClear).toBe(false);
    expect(result).toMatchObject({
      questions: [
        'What is the concrete deliverable?',
        'What constraints or dependencies should we respect?',
        'What does done look like?',
      ],
    });
  });

  it('returns proposed subtasks when the task is clear', () => {
    const result = normalizeClarityOutput({
      isClear: true,
      proposedSubtasks: ['Set up API route', 'Add validation', 'Write tests'],
    });

    expect(result).toEqual({
      isClear: true,
      proposedSubtasks: ['Set up API route', 'Add validation', 'Write tests'],
    });
  });

  it('falls back to default subtasks when clear output has none', () => {
    const result = normalizeClarityOutput({
      isClear: true,
    });

    expect(result.isClear).toBe(true);
    expect(result).toMatchObject({
      proposedSubtasks: [
        'Clarify scope and acceptance criteria',
        'Implement the core workflow',
        'Add validation, tests, and documentation',
      ],
    });
  });

  it('filters blank subtask titles from the proposal', () => {
    const result = normalizeClarityOutput({
      isClear: true,
      proposedSubtasks: ['Ship API', '', 'Add tests'],
    });

    expect(result).toEqual({
      isClear: true,
      proposedSubtasks: ['Ship API', 'Add tests'],
    });
  });
});

describe('parseAnswerLines', () => {
  it('splits multiline answers and trims whitespace', () => {
    expect(
      parseAnswerLines(
        '  Deliverable is an API route \n\nDeadline Friday \r\nDone = merged PR  ',
      ),
    ).toEqual([
      'Deliverable is an API route',
      'Deadline Friday',
      'Done = merged PR',
    ]);
  });

  it('returns an empty array for blank input', () => {
    expect(parseAnswerLines('   \n\n  ')).toEqual([]);
  });
});
