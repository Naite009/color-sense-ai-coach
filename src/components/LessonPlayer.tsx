import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LessonRecording } from '@/types/lesson';
import { Play, Pause, RotateCcw } from 'lucide-react';

interface LessonPlayerProps {
  lesson: LessonRecording;
  onComplete?: () => void;
}

export const LessonPlayer = ({ lesson, onComplete }: LessonPlayerProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 });
  const intervalRef = useRef<NodeJS.Timeout>();

  const handlePlay = () => {
    setIsPlaying(true);
    
    intervalRef.current = setInterval(() => {
      setCurrentTime(prev => {
        const newTime = prev + 100; // Update every 100ms
        
        // Update cursor position based on mouse events
        const currentMouseEvent = lesson.mouseEvents.find(
          event => Math.abs(event.timestamp - newTime) < 50
        );
        
        if (currentMouseEvent) {
          setCursorPosition({ x: currentMouseEvent.x, y: currentMouseEvent.y });
        }
        
        // Check if lesson is complete
        if (newTime >= lesson.duration) {
          setIsPlaying(false);
          onComplete?.();
          return lesson.duration;
        }
        
        return newTime;
      });
    }, 100);
  };

  const handlePause = () => {
    setIsPlaying(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  };

  const handleReset = () => {
    setIsPlaying(false);
    setCurrentTime(0);
    setCursorPosition({ x: 0, y: 0 });
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  };

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const progress = (currentTime / lesson.duration) * 100;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{lesson.title}</CardTitle>
        {lesson.description && (
          <p className="text-muted-foreground">{lesson.description}</p>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative">
          <div className="w-full bg-muted h-2 rounded-full">
            <div 
              className="bg-primary h-2 rounded-full transition-all duration-100" 
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between text-sm text-muted-foreground mt-1">
            <span>{Math.round(currentTime / 1000)}s</span>
            <span>{Math.round(lesson.duration / 1000)}s</span>
          </div>
        </div>

        <div className="flex gap-2">
          {!isPlaying ? (
            <Button onClick={handlePlay} className="flex items-center gap-2">
              <Play className="w-4 h-4" />
              Play
            </Button>
          ) : (
            <Button onClick={handlePause} className="flex items-center gap-2">
              <Pause className="w-4 h-4" />
              Pause
            </Button>
          )}
          
          <Button onClick={handleReset} variant="outline" className="flex items-center gap-2">
            <RotateCcw className="w-4 h-4" />
            Reset
          </Button>
        </div>

        {/* Virtual cursor indicator */}
        {isPlaying && (
          <div 
            className="fixed w-4 h-4 bg-red-500 rounded-full pointer-events-none z-50 transition-all duration-100"
            style={{ 
              left: cursorPosition.x - 8, 
              top: cursorPosition.y - 8,
              opacity: 0.7
            }}
          />
        )}

        <div className="text-sm text-muted-foreground">
          <p>Mouse events: {lesson.mouseEvents.length}</p>
          <p>Keystrokes: {lesson.keystrokeEvents.length}</p>
        </div>
      </CardContent>
    </Card>
  );
};