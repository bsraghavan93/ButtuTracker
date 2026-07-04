export type Baby = {
  id: string;
  user_id: string;
  name: string;
  dob: string; // ISO date
  family_culture: string | null;
  food_restrictions: string[] | null;
  timezone: string | null;
  created_at: string;
};

export type SleepType = "nap" | "night";

export type SleepLog = {
  id: string;
  baby_id: string;
  type: SleepType;
  start_time: string;
  end_time: string | null;
  night_wakings: number | null;
  notes: string | null;
  created_at: string;
};

export type FeedType = "breast" | "bottle" | "pump";
export type FeedSide = "left" | "right" | "both";

export type FeedLog = {
  id: string;
  baby_id: string;
  type: FeedType;
  side: FeedSide | null;
  duration_min: number | null;
  amount_ml: number | null;
  occurred_at: string;
  notes: string | null;
  created_at: string;
};

export type Texture = "puree" | "mashed" | "finger_food" | "blw";
export type Reaction = "none" | "rash" | "vomiting" | "gas" | "constipation" | "diarrhea";

export type SolidLog = {
  id: string;
  baby_id: string;
  food_name: string;
  date_introduced: string;
  quantity: string | null;
  texture: Texture | null;
  reaction: Reaction | null;
  is_iron_rich: boolean | null;
  is_tamil_food: boolean | null;
  notes: string | null;
  created_at: string;
};

export type DiaperType = "wet" | "poop" | "both";

export type DiaperLog = {
  id: string;
  baby_id: string;
  type: DiaperType;
  color: string | null;
  texture: string | null;
  notes: string | null;
  occurred_at: string;
  created_at: string;
};

export type Food = {
  id: string;
  baby_id: string;
  name: string;
  emoji: string | null;
  created_at: string;
};

export type GrowthLog = {
  id: string;
  baby_id: string;
  weight_lb: number | null;
  length_in: number | null;
  head_circumference_in: number | null;
  notes: string | null;
  measured_at: string;
  created_at: string;
};
