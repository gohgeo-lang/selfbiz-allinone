export type UnitType = "g" | "ml" | "ea";

export type IngredientCategory =
  | "beverage"
  | "food"
  | "consumable"
  | "equipment"
  | "etc";

export interface Ingredient {
  id: string;
  name: string;
  category: IngredientCategory;
  unitType: UnitType;
  packSize: number;
  packPrice: number;
  createdAt: number;
}

export interface MenuRecipeItem {
  ingredientId: string;
  amount: number;
  unitType: UnitType;
}

export type MenuCategory = "drink" | "dessert" | "food" | "etc";

export interface Menu {
  id: string;
  name: string;
  category: MenuCategory;
  temp: "HOT" | "ICE";
  sizeLabel: string;
  sellPrice: number;
  steps: string[];
  recipeItems: MenuRecipeItem[];
  createdAt: number;
}

export interface Settings {
  targetMarginPercent: number;
  roundingUnit: 10 | 100;
  monthlySalesVolume: number;
  includeOverheadInCost: boolean;
  categorySalesMixPercent: Record<MenuCategory, number>;
  categoryOverheadMixPercent: Record<MenuCategory, number>;
}

export interface SimulationScenario {
  id: string;
  name: string;
  monthlySalesVolume: number;
  monthlyRevenue: number;
  wastePercent: number;
  createdAt: number;
}

export interface QuickLink {
  id: string;
  name: string;
  url: string;
  category?: string;
  pinned?: boolean;
  createdAt: number;
}

export type OverheadCategory =
  | "facility"
  | "labor"
  | "utilities"
  | "fees"
  | "depreciation"
  | "marketing"
  | "etc";

export interface Overhead {
  id: string;
  name: string;
  category: OverheadCategory;
  facilityType?: "lease" | "own";
  amount: number;
  calcMethod?: "monthly" | "depreciation";
  facilityRent?: number;
  facilityManagementFee?: number;
  facilityDeposit?: number;
  facilityDepositMonths?: number;
  facilityContractStart?: string;
  facilityContractEnd?: string;
  facilityDepositLoanAmount?: number;
  facilityDepositLoanRate?: number;
  facilityDepositLoanStart?: string;
  facilityDepositLoanEnd?: string;
  facilityMaintenance?: number;
  facilityLoanInterest?: number;
  facilityPurchasePrice?: number;
  facilityCashPaid?: number;
  facilityLoanAmount?: number;
  facilityLoanRate?: number;
  facilityLoanStart?: string;
  facilityLoanEnd?: string;
  facilityLoanGraceMonths?: number;
  facilityLoanMethod?: "annuity" | "equal_principal" | "balloon" | "increasing" | "other";
  facilityLoanCustomPayment?: number;
  facilityLoanIncreasingStart?: number;
  facilityLoanIncreasingRate?: number;
  facilityPropertyTaxAnnual?: number;
  facilityComprehensiveTaxAnnual?: number;
  utilitiesElectric?: number;
  utilitiesGas?: number;
  utilitiesWater?: number;
  utilitiesInternet?: number;
  utilitiesSubscriptions?: number;
  utilitiesSubscriptionsItems?: { id: string; name: string; amount: number }[];
  utilitiesOther?: number;
  utilitiesOtherItems?: { id: string; name: string; amount: number }[];
  laborItems?: { id: string; name: string; monthlyCost: number }[];
  feeItems?: { id: string; name: string; monthlyCost: number }[];
  marketingItems?: { id: string; platform: string; actualSpend: number }[];
  etcItems?: { id: string; name: string; monthlyCost: number }[];
  depreciationItems?: {
    id: string;
    name: string;
    purchaseDate?: string;
    paymentMethod?: "cash" | "installment" | "lease";
    totalRepayment?: number;
    usefulMonths: number;
    salvageValue?: number;
  }[];
  purchasePrice?: number;
  salvageValue?: number;
  usefulMonths?: number;
  createdAt: number;
}
