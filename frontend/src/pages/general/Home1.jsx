import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../../styles/reels.css';

const Home1 = () => {
    const navigate = useNavigate();
        const [videos, setVideos] = useState([]);
        const [savedVideos, setSavedVideos] = useState(new Set());
    const [likedVideos, setLikedVideos] = useState(new Set());
    const [likeInFlight, setLikeInFlight] = useState(new Set()); // track in-flight like toggles
    const [saveInFlight, setSaveInFlight] = useState(new Set()); // track in-flight save toggles

        const fetchVideos = useCallback(async () => {
            // Prefer the public feed so non-authenticated users (and regular users) see partner items
            const paths = ['/api/food/public', '/api/food'];
            let items = [];

            for (const path of paths) {
                try {
                    const resp = await axios.get(path);
                    const data = resp.data;
                    items = Array.isArray(data) ? data : (data.foodItems || data.videos || data.data || []);
                    if (items && items.length) break; // stop on first successful non-empty result
                } catch (err) {
                    console.info('fetchVideos: failed to fetch', path, err && err.response && err.response.status);
                    // try next path
                }
            }

            if (!items || items.length === 0) {
                // If we're viewing a food partner's profile, do NOT show dummy fallback videos.
                // Instead leave the list empty so the profile page can show "No videos uploaded".
                const path = (typeof window !== 'undefined' && window.location && window.location.pathname) ? window.location.pathname : '';
                const viewingPartnerProfile = path.includes('/food-partner/');

                if (viewingPartnerProfile) {
                    items = [];
                } else {
                    // Fallback sample data with working video URLs for the general feed only
                    items = [
                        {
                            _id: '1',
                            video: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
                            name: 'Delicious Food Sample',
                            description: 'Amazing food from our kitchen',
                            likes: 23,
                            saves: 23,
                            comments: 45,
                            foodPartner: { name: 'Sample Restaurant', _id: 'sample1' }
                        },
                        {
                            _id: '2',
                            video: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
                            name: 'Fresh Cooking Video',
                            description: 'Fresh ingredients, amazing taste',
                            likes: 34,
                            saves: 15,
                            comments: 28,
                            foodPartner: { name: 'Food Corner', _id: 'sample2' }
                        },
                        {
                            _id: '3',
                            video: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
                            name: 'Spicy Delights',
                            description: 'Hot and spicy food that will blow your mind',
                            likes: 67,
                            saves: 45,
                            comments: 89,
                            foodPartner: { name: 'Spice House', _id: 'sample3' }
                        }
                    ];
                }
            }

            // Convert to a normalized video shape (use server-provided counts; default to 0)
            const videoItems = items.map((item) => ({
                _id: String(item._id ?? item.id ?? Math.random().toString()),
                url: item.video || item.videoUrl || item.url || item.src,
                name: item.name || item.title || 'Delicious Food',
                description: item.description || 'Fresh and delicious food from our kitchen',
                foodPartner: item.foodPartner || item.food_partner || item.creator || null,
                // Prefer new server-side counters but fall back to older property names
                likes: Math.max(0, Number(item.likeCount ?? item.likes ?? 0)),
                saves: Math.max(0, Number(item.saveCount ?? item.saves ?? 0)),
                comments: Math.max(0, Number(item.comments ?? 0)),
                // If backend annotated per-user flags, keep them for UI state
                liked: !!item.liked,
                saved: !!item.saved
            })).filter(i => i.url);

            // Use authoritative server counts. If the server returned per-user liked/saved flags
            // (when authenticated), use those to initialize the local sets so the heart/bookmark
            // buttons reflect the user's server-side state.
            setVideos(videoItems);
            try {
                const likedFromServer = videoItems.filter(v => v.liked).map(v => v._id);
                const savedFromServer = videoItems.filter(v => v.saved).map(v => v._id);
                if (likedFromServer.length) {
                    setLikedVideos(new Set(likedFromServer));
                    localStorage.setItem('likedVideos', JSON.stringify(Array.from(new Set(likedFromServer))));
                }
                if (savedFromServer.length) {
                    setSavedVideos(new Set(savedFromServer));
                    // persist to a user-scoped key if we can detect current user
                    try {
                        const userKey = getSavedStorageKey();
                        localStorage.setItem(userKey, JSON.stringify(savedFromServer));
                    } catch (e) { localStorage.setItem('savedVideos', JSON.stringify(savedFromServer)); }
                }
            } catch (e) { /* ignore */ }
        }, []);

        // Initial load + listeners
        useEffect(() => {
            fetchVideos();

            // Listen for refresh events from login or video creation
            const handleRefresh = () => fetchVideos();
            window.addEventListener('profileRefresh', handleRefresh);
            window.addEventListener('videoCreated', handleRefresh);

            return () => {
                window.removeEventListener('profileRefresh', handleRefresh);
                window.removeEventListener('videoCreated', handleRefresh);
            };
        }, [fetchVideos]);

        // Load saved videos and likes from localStorage (normalize both old and new formats)
        useEffect(() => {
                try {
                const rawSaved = localStorage.getItem(getSavedStorageKey()) || localStorage.getItem('savedVideos') || '[]';
                const parsedSaved = JSON.parse(rawSaved);
                const rawLiked = localStorage.getItem('likedVideos') || '[]';
                const parsedLiked = JSON.parse(rawLiked);

                // Normalize saved to an array of ids (handle both array of objects and array of ids)
                let savedIds = [];
                if (Array.isArray(parsedSaved)) {
                    if (parsedSaved.length > 0 && typeof parsedSaved[0] === 'object') {
                        savedIds = parsedSaved.map(v => String(v._id || v.id)).filter(Boolean);
                    } else {
                        // assume array of ids
                        savedIds = parsedSaved.map(v => String(v)).filter(Boolean);
                    }
                }

                const likedIds = Array.isArray(parsedLiked) ? parsedLiked.filter(Boolean) : [];

                setSavedVideos(new Set(savedIds.map(String)));
                setLikedVideos(new Set(likedIds));
            } catch (error) {
                console.error('Error loading saved videos:', error);
                setSavedVideos(new Set());
                setLikedVideos(new Set());
            }
        }, []);

        // Helper: determine current user id (best-effort). This tries several common locations.
        function getCurrentUserId() {
            try {
                // common patterns: stored as JSON under 'user' or 'currentUser' or 'me'
                const maybe = localStorage.getItem('currentUser') || localStorage.getItem('user') || localStorage.getItem('me') || null;
                if (maybe) {
                    try { const parsed = JSON.parse(maybe); return parsed && (parsed._id || parsed.id || parsed.userId) ? String(parsed._id || parsed.id || parsed.userId) : null; } catch(e) {}
                }
                // maybe a raw id stored under 'userId'
                const raw = localStorage.getItem('userId') || localStorage.getItem('uid');
                if (raw) return String(raw);
            } catch (e) { /* ignore */ }
            return null;
        }

        function getSavedStorageKey(userId) {
            const uid = (userId || getCurrentUserId());
            return uid ? `savedVideos:${uid}` : 'savedVideos';
        }

        // Toggle like: attempt backend update, fall back to local-only when not authenticated
        const handleLike = async (videoId) => {
            // prevent duplicate simultaneous requests for the same video
            if (likeInFlight.has(videoId)) return;
            setLikeInFlight(prev => {
                const next = new Set(prev);
                next.add(videoId);
                return next;
            });
            try {
                const resp = await axios.post('/api/food/like', { foodId: videoId }, { withCredentials: true });

                // If the backend returned an authoritative likeCount, use it to update the UI immediately.
                if (resp && resp.data && typeof resp.data.likeCount === 'number') {
                    setVideos(prev => prev.map(v => v._id === videoId ? ({ ...v, likes: resp.data.likeCount }) : v));
                } else {
                    // Try to refresh the single item if possible, otherwise refresh the whole feed
                    let refreshed = false;
                    try {
                        const single = await axios.get(`/api/food/${videoId}`);
                            if (single && single.data) {
                            const serverItem = Array.isArray(single.data) ? single.data[0] : (single.data.foodItem || single.data.video || single.data);
                                if (serverItem) {
                                setVideos(prev => prev.map(v => v._id === videoId ? ({ ...v, likes: Math.max(0, Number(serverItem.likeCount ?? serverItem.likes ?? v.likes)), saves: Math.max(0, Number(serverItem.saveCount ?? serverItem.saves ?? v.saves)) }) : v));
                                refreshed = true;
                            }
                        }
                    } catch (e) { /* ignore */ }
                    if (!refreshed) {
                        try { await fetchVideos(); } catch (e) { /* ignore */ }
                    }
                }

                // Update local liked set based on status/message when possible
                try {
                    if (resp && resp.status === 201) {
                        const newSet = new Set(likedVideos);
                        newSet.add(videoId);
                        setLikedVideos(newSet);
                        localStorage.setItem('likedVideos', JSON.stringify(Array.from(newSet)));
                    } else if (resp && resp.status === 200 && resp.data && typeof resp.data.message === 'string' && resp.data.message.toLowerCase().includes('unliked')) {
                        const newSet = new Set(likedVideos);
                        newSet.delete(videoId);
                        setLikedVideos(newSet);
                        localStorage.setItem('likedVideos', JSON.stringify(Array.from(newSet)));
                    }
                } catch (e) { /* ignore */ }
            } catch (err) {
                // If backend fails (not authenticated or network), fall back to local toggle
                console.warn('Like API failed, toggling locally', err && err.message);
                const newLikedVideos = new Set(likedVideos);
                if (newLikedVideos.has(videoId)) {
                    newLikedVideos.delete(videoId);
                    setVideos(prev => prev.map(v => v._id === videoId ? { ...v, likes: Math.max(0, v.likes - 1) } : v));
                } else {
                    newLikedVideos.add(videoId);
                    setVideos(prev => prev.map(v => v._id === videoId ? { ...v, likes: v.likes + 1 } : v));
                }
                setLikedVideos(newLikedVideos);
                localStorage.setItem('likedVideos', JSON.stringify(Array.from(newLikedVideos)));
            } finally {
                setLikeInFlight(prev => {
                    const next = new Set(prev);
                    next.delete(videoId);
                    return next;
                });
            }
        };

        // Toggle save: call backend /api/food/save when possible, otherwise update localStorage
        const handleSave = async (rawVideoId) => {
            const videoId = String(rawVideoId);
            if (saveInFlight.has(videoId)) return;
            setSaveInFlight(prev => { const s = new Set(prev); s.add(videoId); return s; });

            const isCurrentlySaved = savedVideos.has(videoId);
            const videoToSave = videos.find(video => String(video._id) === videoId);
            if (!videoToSave) {
                setSaveInFlight(prev => { const s = new Set(prev); s.delete(videoId); return s; });
                return;
            }

            // Optimistically toggle UI
            if (isCurrentlySaved) {
                setSavedVideos(prev => { const s = new Set(prev); s.delete(videoId); return s; });
                setVideos(prev => prev.map(v => v._id === videoId ? ({ ...v, saves: Math.max(0, (v.saves || 0) - 1) }) : v));
            } else {
                setSavedVideos(prev => { const s = new Set(prev); s.add(videoId); return s; });
                setVideos(prev => prev.map(v => v._id === videoId ? ({ ...v, saves: (Number(v.saves) || 0) + 1 }) : v));
            }

            // Persist optimistic change to localStorage (id-array)
            try {
                const current = Array.from(savedVideos).map(String);
                let nextIds = [];
                if (isCurrentlySaved) {
                    nextIds = current.filter(id => id !== videoId);
                } else {
                    nextIds = Array.from(new Set(current.concat([videoId])));
                }
                localStorage.setItem('savedVideos', JSON.stringify(nextIds));
                try { window.dispatchEvent(new Event('savedVideosUpdated')); } catch (e) { /* ignore */ }
            } catch (e) { /* ignore */ }

            try {
                const resp = await axios.post('/api/food/save', { foodId: videoId }, { withCredentials: true });
                // If server returned authoritative saveCount, use it
                if (resp && resp.data && typeof resp.data.saveCount === 'number') {
                    const clamp = Math.max(0, Number(resp.data.saveCount));
                    setVideos(prev => prev.map(v => v._id === videoId ? ({ ...v, saves: clamp }) : v));
                } else if (resp && resp.status === 200 && resp.data && typeof resp.data.message === 'string' && resp.data.message.toLowerCase().includes('unsaved')) {
                    // server removed save
                    setSavedVideos(prev => { const s = new Set(prev); s.delete(videoId); return s; });
                } else if (resp && (resp.status === 201 || (resp.data && resp.data.saved))) {
                    // server confirmed saved
                    setSavedVideos(prev => { const s = new Set(prev); s.add(videoId); return s; });
                }

                // reconcile persisted ids with server/source-of-truth
                try { await fetchVideos(); } catch (e) { /* ignore */ }
            } catch (err) {
                // network/backend failure: revert optimistic change
                console.warn('Save API failed, reverting optimistic state', err && err.message);
                if (isCurrentlySaved) {
                    // we tried to remove but failed: re-add
                    setSavedVideos(prev => { const s = new Set(prev); s.add(videoId); return s; });
                    setVideos(prev => prev.map(v => String(v._id) === videoId ? ({ ...v, saves: (Number(v.saves) || 0) + 1 }) : v));
                } else {
                    // we tried to add but failed: remove
                    setSavedVideos(prev => { const s = new Set(prev); s.delete(videoId); return s; });
                    setVideos(prev => prev.map(v => String(v._id) === videoId ? ({ ...v, saves: Math.max(0, (v.saves || 0) - 1) }) : v));
                }
                // persist current saved set
                try { localStorage.setItem('savedVideos', JSON.stringify(Array.from(savedVideos).map(String))); } catch (e) { /* ignore */ }
            } finally {
                setSaveInFlight(prev => { const s = new Set(prev); s.delete(videoId); return s; });
            }
        };
        

        const handleVisitStore = (partnerId) => {
            if (partnerId) {
                navigate(`/food-partner/${partnerId}`);
            }
        };

        // Add scroll intersection observer for video autoplay
        useEffect(() => {
            const videoElements = document.querySelectorAll('.mobile-reel');
            const videoPlayers = document.querySelectorAll('.mobile-reel-video');

            const handleIntersection = (entries) => {
                entries.forEach((entry) => {
                    const video = entry.target.querySelector('.mobile-reel-video');
                    if (!video) return;

                    if (entry.isIntersecting && entry.intersectionRatio > 0.6) {
                        // Play video when it's mostly visible
                        try {
                            video.currentTime = 0;
                            const playPromise = video.play();
                            if (playPromise && playPromise.catch) {
                                playPromise.catch(() => {
                                    console.log('Video autoplay prevented');
                                });
                            }
                        } catch (err) {
                            console.log('Video play error:', err);
                        }
                    } else {
                        // Pause video when not visible
                        try {
                            video.pause();
                            video.currentTime = 0;
                        } catch (err) {
                            console.log('Video pause error:', err);
                        }
                    }
                });
            };

            const observer = new IntersectionObserver(handleIntersection, {
                root: null,
                threshold: [0.6], // Trigger when 60% of video is visible
                rootMargin: '0px'
            });

            // Observe all video elements
            videoElements.forEach((element) => {
                observer.observe(element);
            });

            // Handle page visibility changes
            const handleVisibilityChange = () => {
                if (document.hidden) {
                    videoPlayers.forEach(video => {
                        try {
                            video.pause();
                        } catch (err) {
                            console.log('Video pause error:', err);
                        }
                    });
                } else {
                    // Find currently visible video and play it
                    const visibleReel = Array.from(videoElements).find(reel => {
                        const rect = reel.getBoundingClientRect();
                        return rect.top >= 0 && rect.bottom <= window.innerHeight;
                    });
                    
                    if (visibleReel) {
                        const video = visibleReel.querySelector('.mobile-reel-video');
                        if (video) {
                            try {
                                const playPromise = video.play();
                                if (playPromise && playPromise.catch) {
                                    playPromise.catch(() => {});
                                }
                            } catch (err) {
                                console.log('Video play error:', err);
                            }
                        }
                    }
                }
            };

            document.addEventListener('visibilitychange', handleVisibilityChange);

            return () => {
                observer.disconnect();
                document.removeEventListener('visibilitychange', handleVisibilityChange);
            };
        }, [videos]);


        // No snapping for mobile grid

        // No initial scroll positioning required for vertical mobile grid

        // removed duplicate helper likeVideo in favor of handleLike which refreshes authoritative counts

        return (
            <div className="mobile-reels-container">
                {videos.map((video) => (
                    <div className="mobile-reel" key={video._id}>
                        <video
                            className="mobile-reel-video"
                            src={video.url}
                            muted
                            playsInline
                            loop
                            autoPlay
                            preload="auto"
                        />
                        
                        {/* Right side action buttons */}
                        <div className="mobile-actions">
                            <button 
                                className={`action-btn ${likedVideos.has(video._id) ? 'liked' : ''}`}
                                onClick={() => handleLike(video._id)}
                            >
                                <div className="action-icon">♥</div>
                                <span className="action-count">{Math.max(0, Number(video.likes ?? 0))}</span>
                            </button>
                            <button 
                                className={`action-btn ${savedVideos.has(video._id) ? 'saved' : ''}`}
                                onClick={() => handleSave(video._id)}
                            >
                                <div className="action-icon">🔖</div>
                                <span className="action-count">{Math.max(0, Number(video.saves ?? 0))}</span>
                            </button>

                            <button className="action-btn">
                                <div className="action-icon">💬</div>
                                    <span className="action-count">{Math.max(0, Number(video.comments ?? 0))}</span>
                            </button>
                        </div>

                        {/* Bottom overlay with description and visit store */}
                        <div className="mobile-overlay">
                            <div className="video-info">
                                <h3 className="video-title">{video.name}</h3>
                                <p className="video-description">{video.description}</p>
                                
                                {video.foodPartner && (
                                    <button 
                                        className="visit-store-btn"
                                        onClick={() => handleVisitStore(video.foodPartner._id || video.foodPartner)}
                                    >
                                        Visit Store
                                    </button>
                                )}
                            </div>
                        </div>

                    </div>
                ))}
                
                {/* Single bottom navigation for whole page */}
                <div className="bottom-nav">
                    <button className="nav-btn active" onClick={() => navigate('/general')}>
                        <div className="nav-icon">🏠</div>
                        <span>Home</span>
                    </button>
                    <button className="nav-btn" onClick={() => navigate('/saved')}>
                        <div className="nav-icon">🔖</div>
                        <span>Saved</span>
                    </button>
                </div>
            </div>
        );
    };

    export default Home1;