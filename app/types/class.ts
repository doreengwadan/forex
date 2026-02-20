export type ClassType = 'live' | 'recorded';
export type ClassStatus = 'scheduled' | 'ongoing' | 'completed' | 'cancelled' | 'published';

export interface Class {
  id: number;
  title: string;
  instructor: string;
  date: string;
  time: string;
  duration: string;
  attendees: number;
  maxAttendees: number;
  type: ClassType;
  status: ClassStatus;
  category: string;
  description?: string;
  recordingUrl?: string;
  tags?: string[];
  created_at?: string;
  updated_at?: string;
}

export interface ClassForm {
  title: string;
  instructor: string;
  date: string;
  time: string;
  duration: string;
  maxAttendees: string;
  type: ClassType;
  category: string;
  description: string;
  tags: string[];
  recordingUrl?: string;
}

export interface Stats {
  total: number;
  live: number;
  recorded: number;
  upcoming: number;
  participants: number;
}