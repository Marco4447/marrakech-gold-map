import { useCallback, useRef } from "react";

interface LongPressOptions {
  onLongPress: (e: React.TouchEvent | React.MouseEvent) => void;
  onPress?: () => void;
  delay?: number;
}

export function useLongPress({ onLongPress, onPress, delay = 800 }: LongPressOptions) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isLongPress = useRef(false);
  const startPos = useRef<{ x: number; y: number } | null>(null);
  const activeRef = useRef(false);
  const onStartRef = useRef<(() => void) | null>(null);
  const onEndRef = useRef<(() => void) | null>(null);

  const start = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    isLongPress.current = false;
    activeRef.current = true;
    const touch = "touches" in e ? e.touches[0] : e;
    startPos.current = { x: touch.clientX, y: touch.clientY };
    onStartRef.current?.();

    timerRef.current = setTimeout(() => {
      isLongPress.current = true;
      activeRef.current = false;
      onEndRef.current?.();
      if ("vibrate" in navigator) navigator.vibrate(40);
      onLongPress(e);
    }, delay);
  }, [onLongPress, delay]);

  const stop = useCallback((_e: React.TouchEvent | React.MouseEvent) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    activeRef.current = false;
    onEndRef.current?.();
    if (!isLongPress.current) onPress?.();
  }, [onPress]);

  const cancel = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    activeRef.current = false;
    onEndRef.current?.();
  }, []);

  const move = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    if (!startPos.current) return;
    const touch = "touches" in e ? e.touches[0] : e;
    const dx = Math.abs(touch.clientX - startPos.current.x);
    const dy = Math.abs(touch.clientY - startPos.current.y);
    if (dx > 10 || dy > 10) cancel();
  }, [cancel]);

  return {
    onTouchStart: start,
    onTouchEnd: stop,
    onTouchMove: move,
    onMouseDown: start,
    onMouseUp: stop,
    onMouseLeave: cancel,
    setOnStart: (fn: () => void) => { onStartRef.current = fn; },
    setOnEnd: (fn: () => void) => { onEndRef.current = fn; },
  };
}
