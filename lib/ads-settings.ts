export type AdsSettings = {
  adsense: boolean;
  display300x250: boolean;
  inPagePush: boolean;
};

export const defaultAdsSettings: AdsSettings = {
  adsense: true,
  display300x250: true,
  inPagePush: false,
};
