import { useState, useCallback, useRef } from 'react';
import { MouseEvent, KeystrokeEvent, LessonRecording } from '@/types/lesson';

export const useLessonRecorder = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingType, setRecordingType] = useState<'screen' | 'camera'>('screen');
  const [mouseEvents, setMouseEvents] = useState<MouseEvent[]>([]);
  const [keystrokeEvents, setKeystrokeEvents] = useState<KeystrokeEvent[]>([]);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
  const startTimeRef = useRef<number>(0);
  const cleanupRef = useRef<(() => void) | null>(null);

  const startRecording = useCallback(async (type: 'screen' | 'camera' = 'screen') => {
    setIsRecording(true);
    setRecordingType(type);
    setMouseEvents([]);
    setKeystrokeEvents([]);
    setVideoBlob(null);
    startTimeRef.current = Date.now();

    if (type === 'camera') {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: true, 
          audio: true 
        });
        
        const recorder = new MediaRecorder(stream);
        const chunks: Blob[] = [];
        
        recorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            chunks.push(event.data);
          }
        };
        
        recorder.onstop = () => {
          const blob = new Blob(chunks, { type: 'video/webm' });
          setVideoBlob(blob);
          stream.getTracks().forEach(track => track.stop());
        };
        
        recorder.start();
        setMediaRecorder(recorder);
        
        cleanupRef.current = () => {
          stream.getTracks().forEach(track => track.stop());
        };
      } catch (error) {
        console.error('Error accessing camera:', error);
        setIsRecording(false);
        return null;
      }
    } else {
      // Screen recording setup (existing code)
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

      cleanupRef.current = () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('click', handleMouseClick);
        document.removeEventListener('keydown', handleKeydown);
      };
    }
  }, []);

  const stopRecording = useCallback(() => {
    setIsRecording(false);
    
    // Use the current state value directly instead of from closure
    setMediaRecorder(currentRecorder => {
      if (currentRecorder && currentRecorder.state === 'recording') {
        currentRecorder.stop();
      }
      return null;
    });
    
    if (cleanupRef.current) {
      cleanupRef.current();
      cleanupRef.current = null;
    }
    
    return Date.now() - startTimeRef.current;
  }, []); // Remove mediaRecorder from dependency array

  const saveLesson = useCallback((title: string, description?: string): LessonRecording => {
    const duration = Date.now() - startTimeRef.current;
    const lesson: LessonRecording = {
      id: crypto.randomUUID(),
      title,
      description,
      duration,
      recordingType,
      mouseEvents,
      keystrokeEvents,
      createdAt: new Date(),
      createdBy: 'teacher'
    };
    
    if (videoBlob) {
      lesson.videoBlob = videoBlob;
      lesson.videoUrl = URL.createObjectURL(videoBlob);
    }
    
    return lesson;
  }, [recordingType, mouseEvents, keystrokeEvents, videoBlob]);

  return {
    isRecording,
    recordingType,
    mouseEvents,
    keystrokeEvents,
    videoBlob,
    startRecording,
    stopRecording,
    saveLesson
  };
};