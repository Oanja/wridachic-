import type { Metadata } from 'next';
import { LegalPage } from '@/components/pages/LegalPage';

export const metadata: Metadata = {
  title: 'Data deletion instructions',
  description: 'How to request deletion of your WridaChic account and personal data.',
};

export default function Page() {
  return (
    <LegalPage
      eyebrow={{ fr: 'Suppression des donnees', en: 'Data Deletion', ar: 'حذف البيانات' }}
      title={{
        fr: 'Demander la suppression de vos donnees.',
        en: 'Request deletion of your data.',
        ar: 'طلب حذف بياناتك.',
      }}
      updated="2026-05-14"
      sections={[
        {
          num: '01',
          title: { fr: 'Comment faire la demande', en: 'How to request deletion', ar: 'كيفية طلب الحذف' },
          body: {
            fr: `Pour demander la suppression de votre compte WridaChic ou de vos donnees personnelles, envoyez-nous un email a contact@wridachic.com avec l'objet "Suppression de donnees". Vous pouvez aussi nous contacter sur WhatsApp au +212 773-847986.`,
            en: `To request deletion of your WridaChic account or personal data, email us at contact@wridachic.com with the subject "Data deletion". You can also contact us on WhatsApp at +212 773-847986.`,
            ar: `لطلب حذف حسابك في WridaChic أو بياناتك الشخصية، راسلنا على contact@wridachic.com بعنوان "حذف البيانات". يمكنك أيضا التواصل معنا عبر واتساب على +212 773-847986.`,
          },
        },
        {
          num: '02',
          title: { fr: 'Informations a fournir', en: 'Information to include', ar: 'المعلومات المطلوبة' },
          body: {
            fr: `Merci d'inclure :
- Votre nom complet
- L'email ou le numero de telephone utilise sur le site
- Le numero de commande si la demande concerne une commande
- Une courte confirmation que vous souhaitez supprimer vos donnees`,
            en: `Please include:
- Your full name
- The email or phone number used on the website
- Your order number if the request is related to an order
- A short confirmation that you want your data deleted`,
            ar: `يرجى إرسال:
- الاسم الكامل
- البريد الإلكتروني أو رقم الهاتف المستعمل في الموقع
- رقم الطلب إذا كان الطلب متعلق بطلبية
- تأكيد قصير بأنك تريد حذف بياناتك`,
          },
        },
        {
          num: '03',
          title: { fr: 'Delai de traitement', en: 'Processing time', ar: 'مدة المعالجة' },
          body: {
            fr: `Nous traiterons votre demande dans un delai maximum de 30 jours. Si nous avons besoin d'informations supplementaires pour verifier votre identite, nous vous contacterons avant de supprimer les donnees.`,
            en: `We will process your request within a maximum of 30 days. If we need additional information to verify your identity, we will contact you before deleting the data.`,
            ar: `سنعالج طلبك في مدة لا تتجاوز 30 يوما. إذا احتجنا معلومات إضافية للتحقق من هويتك، سنتواصل معك قبل حذف البيانات.`,
          },
        },
        {
          num: '04',
          title: { fr: 'Donnees pouvant etre conservees', en: 'Data we may retain', ar: 'البيانات التي قد نحتفظ بها' },
          body: {
            fr: `Certaines informations de commande, de paiement, de livraison ou de comptabilite peuvent etre conservees lorsque la loi l'exige, notamment pour les obligations fiscales, comptables, de prevention de fraude ou de service apres-vente. Ces donnees seront limitees a ce qui est strictement necessaire.`,
            en: `Some order, payment, delivery or accounting information may be retained when required by law, including for tax, accounting, fraud prevention or customer support obligations. This data will be limited to what is strictly necessary.`,
            ar: `قد نحتفظ ببعض معلومات الطلبات أو الأداء أو التوصيل أو المحاسبة إذا كان القانون يفرض ذلك، مثل الالتزامات الضريبية والمحاسبية ومنع الاحتيال وخدمة ما بعد البيع. سيتم الاحتفاظ فقط بما هو ضروري.`,
          },
        },
        {
          num: '05',
          title: { fr: 'Confirmation', en: 'Confirmation', ar: 'التأكيد' },
          body: {
            fr: `Une fois la demande traitee, nous vous enverrons une confirmation par email ou par WhatsApp.`,
            en: `Once the request has been processed, we will send you a confirmation by email or WhatsApp.`,
            ar: `بعد معالجة الطلب، سنرسل لك تأكيدا عبر البريد الإلكتروني أو واتساب.`,
          },
        },
      ]}
    />
  );
}
