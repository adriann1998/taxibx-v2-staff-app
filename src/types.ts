export type NavMenuItem = 'trucknorris' | 'calculator' | 'zone-calculator';

export type DeliveryZone = 1 | 2 | 3 | 4 | undefined;

export type SiteID = 1867 | 7312 | 31303;

export type StorageDuration = 0 | 3 | 12;

export type ValidState = 'VIC' | 'NSW' | 'QLD';

export type City = 'Melbourne' | 'Sydney' | 'Brisbane';

export interface LimitData {
  id: string;
  limits?: {
    did: string;
    ip: string;
    lower: string;
    time: string;
    upper: string;
    user: string;
  }[];
  messages: {
    did: string;
    ip: string;
    message: string;
    time: string;
    user: string;
  }[];
  values: {
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
};

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
    zone3: string[];
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
  deliveries: {[key in DayOfTheWeek]: MinMaxObject}[];
  locatiom: City,
  trailers: number;
  id: number;
};

export type DayOfTheWeek = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';

interface MinMaxObject {
  min: number;
  max: number;
};

export interface Holiday {
  date: string;
  description: string;
};