'use client';

import { useApp } from '@/store/AppContext';

export function Toast() {
  const { toast } = useApp();
  if (!toast) return null;
  return (
    <>
      <div
        role="status"
        style={{
          position: 'fixed', top: 24, left: '50%', zIndex: 9999,
          transform: 'translateX(-50%)',
          background: toast.type === 'ok' ? '#2E7D32' : '#C62828',
          color: '#fff', padding: '14px 26px', borderRadius: 999,
          fontSize: 14, fontWeight: 500,
          boxShadow: '0 10px 28px rgba(0,0,0,0.22)',
          animation: 'toastIn .25s ease',
          maxWidth: 'calc(100vw - 32px)', textAlign: 'center',
          fontFamily: 'Space Grotesk, sans-serif',
        }}
      >
        {toast.msg}
      </div>
      <style>{`@keyframes toastIn{from{opacity:0;transform:translate(-50%,-12px)}to{opacity:1;transform:translate(-50%,0)}}`}</style>
    </>
  );
}
