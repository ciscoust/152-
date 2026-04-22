export type GoalID = string;

export interface Ritual {
  id: 'm' | 'a' | 'e';
  name: string;
  time: string; // 12h format "HH:mm AM/PM"
  count: number;
}

export interface Entry {
  id: number;
  ritualId: 'm' | 'a' | 'e';
  text: string;
  date: string; // ISO string
}

export interface Goal {
  id: GoalID;
  name: string;
  image: string | null;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  rituals: Ritual[];
  entries: Entry[];
}

export interface AudioSettings {
  sounds: {
    general: string | null;
    morning: string | null;
    afternoon: string | null;
    evening: string | null;
  };
  music: {
    phase1: string | null;
    phase2: string | null;
    phase3: string | null;
    phase4: string | null;
    phase5: string | null;
  };
}

export interface AppSettings {
  notifications: boolean;
  defaultTimes: {
    morning: string;
    afternoon: string;
    evening: string;
  };
  audio: AudioSettings;
}

export interface AppData {
  settings: AppSettings;
  goals: Goal[];
}
