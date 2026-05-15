import type { Product, Category } from './types';

export const FALLBACK_PRODUCTS: Product[] = [
  { id: 'p21', slug: 'ensemble-wrap-lin',     name: 'Ensemble Wrap Lin',      nameAr: 'طقم راب كتان',     cat: 'robes',  price: 369, tag: 'new', colors: ['#5C3D2E','#C4B49A','#C8D9A0'], img: '11', imgFiles: ['/assets/11.jpg','/assets/1.jpg'] },
  { id: 'p24', slug: 'robe-wrap-naturelle',   name: 'Robe Wrap Naturelle',    nameAr: 'رداء راب طبيعي',   cat: 'robes',  price: 349, tag: 'new', colors: ['#C4B49A','#5C3D2E'],           img: '2',  imgFiles: ['/assets/2.jpg'] },
  { id: 'p22', slug: 'robe-mousseline-rosee', name: 'Robe Mousseline Rosée',  nameAr: 'فستان شيفون وردي', cat: 'robes',  price: 329,             colors: ['#C4746B','#D49088'],           img: '3',  imgFiles: ['/assets/3.jpg','/assets/33.jpg'] },
  { id: 'p23', slug: 'ensemble-denim-maroc',  name: 'Ensemble Denim Maroc',   nameAr: 'تنسيق جينز مغربي', cat: 'basics', price: 299, tag: 'new', colors: ['#3B5BA5','#F5F5F0','#1B4332'], img: '4',  imgFiles: ['/assets/4.jpg'] },
  { id: 'p20', slug: 'ensemble-priere-jasmin',name: 'Ensemble Prière Jasmin', nameAr: 'طقم صلاة ياسمين', cat: 'prayer', price: 259, tag: 'new', colors: ['#E8D5C4','#F7EEE8'],           img: '00', imgFiles: ['/assets/00.jpg'] },
];

// Public-facing categories shown in the /shop & /new category filter tabs.
// Legacy cats (prayer, basics, caftans) are kept in the DB but hidden from
// the storefront filter (see also VISIBLE_CATS in app/shop/page.tsx).
export const CATEGORIES: Category[] = [
  { id: 'robes', name: 'Robes & Ensembles', nameEn: 'Dresses & Sets', nameAr: 'فساتين وأطقم', desc: 'Robes longues, wrap & ensembles', img: 'cat-robes' },
];

export const TINTS = ['rose', 'clay', 'mint', 'lime', 'sky', 'ink'] as const;
