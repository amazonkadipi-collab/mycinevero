export type AdsSettings = {
  adsense: boolean;
  display300x250: boolean;
  adsterraNativeBanner: boolean;
};

export const defaultAdsSettings: AdsSettings = {
  adsense: true,
  display300x250: true,
  adsterraNativeBanner: true,
};
