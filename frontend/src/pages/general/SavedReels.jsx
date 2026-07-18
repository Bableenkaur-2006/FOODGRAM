import React, { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import api from "../../config/axios";
import '../../styles/reels.css'
import '../../styles/profile.css'

// Add custom styles for SavedReels
const customStyles = `
  @keyframes pulse {
    0% { transform: scale(1); }
    100% { transform: scale(1.05); }
  }
  
  @keyframes heartbeat {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.1); }
  }
  
  .saved-reel-item {
    position: relative;
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  }
  
  .saved-reel-item:hover {
    transform: translateY(-6px) scale(1.02);
  }
  
  .saved-reel-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(180deg, transparent 0%, transparent 50%, rgba(0,0,0,0.8) 100%);
    opacity: 0;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    border-radius: 18px;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    padding: 16px 12px 12px;
  }
  
  .saved-reel-item:hover .saved-reel-overlay {
    opacity: 1;
  }
  
  .saved-actions {
    display: flex;
    gap: 8px;
    align-items: center;
    margin-top: 8px;
  }
`;

const SavedReels = () => {
  const [items, setItems] = useState([])

  const params = useParams();

  useEffect(() => {
    // Inject custom styles
    const styleSheet = document.createElement('style');
    styleSheet.type = 'text/css';
    styleSheet.innerText = customStyles;
    document.head.appendChild(styleSheet);

    // If a userId route param is present, prefer fetching the saved list from the server
    (async () => {
      try {
        const userId = params && params.userId ? params.userId : null;

        if (userId) {
          // Try backend endpoint for user's saved list
          try {
            const resp = await api.get(`/api/user/${userId}/saved`, { withCredentials: true });
            const data = resp && resp.data ? (Array.isArray(resp.data) ? resp.data : (resp.data.saved || resp.data.items || [])) : [];
            if (Array.isArray(data) && data.length) {
              setItems(data.map(i => (i && (i._id || i.id)) ? i : { _id: i }));
              return;
            }
          } catch (err) {
            // fallback to local logic if endpoint not available or returns error
            console.info('SavedReels: per-user saved fetch failed, falling back to localStorage', err && err.message);
          }
        }

        // Fallback: localStorage-based id-array resolution (existing behavior)
        const raw = localStorage.getItem('savedVideos');
        const arr = raw ? JSON.parse(raw) : [];

        // Normalize to id-array
        const savedIds = Array.isArray(arr)
          ? arr.map(entry => (entry && typeof entry === 'object') ? (entry._id || entry.id) : entry).filter(Boolean)
          : [];

        const uniqIds = Array.from(new Set(savedIds));

        // Fetch server items to render previews and to know which ids still exist
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
        serverItems.forEach(i => { const id = i._id || i.id; if (id) serverById[id] = i; });

        const finalIds = uniqIds.filter(id => (Object.keys(serverById).length === 0) ? true : !!serverById[id]);
        localStorage.setItem('savedVideos', JSON.stringify(finalIds));
        const rendered = finalIds.map(id => serverById[id] || { _id: id });
        setItems(rendered);
      } catch (e) {
        console.error('Error loading/syncing saved videos:', e);
        setItems([]);
      }
    })();

    // Listen for savedVideos updates so this view refreshes immediately
    const handleSavedUpdated = () => {
      try {
        const raw = localStorage.getItem('savedVideos');
        const arr = raw ? JSON.parse(raw) : [];
        const savedIds = Array.isArray(arr) ? arr.map(entry => (entry && typeof entry === 'object') ? (entry._id || entry.id) : entry).filter(Boolean) : [];
        // Map to server items (best-effort)
        (async () => {
          try {
            const paths = ['/api/food/public', '/api/food'];
            let serverItems = [];
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
            serverItems.forEach(i => { const id = i._id || i.id; if (id) serverById[id] = i; });
            const rendered = savedIds.map(id => serverById[id] || { _id: id });
            setItems(rendered);
          } catch (err) {
            setItems(savedIds.map(id => ({ _id: id })));
          }
        })();
      } catch (e) {
        console.error('SavedReels: failed to reload savedVideos on update', e);
      }
    };

    window.addEventListener('savedVideosUpdated', handleSavedUpdated);
    const onStorage = (ev) => { if (ev.key === 'savedVideos') handleSavedUpdated(); };
    window.addEventListener('storage', onStorage);

    return () => {
      // Cleanup styles on unmount
      document.head.removeChild(styleSheet);
      window.removeEventListener('savedVideosUpdated', handleSavedUpdated);
      window.removeEventListener('storage', onStorage);
    };
  }, [])

  if (!items || items.length === 0) {
    return (
      <div className="profile-page">
        <div className="profile-card">
          <div className="profile-header">
            <div 
              className="avatar" 
              style={{
                background: 
                  'linear-gradient(135deg, #f87171 0%, #fb7185 50%, #f472b6 100%), ' +
                  'radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.3) 0%, transparent 70%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '28px',
                color: 'white'
              }} 
            >
              ❤️
            </div>
            <div className="profile-info">
              <div className="biz-name">Saved Reels</div>
              <div className="biz-address">❤️ Your saved food and reels</div>
            </div>
          </div>

          <div className="profile-stats">
            <div className="stat">
              <div className="label">saved</div>
              <div className="value">0</div>
            </div>
            <div className="stat">
              <div className="label">collections</div>
              <div className="value">1</div>
            </div>
            <div className="stat">
              <div className="label">favorites</div>
              <div className="value">0</div>
            </div>
          </div>

          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '80px 32px 60px',
            textAlign: 'center',
            minHeight: '320px',
            background: 
              'radial-gradient(circle at 50% 30%, rgba(59, 130, 246, 0.03) 0%, transparent 60%), ' +
              'radial-gradient(circle at 50% 70%, rgba(236, 72, 153, 0.02) 0%, transparent 60%)'
          }}>
            <div style={{
              width: '120px',
              height: '120px',
              borderRadius: '50%',
              background: 
                'linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(236, 72, 153, 0.06) 100%), ' +
                'linear-gradient(180deg, rgba(255, 255, 255, 0.9) 0%, rgba(248, 250, 252, 0.8) 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '48px',
              marginBottom: '32px',
              border: '2px solid rgba(59, 130, 246, 0.08)',
              boxShadow: 
                '0 20px 40px rgba(0, 0, 0, 0.04), ' +
                'inset 0 1px 0 rgba(255, 255, 255, 0.8)'
            }}>
              📱
            </div>
            <h3 style={{
              fontSize: '24px',
              fontWeight: '800',
              color: '#1e293b',
              marginBottom: '16px',
              letterSpacing: '-0.03em',
              background: 'linear-gradient(135deg, #1e293b 0%, #3b82f6 70%, #ec4899 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>
              No saved reels yet
            </h3>
            <p style={{
              color: '#64748b',
              fontSize: '16px',
              marginBottom: '40px',
              lineHeight: 1.6,
              maxWidth: '320px',
              fontWeight: '500'
            }}>
              Discover amazing food content and save your favorites to build your personal collection
            </p>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              width: '100%',
              maxWidth: '280px'
            }}>
              <Link 
                to="/general" 
                style={{
                  background: 
                    'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 50%, #ec4899 100%), ' +
                    'linear-gradient(180deg, rgba(255, 255, 255, 0.1) 0%, transparent 100%)',
                  color: 'white',
                  textDecoration: 'none',
                  padding: '18px 28px',
                  borderRadius: '16px',
                  fontSize: '16px',
                  fontWeight: '700',
                  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '12px',
                  boxShadow: 
                    '0 12px 30px rgba(59, 130, 246, 0.25), ' +
                    '0 4px 12px rgba(0, 0, 0, 0.1), ' +
                    'inset 0 1px 0 rgba(255, 255, 255, 0.2)',
                  letterSpacing: '-0.02em'
                }}
                onMouseOver={(e) => {
                  e.target.style.transform = 'translateY(-4px) scale(1.02)';
                  e.target.style.boxShadow = 
                    '0 20px 50px rgba(59, 130, 246, 0.3), ' +
                    '0 12px 30px rgba(139, 92, 246, 0.2), ' +
                    'inset 0 1px 0 rgba(255, 255, 255, 0.3)';
                }}
                onMouseOut={(e) => {
                  e.target.style.transform = 'translateY(0) scale(1)';
                  e.target.style.boxShadow = 
                    '0 12px 30px rgba(59, 130, 246, 0.25), ' +
                    '0 4px 12px rgba(0, 0, 0, 0.1), ' +
                    'inset 0 1px 0 rgba(255, 255, 255, 0.2)';
                }}
              >
                <span style={{ fontSize: '20px' }}>�️</span>
                Explore Food Reels
              </Link>
              
              <div style={{
                display: 'flex',
                gap: '8px'
              }}>
                <Link 
                  to="/saved"
                  style={{
                    background: 'rgba(139, 92, 246, 0.08)',
                    color: '#8b5cf6',
                    textDecoration: 'none',
                    padding: '12px 16px',
                    borderRadius: '12px',
                    fontSize: '14px',
                    fontWeight: '600',
                    flex: 1,
                    textAlign: 'center',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    border: '1px solid rgba(139, 92, 246, 0.12)',
                    backdropFilter: 'blur(10px)'
                  }}
                  onMouseOver={(e) => {
                    e.target.style.background = 'rgba(139, 92, 246, 0.12)';
                    e.target.style.transform = 'translateY(-1px)';
                  }}
                  onMouseOut={(e) => {
                    e.target.style.background = 'rgba(139, 92, 246, 0.08)';
                    e.target.style.transform = 'translateY(0)';
                  }}
                >
                  📚 Collections
                </Link>
                
                <Link 
                  to="/food-partners"
                  style={{
                    background: 'rgba(236, 72, 153, 0.08)',
                    color: '#ec4899',
                    textDecoration: 'none',
                    padding: '12px 16px',
                    borderRadius: '12px',
                    fontSize: '14px',
                    fontWeight: '600',
                    flex: 1,
                    textAlign: 'center',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    border: '1px solid rgba(236, 72, 153, 0.12)',
                    backdropFilter: 'blur(10px)'
                  }}
                  onMouseOver={(e) => {
                    e.target.style.background = 'rgba(236, 72, 153, 0.12)';
                    e.target.style.transform = 'translateY(-1px)';
                  }}
                  onMouseOut={(e) => {
                    e.target.style.background = 'rgba(236, 72, 153, 0.08)';
                    e.target.style.transform = 'translateY(0)';
                  }}
                >
                  🏪 Partners
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="profile-page">
      <div className="profile-card">
        <div className="profile-header">
          <div 
            className="avatar" 
            style={{
              background: 
                'linear-gradient(135deg, #f87171 0%, #fb7185 50%, #f472b6 100%), ' +
                'radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.3) 0%, transparent 70%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '32px',
              color: 'white',
              animation: 'pulse 2s ease-in-out infinite alternate'
            }} 
          >
            ❤️
          </div>
          <div className="profile-info">
            <div className="biz-name">My Saved Reels</div>
            <div className="biz-address">❤️ Your curated food collection</div>
          </div>
        </div>

        <div className="profile-stats">
          <div className="stat">
            <div className="label">saved</div>
            <div className="value">{items.length}</div>
          </div>
          <div className="stat">
            <div className="label">collections</div>
            <div className="value">1</div>
          </div>
          <div className="stat">
            <div className="label">favorites</div>
            <div className="value">{items.filter(item => item.isLiked || item.liked).length}</div>
          </div>
        </div>

        <div className="video-grid">
          {items.map((video, i) => {
            const src = video.video || video.url || video.videoUrl || video.src
            const desc = video.description || video.originalname || video.name || 'Saved reel'
            const partnerId = video.foodPartner?._id || video.foodPartner || video.foodPartnerId || video.food_partner || null
            const partnerName = video.foodPartner?.name || video.foodPartner?.businessName || 'Restaurant'
            const key = video._id || video.id || i

            return (
              <div className="video-item saved-reel-item" key={key}>
                {src ? (
                  <>
                    <video
                      src={src}
                      muted
                      loop
                      playsInline
                      preload="metadata"
                      controls
                      controlsList="nodownload nofullscreen"
                      disablePictureInPicture
                      style={{ 
                        cursor: 'pointer', 
                        width: '100%', 
                        height: '100%', 
                        touchAction: 'manipulation' 
                      }}
                      onContextMenu={(e) => e.preventDefault()}
                      onDoubleClick={(e) => {
                        e.preventDefault();
                        try {
                          if (document.fullscreenElement) document.exitFullscreen();
                        } catch (err) {}
                        const v = e.currentTarget;
                        if (v.paused) {
                          const p = v.play();
                          if (p && p.catch) p.catch(() => {});
                        } else {
                          v.pause();
                        }
                      }}
                      onClick={(e) => {
                        const v = e.currentTarget;
                        if (v.paused) {
                          const p = v.play();
                          if (p && p.catch) p.catch(() => {});
                        } else {
                          v.pause();
                        }
                      }}
                    />
                    
                    {/* Elegant overlay with actions */}
                    <div className="saved-reel-overlay">
                      <div style={{
                        color: 'white',
                        fontSize: '13px',
                        fontWeight: '700',
                        marginBottom: '4px',
                        textShadow: '0 2px 4px rgba(0,0,0,0.8)',
                        lineHeight: 1.3,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {desc}
                      </div>
                      
                      {partnerName && (
                        <div style={{
                          color: 'rgba(255, 255, 255, 0.8)',
                          fontSize: '11px',
                          fontWeight: '500',
                          marginBottom: '8px',
                          textShadow: '0 1px 2px rgba(0,0,0,0.6)'
                        }}>
                          by {partnerName}
                        </div>
                      )}
                      
                      <div className="saved-actions">
                        {partnerId && (
                          <Link 
                            to={`/food-partner/${partnerId}`}
                            style={{
                              background: 
                                'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.9) 100%), ' +
                                'radial-gradient(circle at 30% 30%, rgba(59, 130, 246, 0.1) 0%, transparent 70%)',
                              color: '#3b82f6',
                              padding: '6px 12px',
                              borderRadius: '10px',
                              fontSize: '11px',
                              fontWeight: '700',
                              textDecoration: 'none',
                              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                              backdropFilter: 'blur(12px)',
                              border: '1px solid rgba(255, 255, 255, 0.2)',
                              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
                            }}
                            onMouseOver={(e) => {
                              e.target.style.background = 'white';
                              e.target.style.transform = 'translateY(-2px) scale(1.05)';
                              e.target.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.2)';
                            }}
                            onMouseOut={(e) => {
                              e.target.style.background = 
                                'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.9) 100%), ' +
                                'radial-gradient(circle at 30% 30%, rgba(59, 130, 246, 0.1) 0%, transparent 70%)';
                              e.target.style.transform = 'translateY(0) scale(1)';
                              e.target.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
                            }}
                          >
                            🏪 Visit
                          </Link>
                        )}
                        
                        <button
                          style={{
                            background: 
                              'linear-gradient(135deg, rgba(239, 68, 68, 0.95) 0%, rgba(220, 38, 127, 0.9) 100%), ' +
                              'radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.2) 0%, transparent 70%)',
                            color: 'white',
                            border: 'none',
                            padding: '6px 12px',
                            borderRadius: '10px',
                            fontSize: '11px',
                            fontWeight: '700',
                            cursor: 'pointer',
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            backdropFilter: 'blur(12px)',
                            boxShadow: '0 2px 8px rgba(239, 68, 68, 0.3)'
                          }}
                          onClick={(e) => {
                              e.stopPropagation();
                              const id = video && (video._id || video.id);
                              // Remove id from persisted id-array
                              try {
                                const raw = localStorage.getItem('savedVideos');
                                const arr = raw ? JSON.parse(raw) : [];
                                const savedIds = Array.isArray(arr) ? arr.map(entry => (entry && typeof entry === 'object') ? (entry._id || entry.id) : entry).filter(Boolean) : [];
                                const updatedIds = savedIds.filter(x => x !== id);
                                localStorage.setItem('savedVideos', JSON.stringify(updatedIds));
                                // Update rendered items
                                setItems(prev => prev.filter(it => (it && (it._id || it.id)) ? (it._id || it.id) !== id : true));
                                try { window.dispatchEvent(new Event('savedVideosUpdated')); } catch (e) { /* ignore */ }
                              } catch (err) {
                                console.error('Failed to remove saved id', err);
                              }
                            }}
                          onMouseOver={(e) => {
                            e.target.style.background = 
                              'linear-gradient(135deg, rgba(239, 68, 68, 1) 0%, rgba(220, 38, 127, 1) 100%)';
                            e.target.style.transform = 'translateY(-2px) scale(1.05)';
                            e.target.style.boxShadow = '0 4px 15px rgba(239, 68, 68, 0.4)';
                          }}
                          onMouseOut={(e) => {
                            e.target.style.background = 
                              'linear-gradient(135deg, rgba(239, 68, 68, 0.95) 0%, rgba(220, 38, 127, 0.9) 100%), ' +
                              'radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.2) 0%, transparent 70%)';
                            e.target.style.transform = 'translateY(0) scale(1)';
                            e.target.style.boxShadow = '0 2px 8px rgba(239, 68, 68, 0.3)';
                          }}
                        >
                          ❤️ Remove
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="video-fallback" style={{
                    background: 
                      'linear-gradient(135deg, rgba(59, 130, 246, 0.06) 0%, rgba(236, 72, 153, 0.04) 100%), ' +
                      'linear-gradient(180deg, rgba(255, 255, 255, 0.9) 0%, rgba(248, 250, 252, 0.8) 100%)',
                    border: '2px dashed rgba(59, 130, 246, 0.2)',
                    borderRadius: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '20px 12px',
                    textAlign: 'center'
                  }}>
                    <div style={{
                      fontSize: '36px',
                      marginBottom: '8px',
                      background: 'linear-gradient(135deg, #3b82f6 0%, #ec4899 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text'
                    }}>🎬</div>
                    <div style={{
                      fontSize: '11px',
                      fontWeight: '700',
                      color: '#64748b',
                      marginBottom: '4px'
                    }}>
                      Preview Unavailable
                    </div>
                    <div style={{
                      fontSize: '10px',
                      fontWeight: '500',
                      color: '#94a3b8',
                      lineHeight: 1.3
                    }}>
                      {desc}
                    </div>
                    
                    <button
                      style={{
                        background: 'rgba(239, 68, 68, 0.08)',
                        color: '#ef4444',
                        border: 'none',
                        padding: '4px 8px',
                        borderRadius: '6px',
                        fontSize: '9px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        marginTop: '8px',
                        transition: 'all 0.2s ease'
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        const updatedItems = items.filter(item => item !== video);
                        setItems(updatedItems);
                        localStorage.setItem('savedVideos', JSON.stringify(updatedItems));
                        try { window.dispatchEvent(new Event('savedVideosUpdated')); } catch (e) { /* ignore */ }
                      }}
                      onMouseOver={(e) => {
                        e.target.style.background = 'rgba(239, 68, 68, 0.12)';
                      }}
                      onMouseOut={(e) => {
                        e.target.style.background = 'rgba(239, 68, 68, 0.08)';
                      }}
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  )
}

export default SavedReels
