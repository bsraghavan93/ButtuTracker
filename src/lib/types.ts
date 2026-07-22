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

export type PottyType = "pee" | "poop" | "both";

export type PottyLog = {
  id: string;
  baby_id: string;
  type: PottyType;
  notes: string | null;
  occurred_at: string;
  created_at: string;
};

export type MedicineLog = {
  id: string;
  baby_id: string;
  medicine_name: string;
  dose_amount: number | null;
  dose_unit: string | null;
  notes: string | null;
  occurred_at: string;
  created_at: string;
};

export type FoodCategory = "grain" | "legume" | "vegetable" | "fruit" | "protein" | "dairy" | "other";

export type FoodCatalogItem = {
  id: string;
  name: string;
  category: FoodCategory;
  created_at: string;
};

export type MealSlot = "breakfast" | "morning_snack" | "lunch" | "afternoon_snack" | "dinner";
export type RepeatType = "none" | "daily" | "every_other_day" | "weekly";

export type MealPlanItem = {
  id: string;
  baby_id: string;
  food_name: string;
  category: FoodCategory;
  meal_slot: MealSlot;
  start_date: string; // ISO date
  end_date: string | null; // ISO date
  repeat_type: RepeatType;
  repeat_days: number[]; // 0 (Sun) - 6 (Sat), used when repeat_type === "weekly"
  prep_previous_day: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type PushSubscriptionRow = {
  id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  created_at: string;
};
