'use client';

import { useApp } from '@/store/AppContext';
import { pick } from '@/lib/i18n';
import { Icon } from './Icon';

export function WaFloat() {
  const { lang } = useApp();
  return (
    <a className="wafloat2" href="https://wa.me/212773847986" target="_blank" rel="noopener noreferrer">
      <Icon n="wa" s={18} />
      <span className="wa-label">{pick(lang, 'Commander via WhatsApp', 'Order via WhatsApp', 'اطلبي عبر واتساب')}</span>
    </a>
  );
}
