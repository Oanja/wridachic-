'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Icon } from './Icon';
import { Placeholder } from './Placeholder';
import { TINTS } from '@/lib/data';
import { TR } from '@/lib/i18n';
import type { Lang, Product } from '@/lib/types';

interface PCardProps {
  product: Product;
  lang: Lang;
  onWish: (id: string) => void;
  wished: boolean;
  tint?: string;
  priority?: boolean;
}

export function PCard({ product, lang, onWish, wished, tint, priority = false }: PCardProps) {
  const t = TR[lang];
  const name = lang === 'ar' ? product.nameAr : product.name;
  const fallbackTint = tint ?? TINTS[parseInt(product.id.replace(/\D/g, '') || '0') % TINTS.length];

  return (
    <Link href={`/product/${product.slug}`} className="pcard" style={{ display: 'block', color: 'inherit' }}>
      <div className="pcard-img">
        {product.imgFiles.length > 0 ? (
          <Image
            src={product.imgFiles[0]}
            alt={name}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 33vw, 25vw"
            priority={priority}
            style={{ objectFit: 'cover' }}
          />
        ) : (
          <Placeholder tint={fallbackTint} rose />
        )}

        {product.tag === 'new' && (
          <span className="pcard-tag new">{lang === 'ar' ? 'جديد ✦' : 'Nouveau ✦'}</span>
        )}
        {product.tag === 'best' && (
          <span className="pcard-tag best">{lang === 'ar' ? 'الأكثر مبيعاً ✦' : 'Best-seller ✦'}</span>
        )}
        {product.tag === 'sale' && (
          <span className="pcard-tag sale">
            {product.oldPrice
              ? (lang === 'ar'
                  ? `خصم −${Math.round((1 - product.price / product.oldPrice) * 100)}%`
                  : `−${Math.round((1 - product.price / product.oldPrice) * 100)}%`)
              : (lang === 'ar' ? 'تخفيض ✦' : 'Promo ✦')}
          </span>
        )}

        <button
          type="button"
          className={`pcard-wish ${wished ? 'on' : ''}`}
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); onWish(product.id); }}
          aria-label={t.product.wishlist}
        >
          <Icon n="heart" s={14} />
        </button>
        <div className="pcard-quick">+ {t.product.add}</div>
      </div>

      <div>
        <div className="pcard-name">{name}</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
          <div className="pcard-colors">
            {product.colors.map((c, i) => <span key={i} style={{ background: c }} />)}
          </div>
          <div className="pcard-price">
            {product.oldPrice && <span className="old">{product.oldPrice}</span>}
            {product.price} <span style={{ fontSize: 10, opacity: 0.5 }}>MAD</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
