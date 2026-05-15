import type { Metadata } from 'next';
import { LegalPage } from '@/components/pages/LegalPage';

export const metadata: Metadata = {
  title: 'Conditions générales de vente',
  description: 'Les conditions générales de vente de wridachic.com.',
};

export default function Page() {
  return (
    <LegalPage
      eyebrow={{ fr: 'Conditions de vente', en: 'Terms of Sale', ar: 'شروط البيع' }}
      title={{
        fr: 'Conditions générales.',
        en: 'Terms & conditions.',
        ar: 'الشروط العامة.',
      }}
      updated="2026-05-10"
      sections={[
        {
          num: '01',
          title: { fr: 'Le vendeur', en: 'The seller', ar: 'البائع' },
          body: {
            fr: `wridachic — marque marocaine de mode féminine, basée à Casablanca.
Email : hello@wridachic.com — WhatsApp : +212 773-847986.
Toute commande passée sur wridachic.com implique l'acceptation des présentes conditions.`,
            en: `wridachic — Moroccan women's fashion brand, based in Casablanca.
Email: hello@wridachic.com — WhatsApp: +212 773-847986.
Any order placed on wridachic.com implies acceptance of these terms.`,
            ar: `وريدة شيك — علامة مغربية للأزياء النسائية، مقرها الدار البيضاء.
البريد: hello@wridachic.com — واتساب: ‎+212 773-847986‎.
أي طلب على wridachic.com يعني قبول هذه الشروط.`,
          },
        },
        {
          num: '02',
          title: { fr: 'Produits & prix', en: 'Products & prices', ar: 'المنتجات والأسعار' },
          body: {
            fr: `• Les prix sont indiqués en Dirhams (MAD), toutes taxes comprises.
• Les photos sont les plus fidèles possible mais des différences mineures peuvent exister.
• wridachic se réserve le droit de modifier ses prix à tout moment. Le prix appliqué est celui en vigueur au moment de la commande.`,
            en: `• Prices are in Moroccan Dirhams (MAD), all taxes included.
• Photos are as accurate as possible but minor differences may exist.
• wridachic reserves the right to change prices at any time. The applied price is the one valid at order time.`,
            ar: `• الأسعار بالدرهم المغربي، شاملة لكل الضرائب.
• الصور دقيقة قدر الإمكان ولكن قد توجد اختلافات طفيفة.
• تحتفظ وريدة شيك بحق تغيير الأسعار في أي وقت. السعر المطبق هو الساري وقت الطلب.`,
          },
        },
        {
          num: '03',
          title: { fr: 'Commande', en: 'Order', ar: 'الطلب' },
          body: {
            fr: `La commande est validée après confirmation par téléphone ou WhatsApp dans les 24h. Tu peux annuler une commande tant qu'elle n'a pas été expédiée.`,
            en: `Your order is confirmed after a phone or WhatsApp call within 24 hours. You can cancel as long as the order has not been shipped.`,
            ar: `يتم تأكيد طلبك عبر مكالمة هاتفية أو واتساب خلال 24 ساعة. يمكنك الإلغاء طالما لم يتم الشحن.`,
          },
        },
        {
          num: '04',
          title: { fr: 'Paiement', en: 'Payment', ar: 'الدفع' },
          body: {
            fr: `Paiement à la livraison (COD) en espèces. Le paiement en ligne par carte sera disponible prochainement.`,
            en: `Cash on delivery (COD). Online card payment will be available soon.`,
            ar: `الدفع عند التسليم نقداً. الدفع عبر البطاقة البنكية متاح قريباً.`,
          },
        },
        {
          num: '05',
          title: { fr: 'Livraison', en: 'Delivery', ar: 'التوصيل' },
          body: {
            fr: `• Livraison partout au Maroc en 24 à 48h après confirmation.
• Frais de livraison : 35 MAD, offerts dès 500 MAD d'achat.
• Si la livraison échoue (absence, mauvaise adresse), nous te recontactons pour reprogrammer.`,
            en: `• Delivery anywhere in Morocco within 24 to 48 hours after confirmation.
• Shipping: 35 MAD, free over 500 MAD.
• If delivery fails (absent, wrong address), we will reach out to reschedule.`,
            ar: `• التوصيل في كل المغرب خلال 24 إلى 48 ساعة بعد التأكيد.
• تكلفة التوصيل: 35 درهم، مجاناً ابتداءً من 500 درهم.
• إذا فشل التوصيل (غياب، عنوان غير صحيح)، نتواصل معك لإعادة الجدولة.`,
          },
        },
        {
          num: '06',
          title: { fr: 'Retours & remboursement', en: 'Returns & refunds', ar: 'الإرجاع والاسترجاع' },
          body: {
            fr: `Voir notre page « Retours » dédiée pour le détail. En résumé : 14 jours pour retourner, article intact avec étiquette, remboursement par virement bancaire dans les 14 jours suivant la réception du colis retourné.`,
            en: `See our dedicated "Returns" page for details. Summary: 14 days to return, item intact with tag, refund by bank transfer within 14 days of receiving the returned parcel.`,
            ar: `راجعي صفحة "الإرجاع" المخصصة للتفاصيل. باختصار: 14 يوماً للإرجاع، القطعة سليمة مع البطاقة، استرجاع المبلغ عبر تحويل بنكي خلال 14 يوماً من استلام الطرد المرتجع.`,
          },
        },
        {
          num: '07',
          title: { fr: 'Litiges', en: 'Disputes', ar: 'النزاعات' },
          body: {
            fr: `Tout litige sera traité en priorité à l'amiable. À défaut, la loi marocaine s'applique et les tribunaux de Casablanca sont seuls compétents.`,
            en: `Any dispute will be addressed amicably first. Failing that, Moroccan law applies and the courts of Casablanca have sole jurisdiction.`,
            ar: `يتم التعامل مع أي نزاع ودياً أولاً. في حال التعذر، يسري القانون المغربي وتختص محاكم الدار البيضاء وحدها.`,
          },
        },
      ]}
    />
  );
}
