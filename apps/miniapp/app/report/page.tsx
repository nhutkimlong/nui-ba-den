'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { ReportCategory } from '@nui-ba-den/shared';
import { AppHeader } from '../../components/app-header';
import { useLocale } from '../../lib/locale';
import { apiPost, apiUpload } from '../../lib/api';
import { useToast } from '../../lib/toast';
import { getZmpLocation, getZmpPhoneToken } from '../../lib/zmp';
import { ChevronRightIcon, ImageIcon, MapPinIcon, PhoneIcon, SendIcon } from '../../components/icons';

const categories: { id: ReportCategory; key: string }[] = [
  { id: 'service', key: 'report.cat.service' },
  { id: 'security_order', key: 'report.cat.security_order' },
  { id: 'environment', key: 'report.cat.environment' },
  { id: 'other', key: 'report.cat.other' },
];

interface CreateReportResponse {
  id: string;
  code: string;
  status: string;
}

export default function ReportPage() {
  const { locale, t } = useLocale();
  const router = useRouter();
  const toast = useToast();
  const [category, setCategory] = useState<ReportCategory>('service');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoLabel, setPhotoLabel] = useState<string | null>(null);
  const [sharePhone, setSharePhone] = useState(false);
  const [phoneToken, setPhoneToken] = useState<string | null>(null);
  const [phoneRequesting, setPhoneRequesting] = useState(false);

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

  const onPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setPhotoFile(file);
    setPhotoLabel(file ? `${file.name} · ${(file.size / 1024).toFixed(0)} KB` : null);
  };

  const onTogglePhone = async (next: boolean) => {
    setSharePhone(next);
    if (!next) {
      setPhoneToken(null);
      return;
    }
    setPhoneRequesting(true);
    try {
      const tok = await getZmpPhoneToken();
      setPhoneToken(tok);
      if (!tok) {
        setSharePhone(false);
        toast.show(
          locale === 'vi'
            ? 'Không lấy được số điện thoại từ Zalo'
            : 'Could not get phone from Zalo',
          'error',
        );
      }
    } finally {
      setPhoneRequesting(false);
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await apiPost<CreateReportResponse>(
        '/reports',
        {
          category,
          description,
          location,
          coords,
          contactPhoneToken: sharePhone ? phoneToken : undefined,
        },
        locale,
      );
      if (photoFile) {
        toast.show(t('report.attaching'), 'info');
        try {
          await apiUpload(`/reports/${res.code}/attachments`, photoFile, locale);
          toast.show(t('report.attach_done'), 'success');
        } catch {
          toast.show(t('report.attach_fail'), 'error');
        }
      }
      toast.show(t('report.submitted'), 'success');
      router.push(`/report/history/${res.code}`);
    } catch (err) {
      setError((err as Error).message);
      toast.show(t('common.error'), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <AppHeader title={t('report.title')} />
      <section className="section">
        <Link href="/report/history" className="list-row">
          <div className="list-row-body">
            <div className="list-row-title">{t('report.history')}</div>
            <div className="list-row-meta">
              {locale === 'vi' ? 'Theo dõi trạng thái xử lý' : 'Track resolution status'}
            </div>
          </div>
          <span className="list-row-cta" aria-hidden>
            <ChevronRightIcon size={18} />
          </span>
        </Link>
      </section>
      <form className="card" onSubmit={onSubmit}>
        <div className="field">
          <label className="field-label">{t('report.category')}</label>
          <div className="chip-row">
            {categories.map((c) => (
              <button
                type="button"
                key={c.id}
                className={`chip ${category === c.id ? 'chip-active' : ''}`}
                onClick={() => setCategory(c.id)}
              >
                {t(c.key as any)}
              </button>
            ))}
          </div>
        </div>
        <div className="field">
          <label className="field-label">{t('report.description')}</label>
          <textarea
            className="textarea"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />
        </div>
        <div className="field">
          <label className="field-label">{t('report.location')}</label>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              className="input"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder={
                coords
                  ? `${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}`
                  : locale === 'vi'
                  ? 'Mô tả vị trí'
                  : 'Describe location'
              }
            />
            <button
              type="button"
              className="btn-secondary"
              style={{ width: 'auto', padding: '0 14px', borderRadius: 12, display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 600 }}
              onClick={() => {
                if ('geolocation' in navigator) {
                  navigator.geolocation.getCurrentPosition(
                    (pos) => {
                      const lat = pos.coords.latitude.toFixed(5);
                      const lng = pos.coords.longitude.toFixed(5);
                      setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
                      setLocation(`${lat}, ${lng}`);
                    },
                    () => {},
                  );
                }
              }}
            >
              <MapPinIcon size={16} />
              GPS
            </button>
          </div>
        </div>
        <div className="field">
          <label className="field-label">{locale === 'vi' ? 'Ảnh minh chứng' : 'Photo evidence'}</label>
          <label className="card" style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', padding: 12 }}>
            <span className="list-row-icon" aria-hidden>
              <ImageIcon size={18} />
            </span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>
                {photoLabel ?? (locale === 'vi' ? 'Chọn ảnh từ máy hoặc chụp mới' : 'Pick or take a photo')}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                {locale === 'vi' ? 'Tối đa 1 ảnh, dưới 5MB' : 'Up to 1 photo, under 5MB'}
              </div>
            </div>
            <input type="file" accept="image/*" capture="environment" hidden onChange={onPhoto} />
          </label>
        </div>
        <div className="field">
          <label
            className="card"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: 12,
              cursor: 'pointer',
            }}
          >
            <span className="list-row-icon" aria-hidden>
              <PhoneIcon size={18} />
            </span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>
                {locale === 'vi'
                  ? 'Cho phép cán bộ liên hệ lại qua số Zalo'
                  : 'Let staff contact you via your Zalo number'}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                {phoneRequesting
                  ? locale === 'vi'
                    ? 'Đang xin quyền...'
                    : 'Requesting permission...'
                  : sharePhone && phoneToken
                  ? locale === 'vi'
                    ? 'Đã chia sẻ số (mã hoá)'
                    : 'Phone shared (encrypted)'
                  : locale === 'vi'
                  ? 'Chỉ chia sẻ khi bạn bật'
                  : 'Only shared when toggled on'}
              </div>
            </div>
            <input
              type="checkbox"
              checked={sharePhone}
              disabled={phoneRequesting}
              onChange={(e) => onTogglePhone(e.target.checked)}
            />
          </label>
        </div>
        {error && <div className="alert">{t('common.error')}: {error}</div>}
        <button className="btn" type="submit" disabled={submitting}>
          <SendIcon size={18} />
          <span>{submitting ? t('common.loading') : t('report.submit')}</span>
        </button>
      </form>
    </>
  );
}
