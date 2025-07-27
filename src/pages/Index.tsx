import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { LessonRecorder } from '@/components/LessonRecorder';
import { LessonPlayer } from '@/components/LessonPlayer';
import { LessonTest } from '@/components/LessonTest';
import { LessonRecording } from '@/types/lesson';

const Index = () => {
  const [selectedLesson, setSelectedLesson] = useState<LessonRecording | null>(null);
  const [savedLessons, setSavedLessons] = useState<LessonRecording[]>([]);

  const handleLessonSaved = (lesson: LessonRecording) => {
    setSavedLessons(prev => [...prev, lesson]);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8">
        <h1 className="text-4xl font-bold mb-8 text-center">Lesson Recording System</h1>
        
        <Tabs defaultValue="record" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="record">Record Lesson</TabsTrigger>
            <TabsTrigger value="play">Play Lesson</TabsTrigger>
            <TabsTrigger value="test">Take Test</TabsTrigger>
          </TabsList>
          
          <TabsContent value="record" className="mt-6">
            <LessonRecorder onLessonSaved={handleLessonSaved} savedLessons={savedLessons} />
          </TabsContent>
          
          <TabsContent value="play" className="mt-6">
            {selectedLesson ? (
              <LessonPlayer 
                lesson={selectedLesson}
                onComplete={() => console.log('Lesson completed')}
              />
            ) : savedLessons.length > 0 ? (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Select a lesson to play:</h3>
                <div className="grid gap-2">
                  {savedLessons.map((lesson) => (
                    <Button
                      key={lesson.id}
                      variant="outline"
                      onClick={() => setSelectedLesson(lesson)}
                      className="justify-start h-auto p-4"
                    >
                      <div className="text-left">
                        <div className="font-medium">{lesson.title}</div>
                        <div className="text-sm text-muted-foreground">
                          Duration: {Math.round(lesson.duration / 1000)}s
                        </div>
                      </div>
                    </Button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No lessons available. Record a lesson first.</p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="test" className="mt-6">
            {selectedLesson ? (
              <LessonTest 
                lesson={selectedLesson}
                onComplete={(results) => console.log('Test completed:', results)}
              />
            ) : savedLessons.length > 0 ? (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Select a lesson to test:</h3>
                <div className="grid gap-2">
                  {savedLessons.map((lesson) => (
                    <Button
                      key={lesson.id}
                      variant="outline"
                      onClick={() => setSelectedLesson(lesson)}
                      className="justify-start h-auto p-4"
                    >
                      <div className="text-left">
                        <div className="font-medium">{lesson.title}</div>
                        <div className="text-sm text-muted-foreground">
                          Duration: {Math.round(lesson.duration / 1000)}s
                        </div>
                      </div>
                    </Button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No lessons available. Record a lesson first.</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;
