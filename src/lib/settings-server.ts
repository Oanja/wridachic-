import { cache } from 'react';
import { getSupabaseStatic } from './supabase/static';
import { DEFAULT_SETTINGS, type SiteSettingKey, type SiteSettings } from './settings';

/**
 * Server-only fetcher for site settings. Falls back to defaults on any
 * error (missing table, unreachable Supabase, etc.) so the homepage
 * never blocks on this.
 */
export const getSiteSettings = cache(async (): Promise<SiteSettings> => {
  try {
    const sb = getSupabaseStatic();
    const { data, error } = await sb.from('site_settings').select('key, value');
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
