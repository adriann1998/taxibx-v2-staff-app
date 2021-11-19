export type NavMenuItem = 'trucknorris' | 'calculator' | 'zone-calculator';

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
  values?: {
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
  }[];
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
  postcode: PostcodeData;
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