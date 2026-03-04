import { describe, it, expect } from 'vitest';
import { extractJson } from '../../src/utils/json.js';

describe('extractJson', () => {
  it('extracts JSON from fenced code block', () => {
    const text = 'Here is the result:\n```json\n{"key": "value"}\n```\nDone.';
    expect(extractJson<{ key: string }>(text)).toEqual({ key: 'value' });
  });

  it('extracts JSON from code block without language tag', () => {
    const text = '```\n{"key": "value"}\n```';
    expect(extractJson<{ key: string }>(text)).toEqual({ key: 'value' });
  });

  it('parses raw JSON string', () => {
    const text = '{"key": "value"}';
    expect(extractJson<{ key: string }>(text)).toEqual({ key: 'value' });
  });

  it('handles multiline JSON in code block', () => {
    const text = '```json\n{\n  "a": 1,\n  "b": [2, 3]\n}\n```';
    expect(extractJson<{ a: number; b: number[] }>(text)).toEqual({ a: 1, b: [2, 3] });
  });

  it('throws on invalid JSON', () => {
    expect(() => extractJson('not json at all')).toThrow();
  });

  it('extracts first JSON block when multiple exist', () => {
    const text = '```json\n{"first": true}\n```\n```json\n{"second": true}\n```';
    expect(extractJson<{ first: boolean }>(text)).toEqual({ first: true });
  });
});
