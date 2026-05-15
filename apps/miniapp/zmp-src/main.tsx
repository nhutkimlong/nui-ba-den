import { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { getPhoneNumber, scanQRCode } from 'zmp-sdk/apis';
import './styles.css';
import { CheckIcon, ChevronRightIcon, CompassIcon, HelpIcon, HomeIcon, MapPinIcon, MegaphoneIcon, MessageIcon, PhoneIcon, QrCodeIcon, UserIcon } from '../components/icons';
import { apiGet, apiPost, apiUpload, fetchMe, getGps, loginWithZmp, logoutUser, type Coords, type Locale } from './miniapp-api-client';
import type { ChatMessage, CheckinResult, ExplorePayload, GuideDetail, GuideItem, HomePayload, Poi, ProfilePayload, ReportDetail, ReportItem, SupportParams, SupportView, Tab } from './miniapp-types';

const CHAT_STORAGE_KEY = 'nbd_chat_history';

const t = {
  vi: {
    brand: 'Núi Bà Đen',
    home: 'Trang chủ',
    explore: 'Khám phá',
    report: 'Phản ánh',
    support: 'Hỗ trợ',
    loading: 'Đang tải...',
    error: 'Không tải được dữ liệu',
    featured: 'Điểm nổi bật',
    alerts: 'Thông báo',
    all: 'Tất cả',
    submitReport: 'Gửi phản ánh',
    history: 'Lịch sử phản ánh',
    category: 'Danh mục',
    description: 'Nội dung phản ánh',
    location: 'Vị trí',
    send: 'Gửi',
    chat: 'Chatbot hỗ trợ',
    checkin: 'Check-in',
    guides: 'Hướng dẫn',
    profile: 'Hồ sơ',
    empty: 'Chưa có dữ liệu',
    submitted: 'Đã gửi phản ánh',
  },
  en: {
    brand: 'Ba Den Mountain',
    home: 'Home',
    explore: 'Explore',
    report: 'Report',
    support: 'Support',
    loading: 'Loading...',
    error: 'Unable to load data',
    featured: 'Featured places',
    alerts: 'Alerts',
    all: 'All',
    submitReport: 'Submit report',
    history: 'Report history',
    category: 'Category',
    description: 'Description',
    location: 'Location',
    send: 'Send',
    chat: 'Support chatbot',
    checkin: 'Check-in',
    guides: 'Guides',
    profile: 'Profile',
    empty: 'No data',
    submitted: 'Report submitted',
  },
} as const;


function App() {
  const [tab, setTab] = useState<Tab>('home');
  const [locale, setLocale] = useState<Locale>('vi');
  const [supportView, setSupportView] = useState<SupportView>('menu');
  const [supportParams, setSupportParams] = useState<SupportParams>({});
  const [exploreSlug, setExploreSlug] = useState('');
  const labels = t[locale];

  function openSupport(view: SupportView, params: SupportParams = {}) {
    setSupportParams(params);
    setSupportView(view);
    setTab('support');
  }

  return (
    <div className="app-shell">
      <header className="appbar">
        <div className="appbar-left">
          <span className="appbar-logo">NB</span>
          <h1 className="appbar-title">{labels.brand}</h1>
        </div>
        <button className="appbar-locale" onClick={() => setLocale(locale === 'vi' ? 'en' : 'vi')}>
          {locale.toUpperCase()}
        </button>
      </header>
      <main className="app-content">
        {tab === 'home' && <Home locale={locale} setTab={setTab} openSupport={openSupport} openPoi={(slug: string) => { setExploreSlug(slug); setTab('explore'); }} />}
        {tab === 'explore' && <Explore locale={locale} selectedSlug={exploreSlug} setSelected={setExploreSlug} openSupport={openSupport} />}
        {tab === 'report' && <Report locale={locale} />}
        {tab === 'support' && <Support locale={locale} view={supportView} setView={setSupportView} params={supportParams} setParams={setSupportParams} />}
      </main>
      <nav className="tabbar">
        {(['home', 'explore', 'report', 'support'] as Tab[]).map((key) => (
          <button key={key} className={`tab ${tab === key ? 'tab-active' : ''}`} onClick={() => setTab(key)}>
            <span className="tab-icon"><TabIcon tab={key} active={tab === key} /></span>
            <span className="tab-label">{labels[key]}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}

function TabIcon({ tab, active }: { tab: Tab; active: boolean }) {
  const props = { size: 22, strokeWidth: active ? 2 : 1.6 };
  if (tab === 'home') return <HomeIcon {...props} />;
  if (tab === 'explore') return <CompassIcon {...props} />;
  if (tab === 'report') return <MegaphoneIcon {...props} />;
  return <MessageIcon {...props} />;
}

function Home({ locale, setTab, openSupport, openPoi }: { locale: Locale; setTab: (tab: Tab) => void; openSupport: (view: SupportView, params?: SupportParams) => void; openPoi: (slug: string) => void }) {
  const labels = t[locale];
  const [data, setData] = useState<HomePayload | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    apiGet<HomePayload>('/content/home', locale)
      .then(setData)
      .catch(() => setError(true));
  }, [locale]);

  const hero = data?.banners?.[0];

  return (
    <>
      <section className="hero">
        <img className="hero-image" src={hero?.imageUrl || 'https://images.unsplash.com/photo-1570366583862-f91883984fde?auto=format&fit=crop&w=1200&q=70'} alt="" />
        <div className="hero-overlay">
          <span className="hero-eyebrow">Du lịch Tây Ninh</span>
          <h2 className="hero-title">{hero?.title || labels.brand}</h2>
          <p className="hero-sub">{hero?.subtitle || 'Thông tin, phản ánh, check-in và hỗ trợ du khách Núi Bà Đen.'}</p>
        </div>
      </section>
      <section className="section">
        <div className="shortcut-grid">
          <button className="shortcut" onClick={() => setTab('explore')}><span className="shortcut-icon"><CompassIcon size={20} /></span><span>Khám phá</span></button>
          <button className="shortcut" onClick={() => setTab('report')}><span className="shortcut-icon"><MegaphoneIcon size={20} /></span><span>Phản ánh</span></button>
          <button className="shortcut" onClick={() => openSupport('chat')}><span className="shortcut-icon"><MessageIcon size={20} /></span><span>Hỗ trợ</span></button>
          <button className="shortcut" onClick={() => openSupport('checkin')}><span className="shortcut-icon"><MapPinIcon size={20} /></span><span>Check-in</span></button>
        </div>
      </section>
      {error && <div className="notice error">{labels.error}</div>}
      {data?.alerts?.map((alert, index) => <div className="notice" key={index}>{alert}</div>)}
      <h3>{labels.featured}</h3>
      {!data && !error && <div className="empty">{labels.loading}</div>}
      {data?.featuredPois?.map((poi) => <PoiCard key={poi.id} poi={poi} onClick={() => openPoi(poi.slug)} />)}
    </>
  );
}

function Explore({ locale, selectedSlug, setSelected, openSupport }: { locale: Locale; selectedSlug: string; setSelected: (slug: string) => void; openSupport: (view: SupportView, params?: SupportParams) => void }) {
  const labels = t[locale];
  const [data, setData] = useState<ExplorePayload | null>(null);
  const [active, setActive] = useState<string>('');
  const selected = selectedSlug;
  const [detail, setDetail] = useState<Poi | null>(null);

  useEffect(() => {
    apiGet<ExplorePayload>('/content/explore', locale)
      .then(setData)
      .catch(() => setData({ pois: [], categories: [] }));
  }, [locale]);

  useEffect(() => {
    if (!selected) return;
    setDetail(null);
    apiGet<Poi>(`/content/poi/${selected}`, locale)
      .then(setDetail)
      .catch(() => setDetail(data?.pois?.find((p) => p.slug === selected) || null));
  }, [data, locale, selected]);

  const pois = useMemo(() => {
    const list = data?.pois || [];
    return active ? list.filter((p) => p.category === active) : list;
  }, [active, data]);

  if (selected) {
    return (
      <>
        <BackButton onBack={() => setSelected('')} />
        {!detail && <div className="empty">{labels.loading}</div>}
        {detail && (
          <article className="card detail-card">
            {detail.imageUrl && <img src={detail.imageUrl} alt="" />}
            <div className="tag">{detail.category}</div>
            <h2>{detail.title}</h2>
            <p>{detail.longDescription || detail.shortDescription}</p>
            {detail.latitude && detail.longitude && <div className="notice">GPS: {detail.latitude}, {detail.longitude}</div>}
            <div className="menu">
              <button onClick={() => openSupport('checkin', { poiSlug: detail.slug, qrValue: detail.qrCodeValue || '' })}><QrCodeIcon size={18} /> Check-in tại điểm này</button>
              <button onClick={() => openSupport('chat', { chatContext: `poi:${detail.slug}` })}><MessageIcon size={18} /> Hỏi chatbot về điểm này</button>
            </div>
          </article>
        )}
      </>
    );
  }

  return (
    <>
      <h2>{labels.explore}</h2>
      {!data && <div className="empty">{labels.loading}</div>}
      <div className="chips">
        <button className={!active ? 'on' : ''} onClick={() => setActive('')}>{labels.all}</button>
        {data?.categories?.map((cat) => (
          <button key={cat.id} className={active === cat.id ? 'on' : ''} onClick={() => setActive(cat.id)}>
            {cat.label}
          </button>
        ))}
      </div>
      {pois.length === 0 && data && <div className="empty">{labels.empty}</div>}
      {pois.map((poi) => <PoiCard key={poi.id} poi={poi} onClick={() => setSelected(poi.slug)} />)}
    </>
  );
}

function PoiCard({ poi, onClick }: { poi: Poi; onClick?: () => void }) {
  return (
    <article className="card" onClick={onClick} role={onClick ? 'button' : undefined}>
      {poi.imageUrl && <img src={poi.imageUrl} alt="" />}
      <div className="tag">{poi.category}</div>
      <h3>{poi.title}</h3>
      <p>{poi.shortDescription}</p>
    </article>
  );
}

function Report({ locale }: { locale: Locale }) {
  const labels = t[locale];
  const [category, setCategory] = useState('service');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [message, setMessage] = useState('');
  const [history, setHistory] = useState<ReportItem[]>([]);
  const [detail, setDetail] = useState<ReportDetail | null>(null);
  const [coords, setCoords] = useState<Coords | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoLabel, setPhotoLabel] = useState('');
  const [phoneToken, setPhoneToken] = useState('');
  const [sharePhone, setSharePhone] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [historyOnly, setHistoryOnly] = useState(false);
  const categories = [
    { id: 'service', label: 'Dịch vụ' },
    { id: 'security_order', label: 'An ninh/trật tự' },
    { id: 'environment', label: 'Môi trường' },
    { id: 'other', label: 'Khác' },
  ];

  async function requestGps() {
    try {
      const next = await getGps();
      setCoords(next);
      setLocation(`${next.lat.toFixed(5)}, ${next.lng.toFixed(5)}`);
    } catch {
      setMessage('Không lấy được vị trí GPS');
    }
  }

  async function requestPhone() {
    try {
      const res = await getPhoneNumber({});
      setPhoneToken((res as any).token || (res as any).number || '');
      setMessage('Đã nhận token số điện thoại');
    } catch {
      setMessage('Không lấy được token số điện thoại');
    }
  }

  function loadHistory() {
    apiGet<{ items: ReportItem[] }>('/reports/history', locale)
      .then((res) => setHistory(res.items || []))
      .catch(() => setHistory([]));
  }

  useEffect(loadHistory, [locale, message]);

  async function openDetail(code: string) {
    setMessage(labels.loading);
    try {
      setDetail(await apiGet<ReportDetail>(`/reports/by-code/${code}`, locale));
      setMessage('');
    } catch {
      setMessage(labels.error);
    }
  }

  async function submit() {
    if (!description.trim() || submitting) return;
    setSubmitting(true);
    setMessage(labels.loading);
    try {
      const res = await apiPost<{ code: string }>('/reports', { category, description, location, coords, contactPhoneToken: sharePhone ? phoneToken || undefined : undefined }, locale);
      if (photoFile) await apiUpload(`/reports/${res.code}/attachments`, photoFile, locale);
      setDescription('');
      setLocation('');
      setCoords(null);
      setPhoneToken('');
      setSharePhone(false);
      setPhotoFile(null);
      setPhotoLabel('');
      setMessage(`${labels.submitted}: ${res.code}`);
      openDetail(res.code);
    } catch {
      setMessage(labels.error);
    } finally {
      setSubmitting(false);
    }
  }

  const statusText = (status: string) => ({
    new: 'Mới',
    triaged: 'Đã phân loại',
    in_progress: 'Đang xử lý',
    resolved: 'Đã xử lý',
    rejected: 'Từ chối',
    needs_more_info: 'Cần thêm thông tin',
  } as Record<string, string>)[status] || status;

  if (detail) {
    return (
      <>
        <BackButton onBack={() => setDetail(null)} />
        <h2>{detail.code}</h2>
        <section className="card">
          <div className="tag">{detail.category}</div>
          <h3>{statusText(detail.status)}</h3>
          <p>{detail.description}</p>
          {detail.location && <div className="notice">{detail.location}</div>}
        </section>
        <h3>Timeline</h3>
        {(detail.timeline || []).map((entry, index) => (
          <article className="card row" key={`${entry.status}-${index}`}>
            <div><strong>{statusText(entry.status)}</strong><p>{entry.note || new Date(entry.at).toLocaleString(locale === 'vi' ? 'vi-VN' : 'en-US')}</p></div>
          </article>
        ))}
      </>
    );
  }

  if (historyOnly) {
    return (
      <>
        <BackButton onBack={() => setHistoryOnly(false)} />
        <h2>{labels.history}</h2>
        {history.length === 0 && <div className="empty">{labels.empty}</div>}
        {history.map((item) => (
          <button className="card row" key={item.id} onClick={() => openDetail(item.code)}>
            <div>
              <strong>{item.code}</strong>
              <p>{item.category} · {new Date(item.createdAt).toLocaleString(locale === 'vi' ? 'vi-VN' : 'en-US')}</p>
            </div>
            <span className="pill">{statusText(item.status)}</span>
          </button>
        ))}
      </>
    );
  }

  return (
    <>
      <h2>{labels.report}</h2>
      <button className="btn-secondary" onClick={() => setHistoryOnly(true)}>{labels.history}</button>
      <section className="card form">
        <label>{labels.category}</label>
        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          {categories.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
        </select>
        <label>{labels.description}</label>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} />
        <label>{labels.location}</label>
        <div style={{ display: 'flex', gap: 8 }}>
          <input value={location} onChange={(e) => setLocation(e.target.value)} />
          <button type="button" className="btn-secondary qr-btn" onClick={requestGps}><MapPinIcon size={16} /> GPS</button>
        </div>
        <label>Ảnh</label>
        <input type="file" accept="image/*" capture="environment" onChange={(e) => { const file = e.target.files?.[0] || null; setPhotoFile(file); setPhotoLabel(file ? `${file.name} (${Math.round(file.size / 1024)} KB)` : ''); }} />
        {photoLabel && <div className="muted">{photoLabel}</div>}
        <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input type="checkbox" checked={sharePhone} onChange={(e) => setSharePhone(e.target.checked)} />
          Chia sẻ số điện thoại để ban quản lý liên hệ
        </label>
        {sharePhone && <button type="button" className="btn-secondary" onClick={requestPhone}>{phoneToken ? 'Đã nhận token số điện thoại' : 'Lấy token số điện thoại'}</button>}
        <button className="primary" disabled={submitting} onClick={submit}>{submitting ? labels.loading : labels.send}</button>
        {message && <div className="notice">{message}</div>}
      </section>
    </>
  );
}

function Support({ locale, view, setView, params, setParams }: { locale: Locale; view: SupportView; setView: (view: SupportView) => void; params: SupportParams; setParams: (params: SupportParams) => void }) {
  const labels = t[locale];
  const backToMenu = () => { setParams({}); setView('menu'); };

  if (view === 'chat') return <Chat locale={locale} context={params.chatContext} onBack={backToMenu} />;
  if (view === 'checkin') return <Checkin locale={locale} initialPoiSlug={params.poiSlug} initialQrValue={params.qrValue} onBack={backToMenu} />;
  if (view === 'guides') return <Guides locale={locale} onBack={backToMenu} />;
  if (view === 'profile') return <Profile locale={locale} onBack={backToMenu} />;

  return (
    <>
      <h2>{labels.support}</h2>
      <section className="section">
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <span className="list-row-icon" style={{ background: '#fef2f2', color: '#dc2626' }}><PhoneIcon size={22} /></span>
          <div style={{ flex: 1 }}>
            <strong style={{ fontSize: 14 }}>Hotline hỗ trợ</strong>
            <div style={{ color: 'var(--text-secondary)', fontSize: 13 }}>0276 3900 000</div>
          </div>
          <a className="btn-secondary" style={{ padding: '8px 14px', borderRadius: 12, fontWeight: 600, fontSize: 13 }} href="tel:02763900000">Gọi</a>
        </div>
      </section>
      <section className="section">
        <div className="section-header"><h3 className="section-title">{labels.support}</h3></div>
        <button className="list-row" onClick={() => setView('chat')}><span className="list-row-icon"><MessageIcon size={20} /></span><span className="list-row-body"><span className="list-row-title">{labels.chat}</span></span><span className="list-row-cta"><ChevronRightIcon size={18} /></span></button>
        <button className="list-row" onClick={() => setView('checkin')}><span className="list-row-icon"><MapPinIcon size={20} /></span><span className="list-row-body"><span className="list-row-title">{labels.checkin}</span></span><span className="list-row-cta"><ChevronRightIcon size={18} /></span></button>
        <button className="list-row" onClick={() => setView('guides')}><span className="list-row-icon"><HelpIcon size={20} /></span><span className="list-row-body"><span className="list-row-title">{labels.guides}</span></span><span className="list-row-cta"><ChevronRightIcon size={18} /></span></button>
        <button className="list-row" onClick={() => setView('profile')}><span className="list-row-icon"><UserIcon size={20} /></span><span className="list-row-body"><span className="list-row-title">{labels.profile}</span></span><span className="list-row-cta"><ChevronRightIcon size={18} /></span></button>
      </section>
      <section className="section">
        <div className="card" style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <span className="list-row-icon"><HelpIcon size={20} /></span>
          <div><div style={{ fontWeight: 600, marginBottom: 2 }}>Cần trợ giúp khẩn cấp?</div><div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Liên hệ ngay đội an ninh / y tế tại điểm gần nhất hoặc sử dụng hotline.</div></div>
        </div>
      </section>
    </>
  );
}

function BackButton({ onBack }: { onBack: () => void }) {
  return <button className="back-btn" onClick={onBack}>← Quay lại</button>;
}

function Chat({ locale, context, onBack }: { locale: Locale; context?: string; onBack: () => void }) {
  const labels = t[locale];
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try { return JSON.parse(localStorage.getItem(CHAT_STORAGE_KEY) || '[]'); } catch { return []; }
  });
  const [suggestions, setSuggestions] = useState<{ id: string; question: string }[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    apiGet<{ items: { id: string; question: string }[] }>('/chatbot/suggestions', locale)
      .then((res) => setSuggestions(res.items || []))
      .catch(() => setSuggestions([]));
  }, [locale]);

  async function send(text = input) {
    const question = text.trim();
    if (!question || sending) return;
    setMessages((items) => [...items, { id: crypto.randomUUID(), role: 'user', content: question }]);
    setInput('');
    setSending(true);
    try {
      const res = await apiPost<{ answer: string }>('/chatbot/ask', { question, context }, locale);
      setMessages((items) => [...items, { id: crypto.randomUUID(), role: 'bot', content: res.answer || 'Em chưa có thông tin phù hợp.' }]);
    } catch {
      setMessages((items) => [...items, { id: crypto.randomUUID(), role: 'bot', content: labels.error }]);
    } finally {
      setSending(false);
    }
  }

  async function setFeedback(messageId: string, feedback: 'helpful' | 'unhelpful') {
    setMessages((items) => items.map((item) => item.id === messageId ? { ...item, feedback } : item));
    try { await apiPost('/chatbot/feedback', { messageId, feedback }, locale); } catch {}
  }

  return (
    <>
      <BackButton onBack={onBack} />
      <h2>{labels.chat}</h2>
      <button className="btn-secondary" onClick={() => setMessages([])}>Xóa chat</button>
      {messages.length === 0 && <div className="chat-empty">Dạ em là trợ lý du lịch Núi Bà Đen. Anh/chị cần hỗ trợ gì ạ?</div>}
      {suggestions.length > 0 && <div className="chips">{suggestions.map((item) => <button key={item.id} onClick={() => send(item.question)}>{item.question}</button>)}</div>}
      <section className="chat-shell">
        {messages.map((msg) => (
          <div key={msg.id}>
            <div className={`bubble ${msg.role === 'user' ? 'bubble-user' : 'bubble-bot'}`}>{msg.content}</div>
            {msg.role === 'bot' && (
              <div className="chips">
                <button className={msg.feedback === 'helpful' ? 'on' : ''} onClick={() => setFeedback(msg.id, 'helpful')}>Hữu ích</button>
                <button className={msg.feedback === 'unhelpful' ? 'on' : ''} onClick={() => setFeedback(msg.id, 'unhelpful')}>Chưa đúng</button>
              </div>
            )}
          </div>
        ))}
      </section>
      <section className="chat-composer-inline">
        <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Nhập câu hỏi..." onKeyDown={(e) => e.key === 'Enter' && send()} />
        <button onClick={() => send()} disabled={sending}>{sending ? '...' : 'Gửi'}</button>
      </section>
    </>
  );
}

function Checkin({ locale, initialPoiSlug, initialQrValue, onBack }: { locale: Locale; initialPoiSlug?: string; initialQrValue?: string; onBack: () => void }) {
  const labels = t[locale];
  const [poiSlug, setPoiSlug] = useState(initialPoiSlug || '');
  const [qrValue, setQrValue] = useState(initialQrValue || '');
  const [message, setMessage] = useState('');
  const [coords, setCoords] = useState<Coords | null>(null);
  const [poi, setPoi] = useState<Poi | null>(null);
  const [loading, setLoading] = useState(false);
  const [autoSubmitted, setAutoSubmitted] = useState(false);

  useEffect(() => {
    getGps().then(setCoords).catch(() => setCoords(null));
  }, []);

  useEffect(() => {
    if (!poiSlug) { setPoi(null); return; }
    apiGet<Poi>(`/content/poi/${poiSlug}`, locale).then(setPoi).catch(() => setPoi(null));
  }, [locale, poiSlug]);

  useEffect(() => {
    if (!initialPoiSlug || !initialQrValue || !coords || autoSubmitted) return;
    setAutoSubmitted(true);
    submit();
  }, [autoSubmitted, coords, initialPoiSlug, initialQrValue]);

  async function scanQr() {
    try {
      const res = await scanQRCode({});
      const content = (res as any).content || '';
      setQrValue(content);
      const found = content.match(/poi=([^&]+)/)?.[1] || content.match(/poi:([\w-]+)/)?.[1];
      if (found) setPoiSlug(decodeURIComponent(found));
    } catch {
      setMessage('Không quét được QR');
    }
  }

  async function submit() {
    if (loading) return;
    setLoading(true);
    setMessage(labels.loading);
    try {
      const nextCoords = coords || await getGps();
      setCoords(nextCoords);
      const res = await apiPost<CheckinResult>('/checkins', { poiSlug, qrValue, coords: nextCoords }, locale);
      setMessage(`${res.ok ? 'Đã check-in' : 'Chưa hợp lệ'}: ${res.message}${res.badge ? ` - ${res.badge}` : ''}`);
    } catch {
      setMessage(labels.error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <BackButton onBack={onBack} />
      <h2>{labels.checkin}</h2>
      <section className="card form">
        <label>POI slug</label>
        <input value={poiSlug} onChange={(e) => setPoiSlug(e.target.value)} placeholder="ba-den-peak" />
        {poi && <div className="notice"><strong>{poi.title}</strong><br />{poi.shortDescription}</div>}
        <label>QR code</label>
        <div style={{ display: 'flex', gap: 8 }}>
          <input value={qrValue} onChange={(e) => setQrValue(e.target.value)} placeholder="NBD-PEAK-001" />
          <button type="button" className="btn-secondary qr-btn" onClick={scanQr}><QrCodeIcon size={16} /> QR</button>
        </div>
        <div className="notice">GPS: {coords ? `${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}` : 'Chưa có quyền vị trí'}</div>
        <button className="primary" onClick={submit}><CheckIcon size={18} /> {labels.checkin}</button>
        {message && <div className="notice">{message}</div>}
      </section>
    </>
  );
}

function Guides({ locale, onBack }: { locale: Locale; onBack: () => void }) {
  const labels = t[locale];
  const [items, setItems] = useState<GuideItem[]>([]);
  const [selected, setSelected] = useState('');
  const [detail, setDetail] = useState<GuideDetail | null>(null);

  useEffect(() => {
    apiGet<{ items: GuideItem[] }>('/content/guides', locale)
      .then((res) => setItems(res.items || []))
      .catch(() => setItems([]));
  }, [locale]);

  useEffect(() => {
    if (!selected) return;
    setDetail(null);
    apiGet<GuideDetail>(`/content/guides/${selected}`, locale)
      .then(setDetail)
      .catch(() => setDetail(items.find((item) => (item.slug || item.id) === selected) || null));
  }, [items, locale, selected]);

  if (selected) {
    return (
      <>
        <BackButton onBack={() => setSelected('')} />
        {!detail && <div className="empty">{labels.loading}</div>}
        {detail && (
          <article className="card detail-card">
            {detail.coverImageUrl && <img src={detail.coverImageUrl} alt="" />}
            <h2>{detail.title}</h2>
            {detail.summary && <p className="muted">{detail.summary}</p>}
            <Markdown text={detail.bodyMd || detail.content || ''} />
          </article>
        )}
      </>
    );
  }

  return (
    <>
      <BackButton onBack={onBack} />
      <h2>{labels.guides}</h2>
      {items.length === 0 && <div className="empty">{labels.empty}</div>}
      {items.map((item) => (
        <button className="list-row" key={item.id} onClick={() => setSelected(item.slug || item.id)}>
          {item.coverImageUrl ? <img src={item.coverImageUrl} alt="" style={{ width: 56, height: 56, borderRadius: 12, objectFit: 'cover' }} /> : <span className="list-row-icon" />}
          <div className="list-row-body">
            <div className="list-row-title">{item.title}</div>
            <div className="list-row-meta">{item.summary}</div>
          </div>
        </button>
      ))}
    </>
  );
}

function Markdown({ text }: { text: string }) {
  const lines = text.split('\n').map((line) => line.trim()).filter(Boolean);
  return (
    <div className="markdown">
      {lines.map((line, index) => {
        if (line.startsWith('### ')) return <h4 key={index}>{line.slice(4)}</h4>;
        if (line.startsWith('## ')) return <h3 key={index}>{line.slice(3)}</h3>;
        if (line.startsWith('# ')) return <h2 key={index}>{line.slice(2)}</h2>;
        if (/^[-*]\s+/.test(line)) return <p key={index}>• {line.replace(/^[-*]\s+/, '')}</p>;
        return <p key={index}>{line}</p>;
      })}
    </div>
  );
}

function Profile({ locale, onBack }: { locale: Locale; onBack: () => void }) {
  const labels = t[locale];
  const [profile, setProfile] = useState<ProfilePayload | null>(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);

  async function loadProfile() {
    setLoading(true);
    try {
      const user = await fetchMe();
      const payload = await apiGet<ProfilePayload>('/profile', locale).catch(() => null);
      setProfile(payload ? { ...payload, user: payload.user || user } : user ? { user } : null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadProfile(); }, [locale]);

  async function signIn() {
    setMessage(labels.loading);
    try {
      const user = await loginWithZmp();
      await loadProfile();
      setProfile((current) => ({ ...(current || {}), user: current?.user || user }));
      setMessage(user ? 'Đã đăng nhập Zalo' : labels.error);
    } catch {
      setMessage(labels.error);
    }
  }

  async function signOut() {
    await logoutUser();
    setProfile(null);
    setMessage('Đã đăng xuất');
  }

  return (
    <>
      <BackButton onBack={onBack} />
      <h2>{labels.profile}</h2>
      <section className="card row">
        <button className="primary" onClick={signIn}>Đăng nhập Zalo</button>
        <button className="btn-secondary" onClick={signOut}>Đăng xuất</button>
      </section>
      {message && <div className="notice">{message}</div>}
      {loading && <div className="empty">{labels.loading}</div>}
      {!loading && !profile && <div className="empty">{labels.empty}</div>}
      {profile && (
        <>
          <section className="card">
            <h3>{profile.user?.display_name || profile.user?.name || 'Du khách'}</h3>
            <div className="stat-row">
              <div className="stat-cell"><div className="stat-value">{profile.stats?.checkins ?? 0}</div><div className="stat-label">Check-in</div></div>
              <div className="stat-cell"><div className="stat-value">{profile.stats?.reports ?? 0}</div><div className="stat-label">Phản ánh</div></div>
              <div className="stat-cell"><div className="stat-value">{profile.stats?.badges ?? 0}</div><div className="stat-label">Huy hiệu</div></div>
            </div>
          </section>
          <h3 className="section-title">Huy hiệu</h3>
          {profile.badges?.map((b: any) => <div className="card row" key={b.id}><span>{b.name}</span><span>{b.achieved ? 'Đạt' : '—'}</span></div>)}
          <h3 className="section-title">Check-in gần đây</h3>
          {profile.recentCheckins?.map((item: any) => <div className="card row" key={item.id}><span>{item.poiTitle}</span><span>{new Date(item.at).toLocaleDateString('vi-VN')}</span></div>)}
        </>
      )}
    </>
  );
}

createRoot(document.getElementById('app')!).render(<App />);
