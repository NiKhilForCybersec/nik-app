/* Nik — markdown render for AI chat bubbles.
 *
 * Lightweight wrapper around `marked`. Sanitises by stripping every
 * tag the LLM doesn't need (script/iframe/etc.). Targets the most
 * common AI output: paragraphs, **bold**, *italics*, `code`,
 * lists, tables, headings, line breaks.
 */

import React from 'react';
import { marked } from 'marked';

marked.use({
  gfm: true,
  breaks: true,
});

const ALLOW_TAG = /^<\/?(p|br|strong|em|b|i|code|pre|ul|ol|li|h1|h2|h3|h4|table|thead|tbody|tr|th|td|blockquote|hr|a|del)( [^>]*)?>$/i;

function sanitize(html: string): string {
  // Strip every tag not in the allow-list. Cheap regex; the input is
  // already from `marked` so we only need to belt-and-braces against
  // anything that snuck through markdown literals.
  return html.replace(/<\/?[^>]+>/g, (tag) => (ALLOW_TAG.test(tag) ? tag : ''));
}

export const MarkdownText: React.FC<{ text: string }> = ({ text }) => {
  const html = React.useMemo(() => sanitize(marked.parse(text, { async: false }) as string), [text]);
  return (
    <div
      className="md"
      dangerouslySetInnerHTML={{ __html: html }}
      style={{
        // Tight, readable typography for chat bubbles.
        fontSize: 13.5,
        lineHeight: 1.55,
        color: 'var(--fg-1)',
      }}
    />
  );
};
