import { cache } from 'react';
import { getSupabaseServer } from './supabase/server';

/**
 * Site-wide editable settings, stored as key/value rows in Supabase. Used
 * for things the admin wants to swap without redeploying — currently just
 * the 3 "Shop by mood" images, but the same shape can hold future homepage
 * art, hero text overrides, etc.
 *
 * Defaults below are returned whenever a key is missing OR Supabase is
 * unreachable, so the homepage never breaks on a fresh project.
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

export const getSiteSettings = cache(async (): Promise<SiteSettings> => {
  try {
    const sb = await getSupabaseServer();
    const { data, error } = await sb
      .from('site_settings')
      .select('key, value');
    if (error || !data) return { ...DEFAULT_SETTINGS };
    const out: SiteSettings = { ...DEFAULT_SETTINGS };
    for (const row of data as Array<{ key: string; value: string }>) {
      if (row.key in DEFAULT_SETTINGS && row.value) {
        out[row.key as SiteSettingKey] = row.value;
      }
    }
    return out;
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
});
