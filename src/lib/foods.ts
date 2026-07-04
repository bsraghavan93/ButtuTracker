export type FoodEntry = {
  name: string;
  category: "grain" | "legume" | "vegetable" | "fruit" | "protein" | "dairy";
  ironRich: boolean;
  tamilFood: boolean;
  minAgeMonths: number;
  commonAllergen: boolean;
  notes?: string;
};

/**
 * Starter food bank prioritizing iron-rich foods first (per pediatric solids
 * guidance) and culturally relevant Tamil/Indian first foods. This is a
 * suggestion list only, not a diagnosis or medical directive.
 */
export const FOOD_BANK: FoodEntry[] = [
  { name: "Ragi (finger millet) porridge", category: "grain", ironRich: true, tamilFood: true, minAgeMonths: 6, commonAllergen: false, notes: "Classic Tamil first food, iron-rich" },
  { name: "Iron-fortified rice cereal", category: "grain", ironRich: true, tamilFood: false, minAgeMonths: 6, commonAllergen: false },
  { name: "Moong dal (yellow lentil) puree", category: "legume", ironRich: true, tamilFood: true, minAgeMonths: 6, commonAllergen: false },
  { name: "Masoor dal (red lentil) puree", category: "legume", ironRich: true, tamilFood: true, minAgeMonths: 6, commonAllergen: false },
  { name: "Spinach (keerai) puree", category: "vegetable", ironRich: true, tamilFood: true, minAgeMonths: 6, commonAllergen: false },
  { name: "Chicken puree", category: "protein", ironRich: true, tamilFood: false, minAgeMonths: 6, commonAllergen: false },
  { name: "Egg yolk (well cooked)", category: "protein", ironRich: true, tamilFood: false, minAgeMonths: 6, commonAllergen: true, notes: "Common allergen — start small, watch 3 days" },
  { name: "Tofu, soft cubes", category: "protein", ironRich: true, tamilFood: false, minAgeMonths: 8, commonAllergen: true },
  { name: "Sweet potato (sakkarai valli kizhangu) mash", category: "vegetable", ironRich: false, tamilFood: true, minAgeMonths: 6, commonAllergen: false },
  { name: "Banana (vazhaipazham) mash", category: "fruit", ironRich: false, tamilFood: true, minAgeMonths: 6, commonAllergen: false },
  { name: "Avocado mash", category: "fruit", ironRich: false, tamilFood: false, minAgeMonths: 6, commonAllergen: false },
  { name: "Carrot (carrot) puree", category: "vegetable", ironRich: false, tamilFood: true, minAgeMonths: 6, commonAllergen: false },
  { name: "Pumpkin (poosanikai) puree", category: "vegetable", ironRich: false, tamilFood: true, minAgeMonths: 6, commonAllergen: false },
  { name: "Idli, soft steamed (mashed)", category: "grain", ironRich: false, tamilFood: true, minAgeMonths: 8, commonAllergen: false, notes: "Soften with milk/water, no salt added for baby" },
  { name: "Dosai, soft (finger strips)", category: "grain", ironRich: false, tamilFood: true, minAgeMonths: 9, commonAllergen: false },
  { name: "Curd rice, mild (no salt)", category: "dairy", ironRich: false, tamilFood: true, minAgeMonths: 9, commonAllergen: true, notes: "Dairy as ingredient okay after 6mo; not as main drink before 12mo" },
  { name: "Green gram (pasi payaru) sundal, mashed", category: "legume", ironRich: true, tamilFood: true, minAgeMonths: 8, commonAllergen: false },
  { name: "Peas (pattani) mash", category: "vegetable", ironRich: false, tamilFood: true, minAgeMonths: 6, commonAllergen: false },
  { name: "Apple, steamed & mashed", category: "fruit", ironRich: false, tamilFood: false, minAgeMonths: 6, commonAllergen: false },
  { name: "Beetroot puree", category: "vegetable", ironRich: false, tamilFood: true, minAgeMonths: 7, commonAllergen: false },
  { name: "Peanut butter, thinned (per allergen intro guidance)", category: "protein", ironRich: false, tamilFood: false, minAgeMonths: 6, commonAllergen: true, notes: "Discuss early peanut introduction timing with your pediatrician" },
  { name: "Yogurt (curd), plain whole-milk", category: "dairy", ironRich: false, tamilFood: true, minAgeMonths: 6, commonAllergen: true },
  { name: "Paneer, soft cubes", category: "dairy", ironRich: false, tamilFood: true, minAgeMonths: 8, commonAllergen: true },
  { name: "Fish, well-cooked flakes", category: "protein", ironRich: true, tamilFood: false, minAgeMonths: 8, commonAllergen: true },
  { name: "Oats porridge", category: "grain", ironRich: false, tamilFood: false, minAgeMonths: 6, commonAllergen: false },
  { name: "Broccoli, soft steamed florets", category: "vegetable", ironRich: false, tamilFood: false, minAgeMonths: 8, commonAllergen: false },
  { name: "Chana (chickpea) mash", category: "legume", ironRich: true, tamilFood: true, minAgeMonths: 8, commonAllergen: false },
];

const RESTRICTED_KEYWORDS = ["beef", "pork", "ham", "bacon"];

export function isRestricted(food: FoodEntry, restrictions: string[]): boolean {
  const name = food.name.toLowerCase();
  return restrictions.some((r) => RESTRICTED_KEYWORDS.some((k) => k === r.toLowerCase()) && name.includes(r.toLowerCase()));
}

/**
 * Suggest the next foods to try: not yet tolerated, age-appropriate,
 * respecting family restrictions, prioritizing iron-rich then Tamil foods.
 */
export function suggestNextFoods(
  triedFoodNames: string[],
  ageMonths: number,
  restrictions: string[],
  limit = 5
): FoodEntry[] {
  const tried = new Set(triedFoodNames.map((f) => f.toLowerCase()));
  return FOOD_BANK.filter(
    (f) =>
      !tried.has(f.name.toLowerCase()) &&
      f.minAgeMonths <= ageMonths &&
      !isRestricted(f, restrictions)
  )
    .sort((a, b) => {
      if (a.ironRich !== b.ironRich) return a.ironRich ? -1 : 1;
      if (a.tamilFood !== b.tamilFood) return a.tamilFood ? -1 : 1;
      return 0;
    })
    .slice(0, limit);
}
