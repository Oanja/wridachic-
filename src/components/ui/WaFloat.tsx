'use client';

import { useApp } from '@/store/AppContext';
import { Icon } from './Icon';

export function WaFloat() {
  const { lang } = useApp();
  return (
    <a className="wafloat2" href="https://wa.me/212772086545" target="_blank" rel="noopener noreferrer">
      <Icon n="wa" s={18} />
      <span className="wa-label">{lang !== 'ar' ? 'Commander via WhatsApp' : 'اطلبي عبر واتساب'}</span>
    </a>
  );
}
