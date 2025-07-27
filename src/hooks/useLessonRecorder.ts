import { useState, useCallback, useRef } from 'react';
import { MouseEvent, KeystrokeEvent, LessonRecording } from '@/types/lesson';

export const useLessonRecorder = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [mouseEvents, setMouseEvents] = useState<MouseEvent[]>([]);
  const [keystrokeEvents, setKeystrokeEvents] = useState<KeystrokeEvent[]>([]);
  const startTimeRef = useRef<number>(0);

  const startRecording = useCallback(() => {
    setIsRecording(true);
    setMouseEvents([]);
    setKeystrokeEvents([]);
    startTimeRef.current = Date.now();

    // Mouse event listeners
    const handleMouseMove = (e: globalThis.MouseEvent) => {
      const timestamp = Date.now() - startTimeRef.current;
      setMouseEvents(prev => [...prev, {
        x: e.clientX,
        y: e.clientY,
        timestamp,
        type: 'move'
      }]);
    };

    const handleMouseClick = (e: globalThis.MouseEvent) => {
      const timestamp = Date.now() - startTimeRef.current;
      setMouseEvents(prev => [...prev, {
        x: e.clientX,
        y: e.clientY,
        timestamp,
        type: 'click'
      }]);
    };

    // Keyboard event listeners
    const handleKeydown = (e: KeyboardEvent) => {
      const timestamp = Date.now() - startTimeRef.current;
      const target = e.target as HTMLElement;
      setKeystrokeEvents(prev => [...prev, {
        key: e.key,
        timestamp,
        elementId: target.id,
        value: (target as HTMLInputElement).value
      }]);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('click', handleMouseClick);
    document.addEventListener('keydown', handleKeydown);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('click', handleMouseClick);
      document.removeEventListener('keydown', handleKeydown);
    };
  }, []);

  const stopRecording = useCallback(() => {
    setIsRecording(false);
    return Date.now() - startTimeRef.current;
  }, []);

  const saveLesson = useCallback((title: string, description?: string): LessonRecording => {
    const duration = Date.now() - startTimeRef.current;
    return {
      id: crypto.randomUUID(),
      title,
      description,
      duration,
      mouseEvents,
      keystrokeEvents,
      createdAt: new Date(),
      createdBy: 'teacher' // TODO: Get from auth
    };
  }, [mouseEvents, keystrokeEvents]);

  return {
    isRecording,
    mouseEvents,
    keystrokeEvents,
    startRecording,
    stopRecording,
    saveLesson
  };
};