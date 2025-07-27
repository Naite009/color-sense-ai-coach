import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { LessonRecording, StudentProgress } from '@/types/lesson';
import { CheckCircle, XCircle, Target } from 'lucide-react';

interface LessonTestProps {
  lesson: LessonRecording;
  onComplete?: (results: StudentProgress) => void;
}

export const LessonTest = ({ lesson, onComplete }: LessonTestProps) => {
  const [isTestActive, setIsTestActive] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [studentInput, setStudentInput] = useState('');
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [feedback, setFeedback] = useState<string[]>([]);
  const [accuracy, setAccuracy] = useState(100);
  const intervalRef = useRef<NodeJS.Timeout>();
  const checkIntervalRef = useRef<NodeJS.Timeout>();

  const startTest = () => {
    setIsTestActive(true);
    setCurrentTime(0);
    setStudentInput('');
    setMousePosition({ x: 0, y: 0 });
    setFeedback([]);
    setAccuracy(100);

    // Start the test timer
    intervalRef.current = setInterval(() => {
      setCurrentTime(prev => {
        const newTime = prev + 100;
        if (newTime >= lesson.duration) {
          endTest();
          return lesson.duration;
        }
        return newTime;
      });
    }, 100);

    // Check accuracy every 3 seconds
    checkIntervalRef.current = setInterval(() => {
      checkAccuracy();
    }, 3000);

    // Track mouse movement
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    document.addEventListener('mousemove', handleMouseMove);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
    };
  };

  const endTest = () => {
    setIsTestActive(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (checkIntervalRef.current) clearInterval(checkIntervalRef.current);
    
    const results: StudentProgress = {
      lessonId: lesson.id,
      currentTimestamp: currentTime,
      accuracy,
      errors: feedback.filter(f => f.includes('Error'))
    };
    
    onComplete?.(results);
  };

  const checkAccuracy = () => {
    // Check keystroke accuracy
    const expectedKeystrokes = lesson.keystrokeEvents.filter(
      event => event.timestamp <= currentTime
    );
    
    const expectedText = expectedKeystrokes
      .filter(event => event.key.length === 1)
      .map(event => event.key)
      .join('');

    if (expectedText && studentInput !== expectedText) {
      setFeedback(prev => [...prev, `Error: Expected "${expectedText}", got "${studentInput}"`]);
      setAccuracy(prev => Math.max(0, prev - 10));
    }

    // Check mouse position accuracy (within 50px tolerance)
    const expectedMouseEvent = lesson.mouseEvents.find(
      event => Math.abs(event.timestamp - currentTime) < 150
    );

    if (expectedMouseEvent) {
      const distance = Math.sqrt(
        Math.pow(mousePosition.x - expectedMouseEvent.x, 2) +
        Math.pow(mousePosition.y - expectedMouseEvent.y, 2)
      );

      if (distance > 50) {
        setFeedback(prev => [...prev, `Error: Mouse position off by ${Math.round(distance)}px`]);
        setAccuracy(prev => Math.max(0, prev - 5));
      }
    }
  };

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (checkIntervalRef.current) clearInterval(checkIntervalRef.current);
    };
  }, []);

  const progress = (currentTime / lesson.duration) * 100;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="w-5 h-5" />
          Test: {lesson.title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isTestActive ? (
          <div className="text-center space-y-4">
            <p className="text-muted-foreground">
              Ready to take the test? Follow the lesson instructions exactly.
            </p>
            <Button onClick={startTest} size="lg">
              Start Test
            </Button>
          </div>
        ) : (
          <>
            <div className="space-y-2">
              <div className="w-full bg-muted h-2 rounded-full">
                <div 
                  className="bg-primary h-2 rounded-full transition-all duration-100" 
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="flex justify-between text-sm">
                <span>Progress: {Math.round(progress)}%</span>
                <span>Accuracy: {accuracy}%</span>
              </div>
            </div>

            <div>
              <label htmlFor="student-input" className="block text-sm font-medium mb-2">
                Type here (follow the lesson):
              </label>
              <Input
                id="student-input"
                value={studentInput}
                onChange={(e) => setStudentInput(e.target.value)}
                placeholder="Type as shown in the lesson..."
              />
            </div>

            <div className="space-y-2 max-h-32 overflow-y-auto">
              {feedback.map((item, index) => (
                <div 
                  key={index} 
                  className={`flex items-center gap-2 text-sm p-2 rounded ${
                    item.includes('Error') 
                      ? 'bg-red-50 text-red-700' 
                      : 'bg-green-50 text-green-700'
                  }`}
                >
                  {item.includes('Error') ? (
                    <XCircle className="w-4 h-4" />
                  ) : (
                    <CheckCircle className="w-4 h-4" />
                  )}
                  {item}
                </div>
              ))}
            </div>

            <Button onClick={endTest} variant="outline">
              End Test Early
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
};