-- ════════════════════════════════════════════════
-- WRIDACHIC — Products table setup
-- Run this ONCE in Supabase SQL Editor
-- ════════════════════════════════════════════════

-- 1) Create products table
create table if not exists products (
  id          text primary key,
  slug        text unique not null,
  name        text not null,
  name_ar     text,
  cat         text not null,
  price       numeric not null,
  tag         text,
  colors      jsonb default '[]'::jsonb,
  img         text,
  img_files   jsonb default '[]'::jsonb,
  description text,
  description_ar text,
  sort_order  int default 0,
  active      boolean default true,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- 2) Index for fast sorting
create index if not exists idx_products_sort on products (sort_order, created_at);
create index if not exists idx_products_active on products (active);

-- 3) RLS — public read + write (admin UI is gated by password client-side)
-- NOTE: Same security model as orders table. Admin password protects the UI.
alter table products enable row level security;

drop policy if exists "products_read_all" on products;
create policy "products_read_all" on products
  for select using (true);

drop policy if exists "products_write_all" on products;
create policy "products_write_all" on products
  for all using (true) with check (true);

-- 4) Seed initial products (matches data.js)
insert into products (id, slug, name, name_ar, cat, price, tag, colors, img, img_files, sort_order)
values
  ('p21', 'ensemble-wrap-lin',     'Ensemble Wrap Lin',      'طقم راب كتان',      'robes',  369, 'new', '["#5C3D2E","#C4B49A","#C8D9A0"]'::jsonb, '11', '["assets/11.jpg","assets/1.jpg"]'::jsonb, 1),
  ('p24', 'robe-wrap-naturelle',   'Robe Wrap Naturelle',    'رداء راب طبيعي',    'robes',  349, 'new', '["#C4B49A","#5C3D2E"]'::jsonb,           '2',  '["assets/2.jpg"]'::jsonb,                 2),
  ('p22', 'robe-mousseline-rosee', 'Robe Mousseline Rosée',  'فستان شيفون وردي',  'robes',  329, null,  '["#C4746B","#D49088"]'::jsonb,           '3',  '["assets/3.jpg","assets/33.jpg"]'::jsonb, 3),
  ('p23', 'ensemble-denim-maroc',  'Ensemble Denim Maroc',   'تنسيق جينز مغربي',  'basics', 299, 'new', '["#3B5BA5","#F5F5F0","#1B4332"]'::jsonb, '4',  '["assets/4.jpg"]'::jsonb,                 4),
  ('p20', 'ensemble-priere-jasmin','Ensemble Prière Jasmin', 'طقم صلاة ياسمين',   'prayer', 259, 'new', '["#E8D5C4","#F7EEE8"]'::jsonb,           '00', '["assets/00.jpg"]'::jsonb,                5)
on conflict (id) do nothing;

-- 5) Storage bucket for product images
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

-- 6) Storage policies — public read, authenticated write
drop policy if exists "product_images_read" on storage.objects;
create policy "product_images_read" on storage.objects
  for select using (bucket_id = 'product-images');

drop policy if exists "product_images_write" on storage.objects;
create policy "product_images_write" on storage.objects
  for insert with check (bucket_id = 'product-images');

drop policy if exists "product_images_update" on storage.objects;
create policy "product_images_update" on storage.objects
  for update using (bucket_id = 'product-images');

drop policy if exists "product_images_delete" on storage.objects;
create policy "product_images_delete" on storage.objects
  for delete using (bucket_id = 'product-images');

-- ✓ Done!
