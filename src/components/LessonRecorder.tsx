import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useLessonRecorder } from '@/hooks/useLessonRecorder';
import { LessonRecording } from '@/types/lesson';
import { Play, Square, Save, Camera, Monitor } from 'lucide-react';

interface LessonRecorderProps {
  onLessonSaved: (lesson: LessonRecording) => void;
  savedLessons: LessonRecording[];
}

export const LessonRecorder = ({ onLessonSaved, savedLessons }: LessonRecorderProps) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedMode, setSelectedMode] = useState<'screen' | 'camera'>('screen');
  
  const {
    isRecording,
    recordingType,
    mouseEvents,
    keystrokeEvents,
    videoBlob,
    startRecording,
    stopRecording,
    saveLesson
  } = useLessonRecorder();

  const handleStartRecording = () => {
    startRecording(selectedMode);
  };

  const handleStopRecording = () => {
    stopRecording();
  };

  const handleSaveLesson = () => {
    if (!title.trim()) return;
    
    const lesson = saveLesson(title, description);
    onLessonSaved(lesson);
    setTitle('');
    setDescription('');
  };

  const hasRecordedContent = recordingType === 'camera' 
    ? videoBlob 
    : mouseEvents.length > 0 || keystrokeEvents.length > 0;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Record New Lesson</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Recording Mode</label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={selectedMode === 'screen' ? 'default' : 'outline'}
                onClick={() => setSelectedMode('screen')}
                disabled={isRecording}
                className="flex items-center gap-2"
              >
                <Monitor className="w-4 h-4" />
                Screen Recording
              </Button>
              <Button
                type="button"
                variant={selectedMode === 'camera' ? 'default' : 'outline'}
                onClick={() => setSelectedMode('camera')}
                disabled={isRecording}
                className="flex items-center gap-2"
              >
                <Camera className="w-4 h-4" />
                Camera Recording
              </Button>
            </div>
          </div>
          
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
            
            {!isRecording && hasRecordedContent && (
              <Button onClick={handleSaveLesson} disabled={!title.trim()} className="flex items-center gap-2">
                <Save className="w-4 h-4" />
                Save Lesson
              </Button>
            )}
          </div>

          {isRecording && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 font-medium">Recording in progress... ({selectedMode} mode)</p>
              {recordingType === 'screen' && (
                <p className="text-sm text-red-600">
                  Mouse events: {mouseEvents.length} | Keystrokes: {keystrokeEvents.length}
                </p>
              )}
              {recordingType === 'camera' && (
                <p className="text-sm text-red-600">Camera recording active</p>
              )}
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
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium">{lesson.title}</h3>
                    <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                      {lesson.recordingType}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Duration: {Math.round(lesson.duration / 1000)}s
                    {lesson.recordingType === 'screen' && (
                      <> | Mouse events: {lesson.mouseEvents.length} | Keystrokes: {lesson.keystrokeEvents.length}</>
                    )}
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