'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { AppHeader } from '../../../components/app-header';
import { useLocale } from '../../../lib/locale';
import { apiGet, apiPost } from '../../../lib/api';
import { useToast } from '../../../lib/toast';
import { getZmpLocation } from '../../../lib/zmp';
import { CheckIcon, MapPinIcon, QrCodeIcon, XIcon } from '../../../components/icons';

interface CheckinResult {
  ok: boolean;
  message: string;
  badge?: string;
}

interface PoiPreview {
  id: string;
  slug: string;
  title: string;
  longDescription: string;
  category: string;
  imageUrl?: string;
  latitude: number | null;
  longitude: number | null;
  error?: string;
}

function CheckinInner() {
  const { locale, t } = useLocale();
  const toast = useToast();
  const search = useSearchParams();
  const presetPoi = search.get('poi') ?? '';
  const presetQr = search.get('qr') ?? '';
  const [poiSlug, setPoiSlug] = useState(presetPoi);
  const [qrValue, setQrValue] = useState(presetQr);
  const [poi, setPoi] = useState<PoiPreview | null>(null);
  const [poiLoading, setPoiLoading] = useState(false);
  const [result, setResult] = useState<CheckinResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const autoSubmitFromQr = !!(presetPoi && presetQr);

  useEffect(() => {
    let alive = true;
    getZmpLocation().then((loc) => {
      if (!alive || !loc) return;
      setCoords({ lat: loc.latitude, lng: loc.longitude });
    });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (!poiSlug.trim()) {
      setPoi(null);
      return;
    }
    let alive = true;
    setPoiLoading(true);
    apiGet<PoiPreview>(`/content/poi/${poiSlug.trim()}`, locale)
      .then((data) => alive && setPoi(data.error ? null : data))
      .catch(() => alive && setPoi(null))
      .finally(() => alive && setPoiLoading(false));
    return () => {
      alive = false;
    };
  }, [poiSlug, locale]);

  const submit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setLoading(true);
    setResult(null);
    try {
      const res = await apiPost<CheckinResult>(
        '/checkins',
        { poiSlug, qrValue, coords },
        locale,
      );
      setResult(res);
      toast.show(res.ok ? t('checkin.success') : t('checkin.fail'), res.ok ? 'success' : 'error');
    } catch (err) {
      const msg = (err as Error).message;
      setResult({ ok: false, message: msg });
      toast.show(t('checkin.fail'), 'error');
    } finally {
      setLoading(false);
    }
  };

  // Auto-submit when both ?poi & ?qr came from a scan, GPS is ready and POI loaded.
  useEffect(() => {
    if (!autoSubmitFromQr) return;
    if (!coords || !poi || poi.error) return;
    if (loading || result) return;
    submit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoSubmitFromQr, coords, poi]);

  return (
    <>
      <AppHeader title={t('checkin.title')} showBack />
      {poiSlug && (
        <section className="section">
          {poiLoading ? (
            <div className="empty">{t('common.loading')}</div>
          ) : poi ? (
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              {poi.imageUrl && (
                <img
                  src={poi.imageUrl}
                  alt={poi.title}
                  style={{ width: '100%', aspectRatio: '16 / 9', objectFit: 'cover' }}
                />
              )}
              <div style={{ padding: 14 }}>
                <span
                  style={{
                    display: 'inline-block',
                    fontSize: 11,
                    color: 'var(--text-muted)',
                    textTransform: 'uppercase',
                    letterSpacing: 0.4,
                  }}
                >
                  {poi.category}
                </span>
                <h2 style={{ margin: '4px 0 6px', fontSize: 17 }}>{poi.title}</h2>
                {poi.longDescription && (
                  <p
                    style={{
                      margin: 0,
                      fontSize: 13,
                      color: 'var(--text-secondary)',
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {poi.longDescription}
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="empty">{t('common.empty')}</div>
          )}
        </section>
      )}
      <form className="card" onSubmit={submit}>
        <div className="field">
          <label className="field-label">POI slug</label>
          <input
            className="input"
            value={poiSlug}
            onChange={(e) => setPoiSlug(e.target.value)}
            placeholder="ba-den-peak"
            required
          />
        </div>
        <div className="field">
          <label className="field-label">{t('checkin.scan')}</label>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              className="input"
              value={qrValue}
              onChange={(e) => setQrValue(e.target.value)}
              placeholder="NBD-PEAK-001"
              required
            />
            <button
              type="button"
              className="btn-secondary"
              style={{ width: 'auto', padding: '0 14px', borderRadius: 12, display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 600 }}
              aria-label="Scan QR"
            >
              <QrCodeIcon size={16} />
              QR
            </button>
          </div>
        </div>
        <div className="field">
          <label className="field-label">GPS</label>
          <div className="card" style={{ padding: 12, fontSize: 13, display: 'flex', gap: 8, alignItems: 'center' }}>
            <MapPinIcon size={16} />
            <span>
              {coords
                ? `${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}`
                : locale === 'vi'
                ? 'Đang lấy vị trí...'
                : 'Acquiring location...'}
            </span>
          </div>
        </div>
        <button className="btn" type="submit" disabled={loading || !coords}>
          <CheckIcon size={18} />
          <span>{loading ? t('common.loading') : t('checkin.title')}</span>
        </button>
      </form>
      {result && (
        <div
          className="card"
          style={{
            marginTop: 16,
            background: result.ok ? '#ecfdf5' : '#fef2f2',
            borderColor: result.ok ? '#a7f3d0' : '#fecaca',
            color: result.ok ? '#047857' : '#b91c1c',
          }}
        >
          <strong style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {result.ok ? <CheckIcon size={16} /> : <XIcon size={16} />}
            <span>{result.ok ? t('checkin.success') : t('checkin.fail')}</span>
          </strong>
          <p style={{ margin: '6px 0 0', fontSize: 13 }}>{result.message}</p>
          {result.badge && (
            <p style={{ margin: '6px 0 0', fontSize: 13, fontWeight: 600 }}>{result.badge}</p>
          )}
        </div>
      )}
    </>
  );
}

export default function CheckinPage() {
  return (
    <Suspense fallback={<div className="empty">...</div>}>
      <CheckinInner />
    </Suspense>
  );
}
