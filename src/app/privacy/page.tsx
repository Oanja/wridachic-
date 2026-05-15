import type { Metadata } from 'next';
import { LegalPage } from '@/components/pages/LegalPage';

export const metadata: Metadata = {
  title: 'Politique de confidentialité',
  description: 'Comment wridachic collecte, utilise et protège vos données personnelles.',
};

export default function Page() {
  return (
    <LegalPage
      eyebrow={{ fr: 'Politique de confidentialité', en: 'Privacy Policy', ar: 'سياسة الخصوصية' }}
      title={{
        fr: 'Confidentialité & données.',
        en: 'Privacy & data.',
        ar: 'الخصوصية والبيانات.',
      }}
      updated="2026-05-10"
      sections={[
        {
          num: '01',
          title: { fr: 'Qui sommes-nous', en: 'Who we are', ar: 'من نحن' },
          body: {
            fr: `wridachic est une marque marocaine de mode féminine. Pour toute question concernant cette politique, contactez-nous à hello@wridachic.com ou via WhatsApp au +212 773-847986.`,
            en: `wridachic is a Moroccan women's fashion brand. For any question about this policy, contact us at hello@wridachic.com or via WhatsApp on +212 773-847986.`,
            ar: `وريدة شيك علامة مغربية للأزياء النسائية. لأي سؤال حول هذه السياسة، تواصلي معنا على hello@wridachic.com أو واتساب +212 773-847986.`,
          },
        },
        {
          num: '02',
          title: { fr: 'Quelles données nous collectons', en: 'What data we collect', ar: 'البيانات التي نجمعها' },
          body: {
            fr: `• Compte : email, nom, mot de passe chiffré.
• Commandes : nom complet, téléphone, adresse de livraison, ville, produits achetés.
• Navigation : pages visitées, panier, favoris (stockés localement).
• Cookies : uniquement si tu acceptes (analytics & mesure d'audience).`,
            en: `• Account: email, name, encrypted password.
• Orders: full name, phone, delivery address, city, purchased products.
• Browsing: pages viewed, cart, wishlist (stored locally).
• Cookies: only if you accept (analytics & audience measurement).`,
            ar: `• الحساب: البريد، الاسم، كلمة السر المشفرة.
• الطلبات: الاسم الكامل، الهاتف، عنوان التوصيل، المدينة، المنتجات المشتراة.
• التصفح: الصفحات المزارة، السلة، المفضلة (محفوظة محلياً).
• ملفات تعريف الارتباط: فقط في حال موافقتك (تحليلات وقياس).`,
          },
        },
        {
          num: '03',
          title: { fr: 'Pourquoi nous les collectons', en: 'Why we collect them', ar: 'لماذا نجمعها' },
          body: {
            fr: `Uniquement pour traiter ta commande, livrer le produit, gérer ton compte et améliorer le service. Aucune donnée n'est vendue.`,
            en: `Only to process your order, deliver the product, manage your account and improve our service. No data is ever sold.`,
            ar: `فقط لمعالجة طلبك، توصيل المنتج، إدارة حسابك وتحسين الخدمة. لا تباع أي بيانات.`,
          },
        },
        {
          num: '04',
          title: { fr: 'Partage avec des tiers', en: 'Sharing with third parties', ar: 'المشاركة مع أطراف ثالثة' },
          body: {
            fr: `Nous utilisons :
• Supabase (hébergement de données — UE)
• Vercel (hébergement du site)
• Resend (envoi d'emails de confirmation)
• Le transporteur de ton choix (pour la livraison)
• Google Analytics & Facebook Pixel (uniquement avec ton consentement)`,
            en: `We use:
• Supabase (data hosting — EU)
• Vercel (site hosting)
• Resend (confirmation emails)
• The courier you select (for delivery)
• Google Analytics & Facebook Pixel (only with your consent)`,
            ar: `نستعمل:
• Supabase (استضافة البيانات — الاتحاد الأوروبي)
• Vercel (استضافة الموقع)
• Resend (إرسال إيميلات التأكيد)
• شركة التوصيل المختارة (للتسليم)
• Google Analytics و Facebook Pixel (فقط بموافقتك)`,
          },
        },
        {
          num: '05',
          title: { fr: 'Tes droits', en: 'Your rights', ar: 'حقوقك' },
          body: {
            fr: `Tu peux à tout moment :
• Consulter tes données (page « Mon compte »)
• Demander leur correction ou leur suppression (hello@wridachic.com)
• Refuser ou retirer ton consentement aux cookies analytics
• Te désinscrire de la newsletter (lien en bas de chaque email)`,
            en: `At any time you can:
• View your data ("My account" page)
• Request correction or deletion (hello@wridachic.com)
• Refuse or withdraw your analytics-cookie consent
• Unsubscribe from the newsletter (link at the bottom of every email)`,
            ar: `يمكنك في أي وقت:
• الاطلاع على بياناتك (صفحة "حسابي")
• طلب تصحيحها أو حذفها (hello@wridachic.com)
• رفض أو سحب موافقتك على ملفات تعريف الارتباط التحليلية
• إلغاء الاشتراك في النشرة (الرابط في أسفل كل إيميل)`,
          },
        },
        {
          num: '06',
          title: { fr: 'Conservation', en: 'Retention', ar: 'مدة الاحتفاظ' },
          body: {
            fr: `Les données de commande sont conservées 5 ans (obligation légale comptable au Maroc). Les comptes inactifs depuis 3 ans peuvent être supprimés sur demande.`,
            en: `Order data is kept for 5 years (Moroccan accounting obligation). Accounts inactive for 3+ years can be deleted on request.`,
            ar: `بيانات الطلبات تُحفظ لمدة 5 سنوات (التزام محاسبي مغربي). الحسابات غير النشطة لأكثر من 3 سنوات يمكن حذفها عند الطلب.`,
          },
        },
      ]}
    />
  );
}
