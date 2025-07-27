import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useLessonRecorder } from '@/hooks/useLessonRecorder';
import { Play, Square, Save } from 'lucide-react';

export const LessonRecorder = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [savedLessons, setSavedLessons] = useState<any[]>([]);
  
  const {
    isRecording,
    mouseEvents,
    keystrokeEvents,
    startRecording,
    stopRecording,
    saveLesson
  } = useLessonRecorder();

  const handleStartRecording = () => {
    startRecording();
  };

  const handleStopRecording = () => {
    stopRecording();
  };

  const handleSaveLesson = () => {
    if (!title.trim()) return;
    
    const lesson = saveLesson(title, description);
    setSavedLessons(prev => [...prev, lesson]);
    setTitle('');
    setDescription('');
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Record New Lesson</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Input
              placeholder="Lesson title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isRecording}
            />
          </div>
          
          <div>
            <Textarea
              placeholder="Lesson description (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isRecording}
            />
          </div>

          <div className="flex gap-2">
            {!isRecording ? (
              <Button onClick={handleStartRecording} className="flex items-center gap-2">
                <Play className="w-4 h-4" />
                Start Recording
              </Button>
            ) : (
              <Button onClick={handleStopRecording} variant="destructive" className="flex items-center gap-2">
                <Square className="w-4 h-4" />
                Stop Recording
              </Button>
            )}
            
            {!isRecording && (mouseEvents.length > 0 || keystrokeEvents.length > 0) && (
              <Button onClick={handleSaveLesson} disabled={!title.trim()} className="flex items-center gap-2">
                <Save className="w-4 h-4" />
                Save Lesson
              </Button>
            )}
          </div>

          {isRecording && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 font-medium">Recording in progress...</p>
              <p className="text-sm text-red-600">
                Mouse events: {mouseEvents.length} | Keystrokes: {keystrokeEvents.length}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {savedLessons.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Saved Lessons</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {savedLessons.map((lesson) => (
                <div key={lesson.id} className="p-3 border rounded-lg">
                  <h3 className="font-medium">{lesson.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    Duration: {Math.round(lesson.duration / 1000)}s | 
                    Mouse events: {lesson.mouseEvents.length} | 
                    Keystrokes: {lesson.keystrokeEvents.length}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};