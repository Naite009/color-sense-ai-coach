export interface MouseEvent {
  x: number;
  y: number;
  timestamp: number;
  type: 'click' | 'move';
}

export interface KeystrokeEvent {
  key: string;
  timestamp: number;
  elementId?: string;
  value?: string;
}

export interface LessonRecording {
  id: string;
  title: string;
  description?: string;
  duration: number;
  recordingType: 'screen' | 'camera';
  // Screen recording data
  mouseEvents: MouseEvent[];
  keystrokeEvents: KeystrokeEvent[];
  // Camera recording data
  videoBlob?: Blob;
  videoUrl?: string;
  createdAt: Date;
  createdBy: string;
}

export interface StudentProgress {
  lessonId: string;
  currentTimestamp: number;
  accuracy: number;
  errors: string[];
}