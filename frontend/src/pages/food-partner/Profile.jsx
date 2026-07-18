import React, { useState, useEffect, useCallback } from 'react'
import '../../styles/profile.css'
import { useParams, useNavigate } from 'react-router-dom'
import axios from 'axios'

const sampleVideos = [
    'https://www.w3schools.com/html/mov_bbb.mp4',
    'https://www.w3schools.com/html/movie.mp4',
    'https://www.w3schools.com/html/mov_bbb.mp4',
    'https://www.w3schools.com/html/movie.mp4',
    'https://www.w3schools.com/html/mov_bbb.mp4',
    'https://www.w3schools.com/html/movie.mp4',
    'https://www.w3schools.com/html/mov_bbb.mp4',
    'https://www.w3schools.com/html/movie.mp4',
    'https://www.w3schools.com/html/mov_bbb.mp4',
    'https://www.w3schools.com/html/movie.mp4',
    'https://www.w3schools.com/html/mov_bbb.mp4',
    'https://www.w3schools.com/html/movie.mp4'
]

const Profile = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [profile, setProfile] = useState(null);
    const [videos, setVideos] = useState([]);
    const [failed, setFailed] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentPartnerId, setCurrentPartnerId] = useState(null);
    const [isOwnProfile, setIsOwnProfile] = useState(false);
    const [deletingVideoId, setDeletingVideoId] = useState(null);

    const fetchVideosForPartner = useCallback(async (partnerId) => {
        // Try public endpoint first, then fall back to authenticated endpoint
        const paths = ['/api/food/public', '/api/food'];
        let items = [];

        for (let i = 0; i < paths.length; i++) {
            const path = paths[i];
            try {
                console.log('Attempting to fetch videos from', path);
                const opts = i === 0 ? {} : { withCredentials: true };
                const response = await axios.get(path, opts);
                const payload = response.data;
                items = Array.isArray(payload) ? payload : (payload.foodItems || payload.videos || payload.data || []);
                console.log(`Fetched ${items.length} items from ${path}`);
                break; // stop after successful fetch
            } catch (err) {
                console.warn(`Failed to fetch from ${path}:`, err?.response?.status || err.message);
                // try next path
            }
        }

        // filter by partner id
        const partnerFoods = items.filter(item => {
            const itemPartnerId = item.foodPartner?._id || item.foodPartner || item.foodPartnerId || item.partner || item.foodPartnerIdString;
            const matches = String(itemPartnerId) === String(partnerId);
            return matches;
        });

        console.log('Filtered partner videos:', partnerFoods.length);

        // Do not inject sample/dummy videos here — prefer an empty list when there are no uploads
        setVideos(partnerFoods);
    }, []);

    const fetchVideos = useCallback(async () => {
        const partnerId = id || currentPartnerId;
        if (partnerId) {
            fetchVideosForPartner(partnerId);
        }
    }, [id, currentPartnerId, fetchVideosForPartner]);

    useEffect(() => {
        const fetchProfile = async () => {
            setLoading(true);
            try {
                let profileResponse;
                let partnerId = id;

                if (id) {
                    // Viewing someone else's profile with ID in URL
                    console.log('Fetching profile for ID (public):', id);
                    // Try public fetch first (no credentials) so regular users can view partner pages
                    try {
                        profileResponse = await axios.get(`/api/food-partner/${id}`);
                    } catch (publicErr) {
                        console.warn('Public profile fetch failed, retrying with credentials:', publicErr?.response?.status);
                        // Retry with credentials in case the endpoint is protected
                        profileResponse = await axios.get(`/api/food-partner/${id}`, { withCredentials: true });
                    }
                } else {
                    // Viewing own profile after login (no ID in URL)
                    console.log('Fetching current partner profile');
                    setIsOwnProfile(true);
                        try {
                            // Try the profile endpoint for the authenticated partner
                            profileResponse = await axios.get('/api/food-partner/profile', { withCredentials: true });
                            partnerId = profileResponse.data._id || profileResponse.data.foodPartner?._id;
                            setCurrentPartnerId(partnerId);
                            console.log('Current partner ID from profile endpoint:', partnerId);
                        } catch (profileErr) {
                            console.log('Profile endpoint failed, trying session-based approach:', profileErr.response?.status);
                            try {
                                // Try to get session info or use a different approach
                                profileResponse = await axios.get('/api/auth/session', { withCredentials: true });
                                partnerId = profileResponse.data.user?._id || profileResponse.data.partner?._id;
                                setCurrentPartnerId(partnerId);
                                console.log('Partner ID from session:', partnerId);
                                
                                // Now fetch the actual profile data
                                if (partnerId) {
                                    profileResponse = await axios.get(`/api/food-partner/${partnerId}`, { withCredentials: true });
                                }
                            } catch (sessionErr) {
                                console.log('Session approach failed, showing error:', sessionErr.response?.status);
                                throw new Error('Unable to fetch partner profile. Please log in again.');
                            }
                        }
                }

                const profileData = profileResponse.data.foodPartner || profileResponse.data.partner || profileResponse.data || null;
                console.log('Profile data received:', profileData);
                setProfile(profileData);
                
                // Fetch videos with the correct partner ID
                if (partnerId) {
                    console.log('Fetching videos for partner:', partnerId);
                    fetchVideosForPartner(partnerId);
                }
            } catch (err) {
                console.error('Failed to fetch profile:', err);
                // Only show the auth/login error if we're trying to load the current partner's own profile
                if (!id) {
                    setError('Failed to load profile. Please make sure you are logged in.');
                    // Set some fallback data so the page doesn't stay blank for own profile
                    setProfile({
                        name: 'Food Partner',
                        businessName: 'Your Restaurant',
                        address: 'Restaurant Address',
                        customerServe: '1k+',
                        rating: '4.5'
                    });
                } else {
                    // When viewing another partner's profile, don't treat auth failure as an error to show to the user
                    console.warn('Could not load partner profile for id', id, '- showing empty state');
                    setError(null);
                    setProfile(prev => prev || {
                        name: 'Food Partner',
                        businessName: 'Business',
                        address: '',
                    });
                    // ensure videos is empty so UI shows "No videos uploaded"
                    setVideos([]);
                }
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [id]);

    useEffect(() => {
        setFailed(Array(videos.length).fill(false));
    }, [videos.length]);

    useEffect(() => {
        const handleVideoUpdate = () => {
            const partnerId = id || currentPartnerId;
            if (partnerId) {
                fetchVideosForPartner(partnerId);
            }
        };

        window.addEventListener('videoCreated', handleVideoUpdate);
        window.addEventListener('profileRefresh', handleVideoUpdate);
        
        return () => {
            window.removeEventListener('videoCreated', handleVideoUpdate);
            window.removeEventListener('profileRefresh', handleVideoUpdate);
        };
    }, [id, currentPartnerId, fetchVideosForPartner]);

    const handleError = (index) => {
        setFailed(prev => {
            const next = [...prev];
            next[index] = true;
            return next;
        });
    };

    const handleDeleteVideo = async (videoId, videoName) => {
        if (!window.confirm(`Are you sure you want to delete "${videoName}"?`)) {
            return;
        }

        setDeletingVideoId(videoId);
        try {
            console.log('Deleting video:', videoId);
            await axios.delete(`/api/food/${videoId}`, { withCredentials: true });
            
            // Remove video from local state
            setVideos(prev => prev.filter(video => video._id !== videoId));
            
            // Trigger refresh event
            window.dispatchEvent(new Event('videoDeleted'));
            
            console.log('Video deleted successfully');
        } catch (err) {
            console.error('Error deleting video:', err);
            alert('Failed to delete video. Please try again.');
        } finally {
            setDeletingVideoId(null);
        }
    };

    const handleAddVideo = () => {
        navigate('/create-food');
    };

    if (loading) {
        return (
            <div className="profile-page">
                <div className="profile-card">
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        height: '300px',
                        flexDirection: 'column',
                        gap: '16px',
                        color: 'var(--muted)'
                    }}>
                        <div style={{
                            width: '40px',
                            height: '40px',
                            border: '3px solid rgba(var(--accent-rgb, 59, 130, 246), 0.2)',
                            borderTop: '3px solid rgba(var(--accent-rgb, 59, 130, 246), 0.8)',
                            borderRadius: '50%',
                            animation: 'spin 1s linear infinite'
                        }}></div>
                        <span style={{ fontSize: '16px', fontWeight: '500' }}>Loading profile...</span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="profile-page">
            <div className="profile-card">
                <div className="profile-header">
                    <div 
                        className="avatar"
                        style={{
                            backgroundImage: profile?.avatar ? `url(${profile.avatar})` : 'none'
                        }}
                    />
                    <div className="profile-info">
                        <div className="biz-name">{profile?.name || profile?.businessName || 'Business Name'}</div>
                        <div className="biz-address">
                            📍 {profile?.address || '123 Main Street, City'}
                        </div>
                    </div>
                </div>

                <div className="profile-stats">
                    <div className="stat">
                        <div className="label">total meals</div>
                        <div className="value">{Array.isArray(videos) ? videos.length : 0}</div>
                    </div>
                    <div className="stat">
                        <div className="label">customers served</div>
                        <div className="value">{profile?.customerServe || '15k'}</div>
                    </div>
                    <div className="stat">
                        <div className="label">rating</div>
                        <div className="value">{profile?.rating || '4.8'}⭐</div>
                    </div>
                </div>

                {error && (
                    <div style={{
                        padding: '16px 24px',
                        background: 'rgba(239, 68, 68, 0.1)',
                        color: 'rgba(239, 68, 68, 0.8)',
                        borderRadius: '12px',
                        margin: '0 24px',
                        fontSize: '14px',
                        fontWeight: '500',
                        border: '1px solid rgba(239, 68, 68, 0.2)'
                    }}>
                        {error}
                    </div>
                )}

                {isOwnProfile && (
                    <div style={{
                        padding: '16px 24px 20px',
                        borderBottom: '1px solid rgba(59, 130, 246, 0.08)'
                    }}>
                        <button 
                            onClick={handleAddVideo}
                            style={{
                                background: 
                                  'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 50%, #ec4899 100%), ' +
                                  'linear-gradient(180deg, rgba(255, 255, 255, 0.1) 0%, transparent 100%)',
                                color: 'white',
                                border: 'none',
                                padding: '16px 24px',
                                borderRadius: '16px',
                                fontSize: '15px',
                                fontWeight: '700',
                                cursor: 'pointer',
                                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                boxShadow: 
                                  '0 8px 25px rgba(59, 130, 246, 0.25), ' +
                                  '0 3px 10px rgba(0, 0, 0, 0.1), ' +
                                  'inset 0 1px 0 rgba(255, 255, 255, 0.2)',
                                width: '100%',
                                justifyContent: 'center',
                                letterSpacing: '-0.02em'
                            }}
                            onMouseOver={(e) => {
                                e.target.style.transform = 'translateY(-3px) scale(1.02)';
                                e.target.style.boxShadow = 
                                  '0 15px 40px rgba(59, 130, 246, 0.3), ' +
                                  '0 8px 25px rgba(139, 92, 246, 0.2), ' +
                                  'inset 0 1px 0 rgba(255, 255, 255, 0.3)';
                            }}
                            onMouseOut={(e) => {
                                e.target.style.transform = 'translateY(0) scale(1)';
                                e.target.style.boxShadow = 
                                  '0 8px 25px rgba(59, 130, 246, 0.25), ' +
                                  '0 3px 10px rgba(0, 0, 0, 0.1), ' +
                                  'inset 0 1px 0 rgba(255, 255, 255, 0.2)';
                            }}
                        >
                            <span style={{ 
                                fontSize: '18px', 
                                fontWeight: '300',
                                background: 'linear-gradient(45deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.7) 100%)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent'
                            }}>+</span>
                            Add New Video
                        </button>
                    </div>
                )}

                <div className="video-grid">
                    {videos.map((item, i) => {
                        const src = typeof item === 'string' ? item : (item.video || item.videoUrl || item.url || item.src);
                        const videoId = typeof item === 'object' ? item._id : null;
                        const videoName = typeof item === 'object' ? item.name || `Video ${i + 1}` : `Video ${i + 1}`;
                        
                        return (
                            <div className="video-item" key={i}>
                                {!failed[i] && src ? (
                                    <>
                                        <video
                                            src={src}
                                            muted
                                            loop
                                            playsInline
                                            preload="metadata"
                                            onError={() => handleError(i)}
                                            controls
                                            controlsList="nodownload nofullscreen"
                                            disablePictureInPicture
                                            style={{ cursor: 'pointer', width: '100%', height: '100%', touchAction: 'manipulation' }}
                                            onContextMenu={(e) => e.preventDefault()}
                                            onDoubleClick={(e) => {
                                                // Prevent double-click fullscreen on some browsers and instead toggle play/pause
                                                e.preventDefault();
                                                try {
                                                    if (document.fullscreenElement) document.exitFullscreen();
                                                } catch (err) {}
                                                const v = e.currentTarget;
                                                if (v.paused) {
                                                    const p = v.play(); if (p && p.catch) p.catch(() => {});
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
                                        {isOwnProfile && videoId && (
                                            <button
                                                className="video-delete-btn"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDeleteVideo(videoId, videoName);
                                                }}
                                                disabled={deletingVideoId === videoId}
                                                title="Delete video"
                                            >
                                                {deletingVideoId === videoId ? '...' : '✕'}
                                            </button>
                                        )}
                                    </>
                                ) : (
                                    <div className="video-fallback">
                                        Video unavailable
                                        {isOwnProfile && videoId && (
                                            <button
                                                className="video-delete-btn"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDeleteVideo(videoId, videoName);
                                                }}
                                                disabled={deletingVideoId === videoId}
                                                title="Delete video"
                                                style={{ top: '8px', right: '8px' }}
                                            >
                                                {deletingVideoId === videoId ? '...' : '✕'}
                                            </button>
                                        )}
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

export default Profile