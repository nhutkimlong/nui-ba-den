import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';
import { BellIcon, CheckIcon, ChevronRightIcon, CompassIcon, HelpIcon, HomeIcon, MapPinIcon, MegaphoneIcon, MessageIcon, PhoneIcon, QrCodeIcon, SendIcon, TrophyIcon, UserIcon } from '../components/icons';

const API_BASE = import.meta.env.VITE_API_BASE || 'https://nbd-api-t63a.onrender.com';

type Tab = 'home' | 'explore' | 'report' | 'support';
type SupportView = 'menu' | 'chat' | 'checkin' | 'guides' | 'profile';
type Locale = 'vi' | 'en';

type Poi = {
  id: string;
  slug: string;
  title: string;
  category: string;
  shortDescription?: string;
  imageUrl?: string;
};

type HomePayload = {
  alerts?: string[];
  featuredPois?: Poi[];
  banners?: { title?: string; subtitle?: string; imageUrl?: string }[];
};

type ExplorePayload = {
  pois?: Poi[];
  categories?: { id: string; label: string }[];
};

type ReportItem = {
  id: string;
  code: string;
  category: string;
  status: string;
  createdAt: string;
};

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

async function apiGet<T>(path: string, locale: Locale): Promise<T> {
  const url = new URL(path, API_BASE);
  url.searchParams.set('locale', locale);
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`${path}: ${res.status}`);
  return res.json();
}

async function apiPost<T>(path: string, body: unknown, locale: Locale): Promise<T> {
  const url = new URL(path, API_BASE);
  url.searchParams.set('locale', locale);
  const res = await fetch(url.toString(), {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`${path}: ${res.status}`);
  return res.json();
}

function App() {
  const [tab, setTab] = useState<Tab>('home');
  const [locale, setLocale] = useState<Locale>('vi');
  const labels = t[locale];

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
        {tab === 'home' && <Home locale={locale} setTab={setTab} />}
        {tab === 'explore' && <Explore locale={locale} />}
        {tab === 'report' && <Report locale={locale} />}
        {tab === 'support' && <Support locale={locale} />}
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

function Home({ locale, setTab }: { locale: Locale; setTab: (tab: Tab) => void }) {
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
          <button className="shortcut" onClick={() => setTab('support')}><span className="shortcut-icon"><MessageIcon size={20} /></span><span>Hỗ trợ</span></button>
          <button className="shortcut" onClick={() => setTab('support')}><span className="shortcut-icon"><MapPinIcon size={20} /></span><span>Check-in</span></button>
        </div>
      </section>
      {error && <div className="notice error">{labels.error}</div>}
      {data?.alerts?.map((alert, index) => <div className="notice" key={index}>{alert}</div>)}
      <h3>{labels.featured}</h3>
      {!data && !error && <div className="empty">{labels.loading}</div>}
      {data?.featuredPois?.map((poi) => <PoiCard key={poi.id} poi={poi} />)}
    </>
  );
}

function Explore({ locale }: { locale: Locale }) {
  const labels = t[locale];
  const [data, setData] = useState<ExplorePayload | null>(null);
  const [active, setActive] = useState<string>('');

  useEffect(() => {
    apiGet<ExplorePayload>('/content/explore', locale)
      .then(setData)
      .catch(() => setData({ pois: [], categories: [] }));
  }, [locale]);

  const pois = useMemo(() => {
    const list = data?.pois || [];
    return active ? list.filter((p) => p.category === active) : list;
  }, [active, data]);

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
      {pois.map((poi) => <PoiCard key={poi.id} poi={poi} />)}
    </>
  );
}

function PoiCard({ poi }: { poi: Poi }) {
  return (
    <article className="card">
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

  useEffect(() => {
    apiGet<{ items: ReportItem[] }>('/reports/history', locale)
      .then((res) => setHistory(res.items || []))
      .catch(() => setHistory([]));
  }, [locale, message]);

  async function submit() {
    if (!description.trim()) return;
    setMessage(labels.loading);
    try {
      const res = await apiPost<{ code: string }>('/reports', { category, description, location }, locale);
      setDescription('');
      setLocation('');
      setMessage(`${labels.submitted}: ${res.code}`);
    } catch {
      setMessage(labels.error);
    }
  }

  return (
    <>
      <h2>{labels.report}</h2>
      <section className="card form">
        <label>{labels.category}</label>
        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="service">Dịch vụ</option>
          <option value="security">An ninh/trật tự</option>
          <option value="environment">Môi trường</option>
          <option value="other">Khác</option>
        </select>
        <label>{labels.description}</label>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} />
        <label>{labels.location}</label>
        <input value={location} onChange={(e) => setLocation(e.target.value)} />
        <button className="primary" onClick={submit}>{labels.send}</button>
        {message && <div className="notice">{message}</div>}
      </section>
      <h3>{labels.history}</h3>
      {history.length === 0 && <div className="empty">{labels.empty}</div>}
      {history.map((item) => (
        <article className="card row" key={item.id}>
          <div>
            <strong>{item.code}</strong>
            <p>{item.category}</p>
          </div>
          <span className="pill">{item.status}</span>
        </article>
      ))}
    </>
  );
}

function Support({ locale }: { locale: Locale }) {
  const labels = t[locale];
  const [view, setView] = useState<SupportView>('menu');

  if (view === 'chat') return <Chat locale={locale} onBack={() => setView('menu')} />;
  if (view === 'checkin') return <Checkin locale={locale} onBack={() => setView('menu')} />;
  if (view === 'guides') return <Guides locale={locale} onBack={() => setView('menu')} />;
  if (view === 'profile') return <Profile locale={locale} onBack={() => setView('menu')} />;

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

function Chat({ locale, onBack }: { locale: Locale; onBack: () => void }) {
  const labels = t[locale];
  const [messages, setMessages] = useState<{ role: 'user' | 'bot'; content: string }[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);

  async function send(text = input) {
    const question = text.trim();
    if (!question || sending) return;
    setMessages((items) => [...items, { role: 'user', content: question }]);
    setInput('');
    setSending(true);
    try {
      const res = await apiPost<{ answer: string }>('/chatbot/ask', { question }, locale);
      setMessages((items) => [...items, { role: 'bot', content: res.answer || 'Em chưa có thông tin phù hợp.' }]);
    } catch {
      setMessages((items) => [...items, { role: 'bot', content: labels.error }]);
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      <BackButton onBack={onBack} />
      <h2>{labels.chat}</h2>
      {messages.length === 0 && <div className="chat-empty">Dạ em là trợ lý du lịch Núi Bà Đen. Anh/chị cần hỗ trợ gì ạ?</div>}
      <section className="chat-shell">
        {messages.map((msg, i) => (
          <div key={i} className={`bubble ${msg.role === 'user' ? 'bubble-user' : 'bubble-bot'}`}>{msg.content}</div>
        ))}
      </section>
      <section className="chat-composer-inline">
        <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Nhập câu hỏi..." onKeyDown={(e) => e.key === 'Enter' && send()} />
        <button onClick={() => send()} disabled={sending}>{sending ? '...' : 'Gửi'}</button>
      </section>
    </>
  );
}

function Checkin({ locale, onBack }: { locale: Locale; onBack: () => void }) {
  const labels = t[locale];
  const [poiSlug, setPoiSlug] = useState('');
  const [qrValue, setQrValue] = useState('');
  const [message, setMessage] = useState('');
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(
      (pos) => setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setCoords(null),
      { enableHighAccuracy: true, timeout: 8000 },
    );
  }, []);

  async function submit() {
    setMessage(labels.loading);
    try {
      const res = await apiPost<{ ok: boolean; message: string; badge?: string }>('/checkins', { poiSlug, qrValue, coords }, locale);
      setMessage(`${res.ok ? '✅' : '⚠️'} ${res.message}${res.badge ? ` - ${res.badge}` : ''}`);
    } catch {
      setMessage(labels.error);
    }
  }

  return (
    <>
      <BackButton onBack={onBack} />
      <h2>{labels.checkin}</h2>
      <section className="card form">
        <label>POI slug</label>
        <input value={poiSlug} onChange={(e) => setPoiSlug(e.target.value)} placeholder="ba-den-peak" />
        <label>QR code</label>
        <input value={qrValue} onChange={(e) => setQrValue(e.target.value)} placeholder="NBD-PEAK-001" />
        <div className="notice">GPS: {coords ? `${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}` : 'Chưa có quyền vị trí'}</div>
        <button className="primary" onClick={submit}>{labels.checkin}</button>
        {message && <div className="notice">{message}</div>}
      </section>
    </>
  );
}

function Guides({ locale, onBack }: { locale: Locale; onBack: () => void }) {
  const labels = t[locale];
  const [items, setItems] = useState<{ id: string; title: string; summary?: string; coverImageUrl?: string }[]>([]);
  useEffect(() => {
    apiGet<{ items: { id: string; title: string; summary?: string; coverImageUrl?: string }[] }>('/content/guides', locale)
      .then((res) => setItems(res.items || []))
      .catch(() => setItems([]));
  }, [locale]);
  return (
    <>
      <BackButton onBack={onBack} />
      <h2>{labels.guides}</h2>
      {items.length === 0 && <div className="empty">{labels.empty}</div>}
      {items.map((item) => (
        <article className="list-row" key={item.id}>
          {item.coverImageUrl ? <img src={item.coverImageUrl} alt="" style={{ width: 56, height: 56, borderRadius: 12, objectFit: 'cover' }} /> : <span className="list-row-icon" />}
          <div className="list-row-body">
            <div className="list-row-title">{item.title}</div>
            <div className="list-row-meta">{item.summary}</div>
          </div>
        </article>
      ))}
    </>
  );
}

function Profile({ locale, onBack }: { locale: Locale; onBack: () => void }) {
  const labels = t[locale];
  const [profile, setProfile] = useState<any>(null);
  useEffect(() => {
    apiGet<any>('/profile', locale).then(setProfile).catch(() => setProfile(null));
  }, [locale]);
  return (
    <>
      <BackButton onBack={onBack} />
      <h2>{labels.profile}</h2>
      {!profile && <div className="empty">{labels.loading}</div>}
      {profile && (
        <>
          <section className="card">
            <h3>{profile.user?.name || 'Du khách'}</h3>
            <div className="stat-row">
              <div className="stat-cell"><div className="stat-value">{profile.stats?.checkins ?? 0}</div><div className="stat-label">Check-in</div></div>
              <div className="stat-cell"><div className="stat-value">{profile.stats?.reports ?? 0}</div><div className="stat-label">Phản ánh</div></div>
              <div className="stat-cell"><div className="stat-value">{profile.stats?.badges ?? 0}</div><div className="stat-label">Huy hiệu</div></div>
            </div>
          </section>
          <h3 className="section-title">Huy hiệu</h3>
          {profile.badges?.map((b: any) => <div className="card row" key={b.id}><span>{b.name}</span><span>{b.achieved ? '✅' : '—'}</span></div>)}
        </>
      )}
    </>
  );
}

createRoot(document.getElementById('app')!).render(<App />);
