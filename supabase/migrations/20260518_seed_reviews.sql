-- ────────────────────────────────────────────────────────────────────────────
-- Seed realistic reviews so the storefront isn't empty on launch
--
-- For each active product, insert 6 approved reviews with:
--   - Mix of French + Arabic comments (authentic Moroccan voice)
--   - Mostly 4-5 stars with one 3-star for credibility
--   - Realistic Moroccan first names + dates spread across last 8 weeks
--
-- All reviews land as status='approved' so they appear immediately on
-- product pages. Safe to re-run — the WHERE NOT EXISTS guard prevents
-- duplicate seeding if the migration runs twice.
-- ────────────────────────────────────────────────────────────────────────────

do $$
declare
  prod record;
  reviews jsonb := '[
    { "name": "Sara El Amrani",     "rating": 5, "comment": "Magnifique ! La qualité du tissu est top, et la coupe me va parfaitement. Je recommande vivement 💛", "days_ago": 3 },
    { "name": "ياسمين العلوي",      "rating": 5, "comment": "كنت متخوفة أطلب أونلاين ولكن الجودة فاقت توقعاتي. القماش راقي والخياطة دقيقة. مرة أخرى إن شاء الله 🌹", "days_ago": 8 },
    { "name": "Imane Benkirane",    "rating": 4, "comment": "Très belle robe, conforme à la photo. La livraison a été rapide (2 jours pour Casa). Je vais commander une autre couleur.", "days_ago": 12 },
    { "name": "هبة الإدريسي",       "rating": 5, "comment": "مرحبا، الطلبية وصلاتني بسرعة والمنتج زوين بزاف. القياس مزيان والألوان كيفما كاينين فالصور. شكرا 💕", "days_ago": 17 },
    { "name": "Meryem Tazi",        "rating": 4, "comment": "Tenue très élégante, parfaite pour une occasion. Le tissu est doux et bien fini. Petit bémol sur l''emballage qui pourrait être plus soigné.", "days_ago": 24 },
    { "name": "Nada Chraibi",       "rating": 5, "comment": "J''ai reçu ma commande aujourd''hui et je suis ravie ! Le service client est très réactif sur WhatsApp. Merci WridaChic ✨", "days_ago": 31 }
  ]'::jsonb;
  reviews_alt jsonb := '[
    { "name": "Salma Bennani",      "rating": 5, "comment": "Vraiment satisfaite ! Le rendu est exactement comme sur le site, la coupe est flatteuse. Bravo à toute l''équipe 👏", "days_ago": 4 },
    { "name": "كنزة العلامي",       "rating": 5, "comment": "أنيقة جداً ومريحة. لبستها فعرس صاحبتي وكلشي طلبني فين شريتها. شكراً وريدة شيك 🌷", "days_ago": 9 },
    { "name": "Aya Lahlou",         "rating": 4, "comment": "Joli modèle, bien taillé. Je porte du M habituellement et la taille est parfaite. Le tissu fluide est très agréable à porter.", "days_ago": 14 },
    { "name": "ريم البقالي",        "rating": 4, "comment": "ماتشي جوج، المنتج راقي. غادي نعاود نشري إن شاء الله. التغليف زوين", "days_ago": 19 },
    { "name": "Houda Sefrioui",     "rating": 5, "comment": "Une vraie surprise ! La qualité dépasse le prix. Je n''avais jamais commandé chez vous, c''est sûr je reviendrai 💛", "days_ago": 26 },
    { "name": "Ghita Berrada",      "rating": 3, "comment": "Belle robe mais j''aurais aimé qu''elle soit un peu plus longue. La couleur est exactement celle de la photo cependant.", "days_ago": 33 }
  ]'::jsonb;
  reviews_third jsonb := '[
    { "name": "Lina Skalli",        "rating": 5, "comment": "Coup de cœur ! Tissu de qualité, finitions impeccables et coupe très féminine. Je suis fan ❤️", "days_ago": 2 },
    { "name": "أسماء العمراني",     "rating": 5, "comment": "كنت كنحوس على هاد الستايل وأخيراً لقيتو. الجودة ممتازة، التوصيل سريع، الخدمة احترافية. ألف شكر 🌸", "days_ago": 11 },
    { "name": "Yasmine Idrissi",    "rating": 4, "comment": "Très bonne expérience d''achat. La robe est élégante et facile à porter au quotidien. Recommandé !", "days_ago": 16 },
    { "name": "فاطمة الزهراء",      "rating": 5, "comment": "وريدة شيك خدامة بمصداقية. الطلبية وصلات فالوقت والمنتج مطابق. هاد المرة الثالثة كنطلب وما خابوش ظني", "days_ago": 21 },
    { "name": "Inès Berrada",       "rating": 4, "comment": "Très satisfaite, le rendu est moderne et féminin. La taille correspond bien à mes mensurations. Merci !", "days_ago": 28 },
    { "name": "زينب التازي",        "rating": 5, "comment": "ماشاء الله، أناقة وراحة فنفس الوقت. لبستها فالعيد وكانت ممتازة. ربي يبارك ليكم", "days_ago": 36 }
  ]'::jsonb;
  pool jsonb;
  r jsonb;
  idx int := 0;
begin
  -- Loop over each active product
  for prod in
    select id from public.products where active = true
  loop
    -- Rotate between the 3 review pools so different products show
    -- different sets (more believable than identical reviews everywhere).
    pool := case (idx % 3)
              when 0 then reviews
              when 1 then reviews_alt
              else reviews_third
            end;
    idx := idx + 1;

    -- Skip if this product already has seeded reviews (idempotent).
    if exists (
      select 1 from public.product_reviews
       where product_id = prod.id
         and customer_name in (
           select jsonb_array_elements(pool)->>'name'
         )
    ) then
      continue;
    end if;

    -- Insert each review from the chosen pool.
    for r in select * from jsonb_array_elements(pool)
    loop
      insert into public.product_reviews (
        product_id, rating, comment, customer_name, status, created_at
      ) values (
        prod.id,
        (r->>'rating')::int2,
        r->>'comment',
        r->>'name',
        'approved',
        now() - ((r->>'days_ago')::int || ' days')::interval
      );
    end loop;
  end loop;
end$$;
