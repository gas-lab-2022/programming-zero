import { describe, it, expect } from 'vitest';
import { stripHtml } from '../../src/utils/html.js';

describe('stripHtml', () => {
  it('removes HTML tags', () => {
    expect(stripHtml('<p>Hello <strong>world</strong></p>')).toBe('Hello world');
  });

  it('decodes common HTML entities', () => {
    expect(stripHtml('A &amp; B &lt; C &gt; D &quot;E&quot;')).toBe('A & B < C > D "E"');
  });

  it('replaces &nbsp; with space', () => {
    expect(stripHtml('Hello&nbsp;world')).toBe('Hello world');
  });

  it('collapses multiple whitespace', () => {
    expect(stripHtml('<p>Hello</p>  <p>world</p>')).toBe('Hello world');
  });

  it('trims leading and trailing whitespace', () => {
    expect(stripHtml('  <p>Hello</p>  ')).toBe('Hello');
  });

  it('handles empty string', () => {
    expect(stripHtml('')).toBe('');
  });

  it('preserves newlines between block elements as single space', () => {
    expect(stripHtml('<h2>Title</h2>\n<p>Content</p>')).toBe('Title Content');
  });
});
