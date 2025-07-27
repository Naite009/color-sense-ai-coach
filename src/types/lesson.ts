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
  mouseEvents: MouseEvent[];
  keystrokeEvents: KeystrokeEvent[];
  createdAt: Date;
  createdBy: string;
}

export interface StudentProgress {
  lessonId: string;
  currentTimestamp: number;
  accuracy: number;
  errors: string[];
}