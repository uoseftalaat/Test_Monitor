import React from 'react';
import { parseAnsi, stripAnsi } from '../../utils/ansi';
import { cn } from '../../utils/cn';

export { parseAnsi, stripAnsi };

/**
 * Component that renders text with ANSI color codes parsed into styled spans.
 */
export function AnsiText({ text, className = '' }) {
  if (!text) return null;

  const tokens = parseAnsi(text);

  return (
    <span className={className}>
      {tokens.map((token, index) => {
        const classNames = cn(
          token.color,
          token.bg,
          token.bold && 'font-bold',
          token.dim && 'opacity-70',
          token.underline && 'underline'
        );

        return classNames ? (
          <span key={index} className={classNames}>
            {token.text}
          </span>
        ) : (
          <React.Fragment key={index}>{token.text}</React.Fragment>
        );
      })}
    </span>
  );
}

export default AnsiText;
