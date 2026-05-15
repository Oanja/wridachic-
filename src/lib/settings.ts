/**
 * Shared site-settings types + defaults. Client AND server safe — no
 * dependency on next/headers or any server-only module.
 *
 * The server-only fetcher lives in `./settings-server.ts`.
 */

export type SiteSettingKey =
  | 'shop_mood_main_image'
  | 'shop_mood_top_image'
  | 'shop_mood_bottom_image';

export const DEFAULT_SETTINGS: Record<SiteSettingKey, string> = {
  shop_mood_main_image: '/assets/3.jpg',
  shop_mood_top_image: '/assets/4.jpg',
  shop_mood_bottom_image: '/assets/00.jpg',
};

export type SiteSettings = Record<SiteSettingKey, string>;
