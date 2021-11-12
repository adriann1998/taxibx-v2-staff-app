export type NavMenuItem = 'trucknorris' | 'calculator' | 'zone-calculator';

export type DeliveryZone = 1 | 2 | 3 | 4 | undefined;

export type StorageDuration = 0 | 3 | 12;

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