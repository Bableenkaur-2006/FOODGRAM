import React from 'react'
import { useParams } from 'react-router-dom'
import '../../styles/reels.css'
import '../../styles/profile.css'
import { Link } from 'react-router-dom'
import api from "../../config/axios";

// Clean Saved.jsx: load savedVideos, sync with server to remove deleted items, persist, and render
const Saved = () => {
  const [items, setItems] = React.useState([])

  const params = useParams();

  React.useEffect(() => {
    (async () => {
      try {
        const userId = params && params.userId ? params.userId : null;

        // If a userId is provided in the route, prefer the server's per-user saved list
        if (userId) {
          try {
            const resp = await api.get(`/api/user/${userId}/saved`, { withCredentials: true });
            const data = resp && resp.data ? (Array.isArray(resp.data) ? resp.data : (resp.data.saved || resp.data.items || [])) : [];
            if (Array.isArray(data) && data.length) {
              setItems(data.map(i => (i && (i._id || i.id)) ? i : { _id: i }));
              return;
            }
          } catch (err) {
            console.info('Saved: per-user fetch failed, falling back to localStorage', err && err.message);
          }
        }

        // Fallback: localStorage id-array resolution
        const raw = typeof window !== 'undefined' ? localStorage.getItem('savedVideos') : null;
        let parsed = [];
        try { parsed = raw ? JSON.parse(raw) : [] } catch (e) { parsed = [] }

        const savedIds = Array.isArray(parsed)
          ? parsed.map(entry => (entry && typeof entry === 'object') ? (entry._id || entry.id) : entry).filter(Boolean)
          : [];
        const uniqIds = Array.from(new Set(savedIds));

        // Fetch server items to resolve ids to objects
        let serverItems = [];
        const paths = ['/api/food/public', '/api/food'];
        for (const path of paths) {
          try {
            const resp = await fetch(path, { credentials: 'include' });
            if (!resp || resp.status >= 400) continue;
            const data = await resp.json();
            serverItems = Array.isArray(data) ? data : (data.foodItems || data.videos || data.data || []);
            if (serverItems && serverItems.length) break;
          } catch (err) { /* ignore */ }
        }

        const serverById = {};
        (serverItems || []).forEach(i => { const id = i._id || i.id; if (id) serverById[id] = i; });

        const finalIds = uniqIds.filter(id => (Object.keys(serverById).length === 0) ? true : !!serverById[id]);
        localStorage.setItem('savedVideos', JSON.stringify(finalIds));
        const rendered = finalIds.map(id => serverById[id] || { _id: id });
        setItems(rendered);
      } catch (e) {
        console.error('Saved: sync error', e);
        setItems([]);
      }
    })();
  }, [params]);

  const validItems = items.filter(item => item && (item.video || item.url || item.videoUrl || item.src));

  return (
    <div className="profile-page">
      <div className="profile-card">
        <div className="profile-header">
          <div className="avatar" style={{backgroundImage:`url(https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&q=60)`}} />
          <div className="profile-info">
            <div className="biz-name">Saved reels</div>
            <div className="biz-address">Your saved food and reels</div>
          </div>
        </div>

        <div className="profile-stats">
          <div className="stat">
            <div className="label">saved</div>
            <div className="value">{validItems.length}</div>
          </div>
          <div className="stat">
            <div className="label">collections</div>
            <div className="value">1</div>
          </div>
        </div>

        {(!validItems || validItems.length === 0) ? (
          <div style={{padding: '60px 24px', textAlign: 'center'}}>
            <div style={{fontSize: 64, marginBottom: 24}}>📱</div>
            <h3 style={{fontSize:20, fontWeight:700}}>No saved videos</h3>
            <p style={{color: '#64748b'}}>Start exploring and save your favorite food videos to build your collection</p>
            <Link to="/general" style={{display:'inline-block', marginTop:20, padding:'12px 20px', background:'#3b82f6', color:'#fff', borderRadius:12, textDecoration:'none'}}>Explore Food Reels</Link>
          </div>
        ) : (
          <div className="video-grid">
            {validItems.map((item, i) => {
              const src = item.video || item.url || item.videoUrl || item.src;
              const desc = item.description || item.name || 'Saved item';
              const key = item._id || item.id || i;
              return (
                <div className="video-item" key={key}>
                  <video src={src} muted loop playsInline preload="metadata" controlsList="nodownload nofullscreen" disablePictureInPicture style={{width:'100%', height:'100%'}} />
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default Saved

