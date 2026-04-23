import React, { useState, useCallback, useRef } from 'react';

import { colors } from '../theme';

type Direction = 'horizontal' | 'vertical';

/**
 * Hook that manages the size of a resizable panel.
 * For horizontal panels, dragging RIGHT increases size.
 * For vertical panels, dragging DOWN increases size.
 * Pass `invert: true` to flip the direction (e.g. handle above a panel).
 */
export function useResizePanel(
  initial: number,
  min: number,
  max: number,
  direction: Direction = 'horizontal',
  invert = false
) {
  const [size, setSize] = useState(initial);
  const sizeRef = useRef(size);
  sizeRef.current = size;

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      const startPos = direction === 'horizontal' ? e.clientX : e.clientY;
      const startSize = sizeRef.current;
      const bodyCursor =
        direction === 'horizontal' ? 'col-resize' : 'row-resize';

      document.body.style.cursor = bodyCursor;
      document.body.style.userSelect = 'none';

      const onMove = (ev: MouseEvent) => {
        const pos = direction === 'horizontal' ? ev.clientX : ev.clientY;
        const raw = startSize + (invert ? -(pos - startPos) : pos - startPos);
        setSize(Math.max(min, Math.min(max, raw)));
      };

      const onUp = () => {
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
      };

      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    },
    [direction, invert, min, max]
  );

  return [size, handleMouseDown] as const;
}

export function ResizeHandle({
  direction,
  onMouseDown,
}: {
  direction: Direction;
  onMouseDown: (e: React.MouseEvent) => void;
}) {
  const [hovered, setHovered] = useState(false);
  const isH = direction === 'horizontal';

  return (
    <div
      onMouseDown={onMouseDown}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        flexShrink: 0,
        width: isH ? '4px' : '100%',
        height: isH ? '100%' : '4px',
        cursor: isH ? 'col-resize' : 'row-resize',
        backgroundColor: hovered
          ? colors.accent.primaryBorder
          : 'transparent',
        transition: 'background-color 0.12s',
        zIndex: 10,
        // wider hit-target via transparent border
        borderLeft: isH ? `2px solid transparent` : 'none',
        borderRight: isH ? `2px solid transparent` : 'none',
        borderTop: !isH ? `2px solid transparent` : 'none',
        borderBottom: !isH ? `2px solid transparent` : 'none',
        boxSizing: 'content-box',
      }}
    />
  );
}
