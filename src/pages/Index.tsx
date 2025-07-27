import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LessonRecorder } from '@/components/LessonRecorder';
import { LessonPlayer } from '@/components/LessonPlayer';
import { LessonTest } from '@/components/LessonTest';
import { LessonRecording } from '@/types/lesson';

const Index = () => {
  const [selectedLesson, setSelectedLesson] = useState<LessonRecording | null>(null);

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
            <LessonRecorder />
          </TabsContent>
          
          <TabsContent value="play" className="mt-6">
            {selectedLesson ? (
              <LessonPlayer 
                lesson={selectedLesson}
                onComplete={() => console.log('Lesson completed')}
              />
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No lesson selected. Record a lesson first.</p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="test" className="mt-6">
            {selectedLesson ? (
              <LessonTest 
                lesson={selectedLesson}
                onComplete={(results) => console.log('Test completed:', results)}
              />
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No lesson selected. Record a lesson first.</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;
