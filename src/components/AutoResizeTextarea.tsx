import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
} from 'react';

export interface AutoResizeTextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  value: string;
}

export const AutoResizeTextarea = forwardRef<
  HTMLTextAreaElement,
  AutoResizeTextareaProps
>(
  (
    {
      value,
      onChange,
      onInput,
      className = '',
      style,
      rows = 1,
      ...rest
    },
    ref
  ) => {
    const innerRef = useRef<HTMLTextAreaElement | null>(null);

    useImperativeHandle(ref, () => innerRef.current as HTMLTextAreaElement);

    const adjustHeight = useCallback(() => {
      const el = innerRef.current;
      if (!el) return;

      // Temporarily set height to 'auto' to correctly measure natural scrollHeight upon deletion/shrinkage
      el.style.height = 'auto';

      // Set explicit height to scrollHeight so all wrapped lines and paragraphs are displayed without clipping
      el.style.height = `${el.scrollHeight}px`;
    }, []);

    // Adjust synchronously before paint on value changes (both in read mode and on state updates)
    useLayoutEffect(() => {
      adjustHeight();
    }, [value, adjustHeight]);

    // Readjust once fonts are loaded in case custom fonts change metrics
    useEffect(() => {
      if (document.fonts?.ready) {
        document.fonts.ready.then(() => adjustHeight());
      }
    }, [adjustHeight]);

    // Handle container / column width resizing (responsive layout changes or window resize)
    useEffect(() => {
      const el = innerRef.current;
      if (!el) return;

      let prevWidth = el.offsetWidth;

      if (typeof ResizeObserver !== 'undefined') {
        const observer = new ResizeObserver((entries) => {
          for (const entry of entries) {
            const width = entry.contentRect.width;
            if (width > 0 && Math.abs(width - prevWidth) > 1) {
              prevWidth = width;
              adjustHeight();
            }
          }
        });
        observer.observe(el);
        return () => observer.disconnect();
      } else {
        const handleResize = () => adjustHeight();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
      }
    }, [adjustHeight]);

    const handleInput = (e: React.FormEvent<HTMLTextAreaElement>) => {
      adjustHeight();
      if (onInput) onInput(e);
    };

    return (
      <textarea
        ref={innerRef}
        value={value}
        rows={rows}
        onChange={onChange}
        onInput={handleInput}
        draggable={false}
        onDragStart={(e) => e.stopPropagation()}
        style={style}
        className={`auto-resize-textarea overflow-hidden resize-none [overflow-wrap:anywhere] ${className}`}
        {...rest}
      />
    );
  }
);

AutoResizeTextarea.displayName = 'AutoResizeTextarea';
