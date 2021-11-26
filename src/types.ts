// ============================================================================
// Global Types
// ============================================================================

export type NavMenuItem = 'trucknorris' | 'calculator' | 'zone-calculator';

// ============================================================================
// TruckNorris Types
// ============================================================================

export type DeliveryZone = 1 | 2 | 3 | 4 | undefined;

export type SiteID = 1867 | 7312 | 31303;

export type StorageDuration = 0 | 3 | 12;

export type ValidState = 'VIC' | 'NSW' | 'QLD';

export type City = 'Melbourne' | 'Sydney' | 'Brisbane';

export interface UserModData {
  id: string;
  limits?: {
    did: string;
    ip: string;
    lower: string;
    time: string;
    upper: string;
    user: string;
  }[];
  message?: {
    did: string;
    ip: string;
    message: string;
    time: string;
    user: string;
  }[];
  values?: UserModValue[];
  holiday: {
    holiday: any;
    holidayDescription: string;
  }[];
  infoMsg: {
    user: string;
    did: string;
    message: string;
    time: string
  }[]
};

export interface UserModValue {
  am: number;
  del: number;
  did: string;
  ip: string;
  pm: number;
  rtn: number;
  time: string;
  trl: number;
  ttl: number;
  user: string;
}

export interface CalculationData {
  addedOn: number;
  calculation: {[key in string]: {
    [key in string]: {
      am: number;
      anytime: number;
      customers: number[];
      delivery: number;
      dfCount: number;
      pickup: number;
      pm: number;
      sdp: number;
      trailers: number;
      wos: number;
      zone3: string[];
      zone4: string[];
    }
  }}
  id: number;
  ttl: number;
}

export interface SiteData {
  date: string;
  dateBroken: string[];
  holiday: boolean | Holiday;
  data: {
    am: number;
    anytime: number;
    customers: number[];
    delivery: number;
    dfCount: number;
    pickup: number;
    pm: number;
    sdp: number;
    trailers: number;
    wos: number;
    zone3: string[];
    zone4: string[];
    customMessage?: string;
  };
  limits: any[];
};

export interface PostcodeData {
  postcode: number;
  name: string;
  zone: DeliveryZone;
  hint: string;
  facility: "PRIMARY" | "SECONDARY";
  issue: string;
  marginal: boolean;
  CBD: boolean;
};

export interface PostcodeOption {
  label: string;
  value: PostcodeData;
};

export interface CityNoteData {
  city: string;
  notes: string;
};

export interface HolidayData {
  state: ValidState;
  years: {
    year: number;
    holidays: Holiday[];
  }[]
};

export interface DateAndTrailerLimitData {
  deliveries: DateLimit;
  locatiom: City,
  trailers: number;
  id: number;
};

export type DateLimit = Record<DayOfTheWeek, MinMaxObject>[];

export type DayOfTheWeek = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';

interface MinMaxObject {
  min: number;
  max: number;
};

export interface Holiday {
  date: string;
  description: string;
};

// ============================================================================
// Storage Calculator Types
// ============================================================================

export type ItemRestriction = "Can be flipped" | "Wall" | "No stack";

export interface CalculatorPredefinedItem {
  category: string;
  components?: {
    productId: string;
    quantity: number;
  }[];
  cssId: string;
  depth: number;
  height: number;
  id: string;
  order: number;
  predefined: boolean;
  product: string;
  public: boolean;
  quantity?: number;
  thumbnail: string;
  width: number;
  restriction?: ItemRestriction;
  type?: string;
};

export interface CalculatorCustomItem {
  id: string;
  depth: number;
  height: number;
  width: number;
  predefined: boolean;
  flippable: boolean | null;
  product: string;
  quantity: number;
  restriction?: ItemRestriction;
  type?: string;
};

export interface CalculatorCustomItemInput {
  product: string;
  width: number;
  height: number;
  depth: number;
  quantity: number;
  flippable: boolean;
};

export type CalculatorItem = CalculatorPredefinedItem | CalculatorCustomItem;

export interface StorageCalculatorState {
  calculationData?: any;
  lastAddedItem?: CalculatorItem;
  selectedItemObjects: CalculatorItem[];
  sentForCalculation: boolean;
};

export interface CalculatorItemOption {
  label: string; 
  value: string;
};

