import { Ingredient, Menu } from "@/lib/types";

export function formatKRW(n: number) {
  return new Intl.NumberFormat("ko-KR").format(Math.round(n));
}

export function getUnitCost(ingredient: Ingredient) {
  if (!ingredient.packSize) return 0;
  return ingredient.packPrice / ingredient.packSize;
}

export function calcMenuCost(menu: Menu, ingredients: Ingredient[]) {
  const map = new Map(ingredients.map((item) => [item.id, item]));
  return menu.recipeItems.reduce((sum, item) => {
    const ingredient = map.get(item.ingredientId);
    if (!ingredient) return sum;
    return sum + getUnitCost(ingredient) * item.amount;
  }, 0);
}

export function calcOverheadPerMenu(overheads: { amount: number }[], monthlySalesVolume: number) {
  if (monthlySalesVolume <= 0) return 0;
  const total = overheads.reduce((sum, item) => sum + item.amount, 0);
  return total / monthlySalesVolume;
}

export function calcOverheadPerMenuByCategory(
  overheads: { amount: number }[],
  monthlySalesVolume: number,
  categorySalesSharePercent: number,
  categoryOverheadSharePercent: number
) {
  if (monthlySalesVolume <= 0) return 0;
  if (categorySalesSharePercent <= 0 || categoryOverheadSharePercent <= 0) return 0;
  const total = overheads.reduce((sum, item) => sum + item.amount, 0);
  const categoryTotal = (total * categoryOverheadSharePercent) / 100;
  const categoryVolume = (monthlySalesVolume * categorySalesSharePercent) / 100;
  if (categoryVolume <= 0) return 0;
  return categoryTotal / categoryVolume;
}

export function calcNetProfit(sellPrice: number, cost: number) {
  return sellPrice - cost;
}

export function calcMarginPercent(sellPrice: number, netProfit: number) {
  if (sellPrice <= 0) return 0;
  return (netProfit / sellPrice) * 100;
}

export function calcRecommendedPrice(
  cost: number,
  targetMarginPercent: number,
  roundingUnit: 10 | 100
) {
  if (targetMarginPercent >= 100) return cost;
  const recommended = cost / (1 - targetMarginPercent / 100);
  return Math.round(recommended / roundingUnit) * roundingUnit;
}
