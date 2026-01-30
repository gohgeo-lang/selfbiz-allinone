import { Ingredient, Menu } from "@/lib/types";

export function seedIngredients(): Ingredient[] {
  const now = Date.now();
  return [
    {
      id: "ing-bean-01",
      name: "에스프레소 원두",
      category: "beverage",
      unitType: "g",
      packSize: 1000,
      packPrice: 24000,
      createdAt: now,
    },
    {
      id: "ing-milk-01",
      name: "우유",
      category: "beverage",
      unitType: "ml",
      packSize: 1000,
      packPrice: 2800,
      createdAt: now,
    },
    {
      id: "ing-syrup-01",
      name: "바닐라 시럽",
      category: "beverage",
      unitType: "ml",
      packSize: 750,
      packPrice: 12000,
      createdAt: now,
    },
    {
      id: "ing-cup-01",
      name: "종이컵 12oz",
      category: "equipment",
      unitType: "ea",
      packSize: 100,
      packPrice: 7000,
      createdAt: now,
    },
    {
      id: "ing-lid-01",
      name: "뚜껑",
      category: "equipment",
      unitType: "ea",
      packSize: 100,
      packPrice: 3000,
      createdAt: now,
    },
    {
      id: "ing-syrup-02",
      name: "카라멜 시럽",
      category: "beverage",
      unitType: "ml",
      packSize: 750,
      packPrice: 12000,
      createdAt: now,
    },
    {
      id: "ing-milk-02",
      name: "오트 밀크",
      category: "beverage",
      unitType: "ml",
      packSize: 1000,
      packPrice: 4200,
      createdAt: now,
    },
    {
      id: "ing-etc-01",
      name: "휘핑 크림",
      category: "food",
      unitType: "g",
      packSize: 1000,
      packPrice: 9000,
      createdAt: now,
    },
    {
      id: "ing-etc-02",
      name: "초콜릿 소스",
      category: "food",
      unitType: "ml",
      packSize: 1000,
      packPrice: 11000,
      createdAt: now,
    },
  ];
}

export function seedMenus(): Menu[] {
  const now = Date.now();
  return [
    {
      id: "menu-01",
      name: "아메리카노",
      category: "drink",
      temp: "ICE",
      sizeLabel: "12oz",
      sellPrice: 4500,
      steps: ["샷 추출", "물 + 얼음 추가", "컵 마감"],
      recipeItems: [
        { ingredientId: "ing-bean-01", amount: 18, unitType: "g" },
        { ingredientId: "ing-cup-01", amount: 1, unitType: "ea" },
        { ingredientId: "ing-lid-01", amount: 1, unitType: "ea" },
      ],
      createdAt: now,
    },
    {
      id: "menu-02",
      name: "카페라떼",
      category: "drink",
      temp: "HOT",
      sizeLabel: "12oz",
      sellPrice: 5000,
      steps: ["샷 추출", "우유 스티밍", "라떼아트"],
      recipeItems: [
        { ingredientId: "ing-bean-01", amount: 18, unitType: "g" },
        { ingredientId: "ing-milk-01", amount: 200, unitType: "ml" },
        { ingredientId: "ing-cup-01", amount: 1, unitType: "ea" },
        { ingredientId: "ing-lid-01", amount: 1, unitType: "ea" },
      ],
      createdAt: now,
    },
    {
      id: "menu-03",
      name: "바닐라 라떼",
      category: "drink",
      temp: "ICE",
      sizeLabel: "16oz",
      sellPrice: 5800,
      steps: ["컵에 시럽", "샷 추출", "우유 + 얼음 추가"],
      recipeItems: [
        { ingredientId: "ing-bean-01", amount: 18, unitType: "g" },
        { ingredientId: "ing-milk-02", amount: 220, unitType: "ml" },
        { ingredientId: "ing-syrup-01", amount: 25, unitType: "ml" },
        { ingredientId: "ing-cup-01", amount: 1, unitType: "ea" },
        { ingredientId: "ing-lid-01", amount: 1, unitType: "ea" },
      ],
      createdAt: now,
    },
  ];
}
