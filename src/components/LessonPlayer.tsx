import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { LessonRecording } from '@/types/lesson';
import { Play, Pause, RotateCcw } from 'lucide-react';

interface LessonPlayerProps {
  lesson: LessonRecording;
  onComplete?: () => void;
}

export const LessonPlayer = ({ lesson, onComplete }: LessonPlayerProps) => {
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!isPlaying) return;

    if (lesson.recordingType === 'camera') {
      // For camera recordings, just play the video
      if (videoRef.current) {
        videoRef.current.play();
      }
      return;
    }

    // For screen recordings, replay mouse/keyboard events
    const interval = setInterval(() => {
      setCurrentTime(prev => {
        const newTime = prev + 100;
        
        // Show mouse events at current time
        const currentMouseEvents = lesson.mouseEvents.filter(
          event => event.timestamp <= newTime && event.timestamp > prev
        );
        
        currentMouseEvents.forEach(event => {
          if (event.type === 'click') {
            // Create visual click indicator
            const indicator = document.createElement('div');
            indicator.style.position = 'fixed';
            indicator.style.left = `${event.x}px`;
            indicator.style.top = `${event.y}px`;
            indicator.style.width = '20px';
            indicator.style.height = '20px';
            indicator.style.backgroundColor = 'red';
            indicator.style.borderRadius = '50%';
            indicator.style.pointerEvents = 'none';
            indicator.style.zIndex = '9999';
            indicator.style.animation = 'pulse 0.5s ease-out';
            
            document.body.appendChild(indicator);
            setTimeout(() => document.body.removeChild(indicator), 500);
          }
        });
        
        // Show keystroke events at current time
        const currentKeyEvents = lesson.keystrokeEvents.filter(
          event => event.timestamp <= newTime && event.timestamp > prev
        );
        
        currentKeyEvents.forEach(event => {
          const element = document.getElementById(event.elementId);
          if (element && element instanceof HTMLInputElement) {
            element.focus();
            element.value = event.value || '';
          }
        });
        
        if (newTime >= lesson.duration) {
          setIsPlaying(false);
          onComplete?.();
          return 0;
        }
        
        return newTime;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [isPlaying, lesson, onComplete]);

  const handlePlay = () => {
    setIsPlaying(!isPlaying);
    if (lesson.recordingType === 'camera' && videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
    }
  };

  const handleReset = () => {
    setIsPlaying(false);
    setCurrentTime(0);
    if (lesson.recordingType === 'camera' && videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.pause();
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Playing: {lesson.title}</CardTitle>
          <p className="text-sm text-muted-foreground">
            Recording Type: {lesson.recordingType} | Duration: {Math.round(lesson.duration / 1000)}s
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {lesson.recordingType === 'camera' && lesson.videoUrl && (
            <div className="aspect-video bg-black rounded-lg overflow-hidden">
              <video 
                ref={videoRef}
                src={lesson.videoUrl} 
                className="w-full h-full object-contain"
                controls={false}
                onEnded={() => {
                  setIsPlaying(false);
                  onComplete?.();
                }}
              />
            </div>
          )}
          
          {lesson.recordingType === 'screen' && (
            <div className="p-4 bg-gray-50 border rounded-lg">
              <p className="text-sm">Screen recording will replay mouse movements and keystrokes.</p>
              <p className="text-xs text-muted-foreground mt-1">
                Mouse events: {lesson.mouseEvents.length} | Keystrokes: {lesson.keystrokeEvents.length}
              </p>
            </div>
          )}

          <div className="flex gap-2">
            <Button onClick={handlePlay} className="flex items-center gap-2">
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              {isPlaying ? 'Pause' : 'Play'}
            </Button>
            
            <Button onClick={handleReset} variant="outline" className="flex items-center gap-2">
              <RotateCcw className="w-4 h-4" />
              Reset
            </Button>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progress</span>
              <span>{Math.round((currentTime / lesson.duration) * 100)}%</span>
            </div>
            <Progress value={(currentTime / lesson.duration) * 100} className="w-full" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};