import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { LessonRecording, StudentProgress } from '@/types/lesson';
import { geminiVerification } from '@/services/geminiVerification';
import { CheckCircle, XCircle, Target, Camera, Key, Shield } from 'lucide-react';

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
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string>('');
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [verificationStatus, setVerificationStatus] = useState<'pending' | 'verifying' | 'passed' | 'failed'>('pending');
  const [verificationMessage, setVerificationMessage] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const intervalRef = useRef<NodeJS.Timeout>();
  const checkIntervalRef = useRef<NodeJS.Timeout>();

  const startTest = async () => {
    if (!geminiApiKey.trim()) {
      setCameraError('Gemini API key is required for verification');
      return;
    }

    if (!lesson.referenceImageBlob) {
      setCameraError('No reference image found for this lesson');
      return;
    }

    try {
      // Set up Gemini API
      geminiVerification.setApiKey(geminiApiKey);
      
      // Request camera access for identity verification
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: false 
      });
      setCameraStream(stream);
      setCameraError('');
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        
        // Wait for video to be ready and perform verification
        videoRef.current.onloadedmetadata = () => {
          setTimeout(() => performVerification(), 2000);
        };
      }
    } catch (error) {
      setCameraError('Camera access is required for test verification');
      console.error('Camera access denied:', error);
      return;
    }
  };

  const performVerification = async () => {
    if (!videoRef.current || !lesson.referenceImageBlob) return;
    
    setVerificationStatus('verifying');
    setVerificationMessage('Verifying your identity...');
    
    try {
      const currentImageBlob = await geminiVerification.captureImageFromVideo(videoRef.current);
      const result = await geminiVerification.verifyIdentity(lesson.referenceImageBlob, currentImageBlob);
      
      if (result.isMatch && result.confidence >= 70) {
        setVerificationStatus('passed');
        setVerificationMessage(`Identity verified (${result.confidence}% confidence)`);
        startActualTest();
      } else {
        setVerificationStatus('failed');
        setVerificationMessage(`Identity verification failed: ${result.reason}`);
      }
    } catch (error) {
      setVerificationStatus('failed');
      setVerificationMessage('Verification failed due to technical error');
      console.error('Verification error:', error);
    }
  };

  const startActualTest = () => {

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
    
    // Stop camera stream
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    
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
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [cameraStream]);

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
        {!isTestActive && verificationStatus === 'pending' ? (
          <div className="text-center space-y-4">
            <div>
              <label htmlFor="gemini-api-key" className="block text-sm font-medium mb-2 flex items-center justify-center gap-2">
                <Key className="w-4 h-4" />
                Gemini API Key (for verification)
              </label>
              <Input
                id="gemini-api-key"
                type="password"
                value={geminiApiKey}
                onChange={(e) => setGeminiApiKey(e.target.value)}
                placeholder="Enter your Gemini API key..."
                className="max-w-md mx-auto"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Required for identity verification. Get your key from Google AI Studio.
              </p>
            </div>
            
            <div className="flex items-center justify-center gap-2 mb-4">
              <Camera className="w-5 h-5 text-primary" />
              <span className="text-sm text-muted-foreground">Camera verification required</span>
            </div>
            <p className="text-muted-foreground">
              Ready to take the test? Your camera will be activated for identity verification.
            </p>
            {cameraError && (
              <p className="text-red-600 text-sm">{cameraError}</p>
            )}
            <Button onClick={startTest} size="lg" disabled={!geminiApiKey.trim()}>
              Start Test & Enable Camera
            </Button>
          </div>
        ) : verificationStatus === 'verifying' ? (
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-2">
              <Shield className="w-6 h-6 text-blue-500 animate-spin" />
              <span className="font-medium">Verifying Identity...</span>
            </div>
            <p className="text-muted-foreground">{verificationMessage}</p>
            <div className="relative bg-muted rounded-lg overflow-hidden max-w-sm mx-auto">
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-48 object-cover"
              />
            </div>
          </div>
        ) : verificationStatus === 'failed' ? (
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-2">
              <XCircle className="w-6 h-6 text-red-500" />
              <span className="font-medium text-red-700">Verification Failed</span>
            </div>
            <p className="text-red-600">{verificationMessage}</p>
            <Button onClick={() => {
              setVerificationStatus('pending');
              setVerificationMessage('');
              if (cameraStream) {
                cameraStream.getTracks().forEach(track => track.stop());
                setCameraStream(null);
              }
            }} variant="outline">
              Try Again
            </Button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2 space-y-4">
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
              </div>

              <div className="space-y-4">
                <div className="text-center">
                  <h3 className="text-sm font-medium mb-2 flex items-center justify-center gap-2">
                    <Camera className="w-4 h-4" />
                    Identity Verification
                  </h3>
                  <div className="relative bg-muted rounded-lg overflow-hidden">
                    <video
                      ref={videoRef}
                      autoPlay
                      muted
                      playsInline
                      className="w-full h-48 object-cover"
                    />
                    <div className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded">
                      RECORDING
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Camera verification active
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};