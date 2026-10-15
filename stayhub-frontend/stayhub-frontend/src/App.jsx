import React from 'react';
import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, CalendarDays, Check, ChevronDown, Compass, Heart, Menu, Search, ShieldCheck, SlidersHorizontal, Sparkles, Star, Users, X } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const fallbackRooms = [
  { id: 1, name: 'Deluxe Room', price: 100, description: 'A calm, comfortable retreat with thoughtful details.', image: 'https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=1000&q=85', tag: 'Guest favorite' },
  { id: 2, name: 'Suite', price: 200, description: 'Extra space to unwind, with a separate lounge area.', image: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1000&q=85', tag: 'More space' },
  { id: 3, name: 'Standard Room', price: 50, description: 'Simple, inviting comfort for an easy getaway.', image: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=1000&q=85', tag: 'Great value' },
];
const today = new Date();
const dateString = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
const nextDay = new Date(today); nextDay.setDate(today.getDate() + 1);
const dayAfter = new Date(today); dayAfter.setDate(today.getDate() + 2);

function App() {
  const [rooms, setRooms] = useState(fallbackRooms);
  const [apiStatus, setApiStatus] = useState('loading');
  const [checkIn, setCheckIn] = useState(dateString(nextDay));
  const [checkOut, setCheckOut] = useState(dateString(dayAfter));
  const [guests, setGuests] = useState('2 guests');
  const [searchText, setSearchText] = useState('');
  const [maxPrice, setMaxPrice] = useState('all');
  const [saved, setSaved] = useState([]);
  const [modal, setModal] = useState('');
  const [mobileMenu, setMobileMenu] = useState(false);
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('stayhubUser') || 'null'); } catch { return null; }
  });
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    fetch(`${API_BASE}/rooms`)
      .then((res) => { if (!res.ok) throw new Error('Could not load rooms'); return res.json(); })
      .then((data) => {
        if (!active || !Array.isArray(data)) return;
        setRooms(data.map((room) => {
          const fallback = fallbackRooms.find((r) => Number(r.id) === Number(room.id)) || fallbackRooms[0];
          return { ...fallback, ...room, id: room.id, name: room.name ?? fallback.name, price: Number(room.price ?? fallback.price) };
        }));
        setApiStatus('connected');
      })
      .catch(() => { if (active) setApiStatus('offline'); });
    return () => { active = false; };
  }, []);

  const filteredRooms = useMemo(() => rooms.filter((room) => {
    const matchesName = `${room.name} ${room.description || ''}`.toLowerCase().includes(searchText.toLowerCase());
    const matchesPrice = maxPrice === 'all' || Number(room.price) <= Number(maxPrice);
    return matchesName && matchesPrice;
  }), [rooms, searchText, maxPrice]);

  async function submitAuth(event) {
    event.preventDefault();
    setBusy(true); setNotice('');
    const form = new FormData(event.currentTarget);
    const isRegister = modal === 'register';
    const payload = isRegister
      ? { name: form.get('name'), email: form.get('email'), password: form.get('password') }
      : { email: form.get('email'), password: form.get('password') };
    try {
      const response = await fetch(`${API_BASE}/users/${isRegister ? 'register' : 'login'}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || data.message || `Request failed (${response.status})`);
      if (isRegister) {
        setNotice('Account created. Please sign in to continue.');
        setModal('login');
      } else {
        const nextUser = { token: data.token, userId: data.userId, email: payload.email };
        localStorage.setItem('stayhubUser', JSON.stringify(nextUser)); setUser(nextUser); setModal('');
        setNotice('You are signed in.');
      }
    } catch (error) {
      setNotice(error.message);
    } finally { setBusy(false); }
  }

  async function bookRoom(room) {
    if (!user?.token) { setNotice('Sign in first to reserve a room.'); setModal('login'); return; }
    if (!checkIn || !checkOut || checkIn >= checkOut) { setNotice('Choose a valid check-in and check-out date.'); return; }
    setBusy(true); setNotice('');
    try {
      const response = await fetch(`${API_BASE}/bookings`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${user.token}` },
        body: JSON.stringify({ roomId: room.id, checkIn, checkOut }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || data.message || `Booking failed (${response.status})`);
      setNotice(`${room.name} reserved successfully.`);
    } catch (error) { setNotice(`${error.message}. Please check the backend response.`); }
    finally { setBusy(false); }
  }

  function signOut() { localStorage.removeItem('stayhubUser'); setUser(null); setNotice('You have signed out.'); }
  function toggleSaved(id) { setSaved((old) => old.includes(id) ? old.filter((item) => item !== id) : [...old, id]); }

  return <div className="app-shell">
    <header className="site-header">
      <a className="brand" href="#top" aria-label="StayHub home"><span className="brand-mark"><Compass size={20} strokeWidth={2.2} /></span><span>stay<span className="brand-light">hub</span></span></a>
      <nav className={`nav-links ${mobileMenu ? 'nav-open' : ''}`}>
        <a href="#stays" onClick={() => setMobileMenu(false)}>Explore stays</a><a href="#why" onClick={() => setMobileMenu(false)}>Why StayHub</a>
        <a href="#footer" onClick={() => setMobileMenu(false)}>About</a>
      </nav>
      <div className="header-actions">
        {user ? <><span className="signed-in">Signed in</span><button className="button button-outline button-small" onClick={signOut}>Sign out</button></> : <><button className="button button-ghost button-small" onClick={() => { setNotice(''); setModal('login'); }}>Log in</button><button className="button button-dark button-small" onClick={() => { setNotice(''); setModal('register'); }}>Sign up <ArrowRight size={15} /></button></>}
      </div>
      <button className="mobile-toggle" aria-label="Toggle menu" onClick={() => setMobileMenu(!mobileMenu)}>{mobileMenu ? <X /> : <Menu />}</button>
    </header>

    {notice && <div className="notice" role="status"><span>{notice}</span><button aria-label="Dismiss message" onClick={() => setNotice('')}><X size={16}/></button></div>}

    <main id="top">
      <section className="hero">
        <div className="hero-copy"><div className="eyebrow"><Sparkles size={14}/> YOUR NEXT CHAPTER STARTS HERE</div><h1>Find a place<br/>to <em>feel at home.</em></h1><p className="hero-subtitle">Thoughtful stays for the moments that matter. Find your kind of getaway, without the guesswork.</p>
          <div className="hero-proof"><div className="avatar-stack"><span>J</span><span>M</span><span>A</span><span>+</span></div><div><div className="proof-stars"><Star size={13} fill="currentColor"/><Star size={13} fill="currentColor"/><Star size={13} fill="currentColor"/><Star size={13} fill="currentColor"/><Star size={13} fill="currentColor"/><b>Guest-loved stays</b></div><span className="proof-caption">Made for a better kind of travel</span></div></div>
        </div>
        <div className="hero-art"><img src="https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=1500&q=90" alt="Warm, modern hotel bedroom"/><div className="image-caption"><span className="caption-dot"/><span><b>A little room to breathe</b><small>Stay somewhere that feels right</small></span><ArrowRight size={19}/></div><div className="floating-note"><span className="note-icon"><ShieldCheck size={19}/></span><span><b>Stay with confidence</b><small>Easy booking, clear details</small></span></div></div>
      </section>

      <section className="search-wrap" aria-label="Search for a stay"><form className="search-panel" onSubmit={(e) => { e.preventDefault(); document.getElementById('stays')?.scrollIntoView({ behavior: 'smooth' }); }}>
        <label className="search-field destination-field"><span className="field-icon"><Search size={19}/></span><span className="field-content"><span className="field-label">WHAT ARE YOU LOOKING FOR?</span><input value={searchText} onChange={(e) => setSearchText(e.target.value)} placeholder="Room type or keyword" aria-label="Search room type"/></span></label>
        <label className="search-field"><span className="field-icon"><CalendarDays size={19}/></span><span className="field-content"><span className="field-label">CHECK IN</span><input type="date" min={dateString(today)} value={checkIn} onChange={(e) => setCheckIn(e.target.value)} aria-label="Check in date" required/></span></label>
        <label className="search-field"><span className="field-icon"><CalendarDays size={19}/></span><span className="field-content"><span className="field-label">CHECK OUT</span><input type="date" min={checkIn || dateString(today)} value={checkOut} onChange={(e) => setCheckOut(e.target.value)} aria-label="Check out date" required/></span></label>
        <label className="search-field guests-field"><span className="field-icon"><Users size={19}/></span><span className="field-content"><span className="field-label">TRAVELERS</span><select value={guests} onChange={(e) => setGuests(e.target.value)} aria-label="Number of guests"><option>1 guest</option><option>2 guests</option><option>3 guests</option><option>4+ guests</option></select></span><ChevronDown size={15} className="select-chevron"/></label>
        <button className="search-button" type="submit"><Search size={18}/><span>Find a stay</span></button>
      </form><div className="search-footnote"><span><Check size={14}/> Thoughtful places, fair prices</span><span><Check size={14}/> Your trip, your pace</span><span className={`api-indicator ${apiStatus}`}><span className="status-dot"/>{apiStatus === 'connected' ? 'Live room data' : apiStatus === 'loading' ? 'Connecting to your API…' : 'Preview rooms · API offline'}</span></div></section>

      <section className="stays-section" id="stays"><div className="section-heading"><div><div className="eyebrow">A GOOD PLACE TO START</div><h2>Stays worth slowing down for<span>.</span></h2><p>Pick a room that suits your trip and make it yours.</p></div><div className="filter-wrap"><SlidersHorizontal size={17}/><select aria-label="Filter by maximum price" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)}><option value="all">All prices</option><option value="75">Up to 75 / night</option><option value="125">Up to 125 / night</option><option value="200">Up to 200 / night</option></select><ChevronDown size={14}/></div></div>
        <div className="room-grid">{filteredRooms.map((room, index) => <article className="room-card" key={room.id}><div className="room-image"><img src={room.image || fallbackRooms[index % fallbackRooms.length].image} alt={room.name} loading="lazy"/><span className="room-tag">{room.tag || (index === 0 ? 'Guest favorite' : index === 1 ? 'More space' : 'Great value')}</span><button className={`save-button ${saved.includes(room.id) ? 'is-saved' : ''}`} onClick={() => toggleSaved(room.id)} aria-label={saved.includes(room.id) ? 'Remove from saved rooms' : 'Save room'}><Heart size={18} fill={saved.includes(room.id) ? 'currentColor' : 'none'}/></button></div><div className="room-info"><div className="room-title-row"><h3>{room.name}</h3><span className="rating"><Star size={14} fill="currentColor"/> 4.9</span></div><p>{room.description || 'A welcoming space for a comfortable stay.'}</p><div className="room-bottom"><div className="room-price"><strong>{Number(room.price).toLocaleString()}</strong><span>/ night</span></div><button className="room-book" onClick={() => bookRoom(room)} disabled={busy}>{busy ? 'Please wait…' : 'Reserve'} <ArrowRight size={16}/></button></div></div></article>)}</div>
        {filteredRooms.length === 0 && <div className="empty-state"><Search size={25}/><h3>No rooms match that search</h3><p>Try a different keyword or price range.</p><button className="button button-outline" onClick={() => { setSearchText(''); setMaxPrice('all'); }}>Clear filters</button></div>}
        <div className="room-count">Showing <b>{filteredRooms.length}</b> of {rooms.length} available room types <span>·</span> Prices are shown in your configured currency</div>
      </section>

      <section className="why-section" id="why"><div className="why-intro"><div className="eyebrow">THE STAYHUB DIFFERENCE</div><h2>Travel should feel<br/><em>like the good part.</em></h2><p>Less time worrying about where to stay. More time enjoying why you went.</p><a href="#stays" className="text-link">Find your stay <ArrowRight size={16}/></a></div><div className="benefit-grid"><div className="benefit"><span className="benefit-icon"><ShieldCheck size={22}/></span><h3>Book with confidence</h3><p>A straightforward experience from choosing your room to confirming your stay.</p></div><div className="benefit"><span className="benefit-icon"><Heart size={22}/></span><h3>Spaces with character</h3><p>Find a comfortable place that fits the way you like to travel.</p></div><div className="benefit"><span className="benefit-icon"><Sparkles size={22}/></span><h3>Simple by design</h3><p>Clear choices and less clutter, so planning feels easy.</p></div><div className="benefit"><span className="benefit-icon"><Compass size={22}/></span><h3>Your trip, your way</h3><p>Whether it’s a quick reset or a longer escape, start here.</p></div></div></section>
      <section className="closing-cta"><div><div className="eyebrow">YOUR NEXT STAY IS CLOSER</div><h2>A change of place<br/>can change everything.</h2></div><a className="button button-cream" href="#stays">Explore rooms <ArrowRight size={17}/></a><div className="cta-decoration" aria-hidden="true">s.</div></section>
    </main>
    <footer id="footer"><a className="brand footer-brand" href="#top"><span className="brand-mark"><Compass size={19}/></span><span>stay<span className="brand-light">hub</span></span></a><p>Find your place. Make it a stay.</p><span className="footer-copy">© {new Date().getFullYear()} StayHub. Made for better getaways.</span></footer>

    {modal && <div className="modal-backdrop" role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) setModal(''); }}><section className="auth-modal" role="dialog" aria-modal="true" aria-labelledby="auth-title"><button className="modal-close" onClick={() => setModal('')} aria-label="Close"><X size={20}/></button><div className="modal-brand"><span className="brand-mark"><Compass size={19}/></span><span>stay<span className="brand-light">hub</span></span></div><div className="eyebrow">WELCOME {modal === 'login' ? 'BACK' : 'TO STAYHUB'}</div><h2 id="auth-title">{modal === 'login' ? 'Good to see you.' : 'Make yourself at home.'}</h2><p>{modal === 'login' ? 'Sign in to manage your next stay.' : 'Create an account to start planning your stays.'}</p><form onSubmit={submitAuth} className="auth-form">{modal === 'register' && <label>Full name<input name="name" type="text" placeholder="Your name" minLength="3" required/></label>}<label>Email address<input name="email" type="email" placeholder="you@example.com" autoComplete="email" required/></label><label>Password<input name="password" type="password" placeholder="At least 8 characters" minLength="8" autoComplete={modal === 'login' ? 'current-password' : 'new-password'} required/></label><button className="button button-dark auth-submit" disabled={busy}>{busy ? 'Please wait…' : modal === 'login' ? 'Log in' : 'Create account'} <ArrowRight size={16}/></button></form><div className="auth-switch">{modal === 'login' ? 'New to StayHub?' : 'Already have an account?'} <button onClick={() => { setNotice(''); setModal(modal === 'login' ? 'register' : 'login'); }}>{modal === 'login' ? 'Sign up' : 'Log in'}</button></div></section></div>}
  </div>;
}

export default App;
