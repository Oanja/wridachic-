import { NextResponse } from 'next/server';

const GRAPH_VERSION = process.env.WHATSAPP_GRAPH_VERSION || 'v21.0';
const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN;

function pickWabaId(value: unknown) {
  if (!value || typeof value !== 'object') return undefined;
  const record = value as Record<string, unknown>;
  const direct = record.whatsapp_business_account_id ?? record.waba_id;
  if (typeof direct === 'string') return direct;
  const nested = record.whatsapp_business_account;
  if (nested && typeof nested === 'object') {
    const id = (nested as Record<string, unknown>).id;
    if (typeof id === 'string') return id;
  }
  return undefined;
}

async function graphGet(path: string) {
  const res = await fetch(`https://graph.facebook.com/${GRAPH_VERSION}/${path}`, {
    headers: { Authorization: `Bearer ${ACCESS_TOKEN}` },
    cache: 'no-store',
  });
  const text = await res.text();
  let json: unknown = text;
  try {
    json = JSON.parse(text);
  } catch {}
  return { ok: res.ok, status: res.status, json };
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  if (!VERIFY_TOKEN || searchParams.get('token') !== VERIFY_TOKEN) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  }

  if (!ACCESS_TOKEN || !PHONE_NUMBER_ID) {
    return NextResponse.json({ ok: false, error: 'missing-whatsapp-env' }, { status: 500 });
  }

  const phone = await graphGet(`${PHONE_NUMBER_ID}?fields=id,display_phone_number,verified_name,whatsapp_business_account_id`);
  if (!phone.ok) return NextResponse.json({ ok: false, step: 'phone', response: phone }, { status: 502 });

  const wabaId = pickWabaId(phone.json);
  if (!wabaId) {
    return NextResponse.json({ ok: false, error: 'missing-waba-id', phone: phone.json }, { status: 502 });
  }

  const templates = await graphGet(
    `${wabaId}/message_templates?fields=name,language,status,category&limit=100`,
  );
  if (!templates.ok) {
    return NextResponse.json({ ok: false, step: 'templates', phone: phone.json, response: templates }, { status: 502 });
  }

  return NextResponse.json({
    ok: true,
    phone: phone.json,
    templates: templates.json,
    configured: {
      templateName: process.env.WHATSAPP_ORDER_TEMPLATE_NAME,
      templateLang: process.env.WHATSAPP_ORDER_TEMPLATE_LANG,
    },
  });
}
