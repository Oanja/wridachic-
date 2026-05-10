import type { Metadata } from 'next';
import { LegalPage } from '@/components/pages/LegalPage';

export const metadata: Metadata = {
  title: 'Politique de retour',
  description: 'Retours acceptés sous 14 jours chez wridachic. Conditions et procédure.',
};

export default function Page() {
  return (
    <LegalPage
      eyebrow={{ fr: 'Retours & remboursements', en: 'Returns & refunds', ar: 'الإرجاع والاسترجاع' }}
      title={{
        fr: 'Retours simples,\nsans souci.',
        en: 'Easy returns,\nno hassle.',
        ar: 'إرجاع سهل،\nبدون متاعب.',
      }}
      updated="2026-05-10"
      sections={[
        {
          num: '01',
          title: { fr: 'Délai', en: 'Time frame', ar: 'المدة' },
          body: {
            fr: `Tu as 14 jours à compter de la réception du colis pour nous renvoyer un article qui ne te convient pas.`,
            en: `You have 14 days from receiving the parcel to send back an item that doesn't suit you.`,
            ar: `لديك 14 يوماً من استلام الطرد لإرجاع قطعة لا تناسبك.`,
          },
        },
        {
          num: '02',
          title: { fr: 'Conditions', en: 'Conditions', ar: 'الشروط' },
          body: {
            fr: `• Article non porté, non lavé, non endommagé.
• Étiquette d'origine encore attachée.
• Emballage d'origine si possible.
• Pour des raisons d'hygiène, les sous-vêtements et accessoires personnels ne sont pas repris.`,
            en: `• Item not worn, washed or damaged.
• Original tag still attached.
• Original packaging if possible.
• For hygiene reasons, underwear and personal accessories cannot be returned.`,
            ar: `• القطعة غير مرتداة، غير مغسولة، غير متضررة.
• البطاقة الأصلية لا تزال مثبتة.
• التغليف الأصلي إن أمكن.
• لأسباب صحية، لا نقبل إرجاع الملابس الداخلية والإكسسوارات الشخصية.`,
          },
        },
        {
          num: '03',
          title: { fr: 'Procédure', en: 'How to', ar: 'الخطوات' },
          body: {
            fr: `1. Écris-nous par WhatsApp (+212 7 72 08 65 45) ou email (hello@wridachic.com) avec ton numéro de commande.
2. On te confirme l'adresse de retour et la procédure.
3. Tu envoies le colis (les frais d'envoi du retour sont à ta charge, sauf si l'article est défectueux).
4. Dès réception, on vérifie et on procède au remboursement.`,
            en: `1. Message us on WhatsApp (+212 7 72 08 65 45) or email (hello@wridachic.com) with your order number.
2. We confirm the return address and procedure.
3. You ship the parcel (return shipping is at your cost, unless the item is defective).
4. Upon receipt, we check the item and process the refund.`,
            ar: `1. تواصلي معنا واتساب (+212 7 72 08 65 45) أو إيميل (hello@wridachic.com) برقم طلبك.
2. نؤكد لك عنوان الإرجاع والإجراء.
3. تشحنين الطرد (تكلفة الشحن المرتجع عليك، إلا إذا كانت القطعة بها عيب).
4. بعد الاستلام، نتحقق ونرد المبلغ.`,
          },
        },
        {
          num: '04',
          title: { fr: 'Remboursement', en: 'Refund', ar: 'الاسترجاع' },
          body: {
            fr: `Le remboursement est effectué par virement bancaire (RIB à fournir) dans les 14 jours suivant la réception du colis retourné. Les frais de livraison initiaux ne sont pas remboursés sauf erreur de notre part.`,
            en: `Refund is issued via bank transfer (provide your bank details) within 14 days of receiving the returned parcel. The initial shipping fee is not refunded unless the return is due to our error.`,
            ar: `يتم رد المبلغ عبر تحويل بنكي (تزويدنا بـ RIB) خلال 14 يوماً من استلام الطرد المرتجع. لا يتم استرجاع تكلفة التوصيل الأولية إلا إذا كان الخطأ من جهتنا.`,
          },
        },
        {
          num: '05',
          title: { fr: 'Échange', en: 'Exchange', ar: 'الاستبدال' },
          body: {
            fr: `Tu peux échanger ton article contre une autre taille ou couleur dans la même gamme de prix. Contactez-nous d'abord pour vérifier la disponibilité.`,
            en: `You can exchange your item for another size or colour in the same price range. Contact us first to check availability.`,
            ar: `يمكنك استبدال القطعة بمقاس أو لون آخر في نفس فئة السعر. تواصلي معنا أولاً للتأكد من التوفر.`,
          },
        },
      ]}
    />
  );
}
