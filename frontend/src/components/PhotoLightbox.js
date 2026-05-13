import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLightbox } from '../context/LightboxContext';

const PhotoLightbox = () => {
    const { isOpen, images, currentIndex, metadata, closeLightbox, setCurrentIndex } = useLightbox();
    const [zoom, setZoom] = useState(1);
    const [offset, setOffset] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [imgStatus, setImgStatus] = useState('loading');
    const [isOffline, setIsOffline] = useState(!navigator.onLine);
    const imgRef = useRef(null);

    // Touch gesture state
    const touchState = useRef({
        lastTouchTime: 0,
        initialDistance: 0,
        initialZoom: 1,
        lastTouch: { x: 0, y: 0 },
        isSwiping: false,
        isPinching: false
    });

    useEffect(() => {
        const handleOnline = () => setIsOffline(false);
        const handleOffline = () => setIsOffline(true);
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    // Reset zoom/offset on image change
    useEffect(() => {
        setZoom(1);
        setOffset({ x: 0, y: 0 });
        setImgStatus('loading');
        
        if (isOpen && images[currentIndex]) {
            const isDev = process.env.NODE_ENV === 'development';
            const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
            
            if (isDev) {
                // [AUDIT:...]
                console.log(isMobile ? '[AUDIT:MOBILE_PHOTO_VIEW]' : '[AUDIT:PHOTO_VIEW]', {
                    device_type: isMobile ? 'mobile' : 'desktop',
                    viewport: `${window.innerWidth}x${window.innerHeight}`,
                    touch_enabled: 'ontouchstart' in window,
                    feedback_id: metadata.feedback_id || 'unknown',
                    viewer_mode: metadata.viewer_mode || 'public',
                    image_index: currentIndex,
                    image_url: images[currentIndex],
                    zoom_level: zoom
                });
                console.log(`[AUDIT:BATCH_VIEW] image_index=${currentIndex} image_url=${images[currentIndex]} feedback_id=${metadata.feedback_id || 'unknown'}`);
            } else {
                // [PROD:MOBILE_MEDIA]
                console.info(`[PROD:MOBILE_MEDIA] action=LIGHTBOX_OPEN device=${isMobile ? 'mobile' : 'desktop'} feedback_id=${metadata.feedback_id || 'unknown'} index=${currentIndex}`);
                if (zoom > 1) console.info(`[PROD:MOBILE_MEDIA] action=PINCH_ZOOM_USAGE feedback_id=${metadata.feedback_id || 'unknown'} zoom=${zoom.toFixed(2)}`);
            }

            // Smart Preload
            preloadImage(currentIndex + 1);
            preloadImage(currentIndex - 1);
        }

        // Hide body scroll
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }

        return () => { document.body.style.overflow = ''; };
    }, [currentIndex, isOpen, images, metadata]);

    const preloadImage = (index) => {
        if (index >= 0 && index < images.length) {
            const img = new Image();
            img.src = images[index];
        }
    };

    const handlePrev = useCallback((e) => {
        if (e) e.stopPropagation();
        if (currentIndex > 0) {
            setCurrentIndex(currentIndex - 1);
            if (process.env.NODE_ENV !== 'development') {
                console.info(`[PROD:MOBILE_MEDIA] action=SWIPE_NAV direction=PREV feedback_id=${metadata.feedback_id || 'unknown'}`);
            }
        }
    }, [currentIndex, setCurrentIndex, metadata.feedback_id]);

    const handleNext = useCallback((e) => {
        if (e) e.stopPropagation();
        if (currentIndex < images.length - 1) {
            setCurrentIndex(currentIndex + 1);
            if (process.env.NODE_ENV !== 'development') {
                console.info(`[PROD:MOBILE_MEDIA] action=SWIPE_NAV direction=NEXT feedback_id=${metadata.feedback_id || 'unknown'}`);
            }
        }
    }, [currentIndex, images.length, setCurrentIndex, metadata.feedback_id]);

    const handleKeyDown = useCallback((e) => {
        if (!isOpen) return;
        if (e.key === 'Escape') closeLightbox();
        if (e.key === 'ArrowLeft') handlePrev();
        if (e.key === 'ArrowRight') handleNext();
    }, [isOpen, closeLightbox, handlePrev, handleNext]);

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        const handleOrientation = () => {
            if (process.env.NODE_ENV !== 'development') {
                console.info(`[PROD:MOBILE_MEDIA] action=ORIENTATION_CHANGE orientation=${window.screen?.orientation?.type || 'unknown'}`);
            }
        };
        window.addEventListener('orientationchange', handleOrientation);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('orientationchange', handleOrientation);
        };
    }, [handleKeyDown]);

    // Zoom Handlers
    const handleWheel = (e) => {
        if (e.deltaY < 0) setZoom(prev => Math.min(prev + 0.2, 5));
        else setZoom(prev => Math.max(prev - 0.2, 1));
    };

    const handleZoomToggle = (clientX, clientY) => {
        if (zoom > 1) {
            setZoom(1);
            setOffset({ x: 0, y: 0 });
        } else {
            setZoom(2.5);
        }
    };

    // Drag Handlers (Mouse & Touch)
    const onStart = (clientX, clientY) => {
        if (zoom <= 1) return;
        setIsDragging(true);
        setDragStart({ x: clientX - offset.x, y: clientY - offset.y });
    };

    const onMove = (clientX, clientY) => {
        if (!isDragging) return;
        setOffset({ x: clientX - dragStart.x, y: clientY - dragStart.y });
    };

    const onEnd = () => setIsDragging(false);

    // Touch Gestures
    const handleTouchStart = (e) => {
        const now = Date.now();
        const firstTouch = e.touches[0];

        if (e.touches.length === 2) {
            // Pinch start
            touchState.current.isPinching = true;
            touchState.current.initialDistance = Math.hypot(
                e.touches[0].clientX - e.touches[1].clientX,
                e.touches[0].clientY - e.touches[1].clientY
            );
            touchState.current.initialZoom = zoom;
        } else if (e.touches.length === 1) {
            // Double tap detection
            if (now - touchState.current.lastTouchTime < 300) {
                handleZoomToggle(firstTouch.clientX, firstTouch.clientY);
            }
            touchState.current.lastTouchTime = now;
            touchState.current.lastTouch = { x: firstTouch.clientX, y: firstTouch.clientY };
            touchState.current.isSwiping = zoom === 1;

            if (zoom > 1) {
                onStart(firstTouch.clientX, firstTouch.clientY);
            }
        }
    };

    const handleTouchMove = (e) => {
        if (touchState.current.isPinching && e.touches.length === 2) {
            const distance = Math.hypot(
                e.touches[0].clientX - e.touches[1].clientX,
                e.touches[0].clientY - e.touches[1].clientY
            );
            const scale = distance / touchState.current.initialDistance;
            setZoom(Math.min(Math.max(touchState.current.initialZoom * scale, 1), 5));
        } else if (e.touches.length === 1) {
            if (zoom > 1) {
                onMove(e.touches[0].clientX, e.touches[0].clientY);
            }
        }
    };

    const handleTouchEnd = (e) => {
        if (touchState.current.isSwiping && e.changedTouches.length === 1 && !touchState.current.isPinching) {
            const deltaX = e.changedTouches[0].clientX - touchState.current.lastTouch.x;
            if (Math.abs(deltaX) > 60) {
                if (deltaX > 0) handlePrev();
                else handleNext();
            }
        }
        
        touchState.current.isPinching = false;
        touchState.current.isSwiping = false;
        onEnd();
    };

    const handleDownload = (e) => {
        e.stopPropagation();
        const link = document.createElement('a');
        link.href = images[currentIndex];
        link.download = `photo_${metadata.feedback_id}_${currentIndex}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (!isOpen) return null;

    const showDownload = metadata.viewer_mode === 'admin' || metadata.viewer_mode === 'owner';

    return (
        <div 
            className="photo-lightbox-overlay"
            style={{
                position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.98)', zIndex: 10000,
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                backdropFilter: 'blur(15px)', transition: 'all 0.3s ease-out',
                overflow: 'hidden', touchAction: 'none',
                height: '100dvh'
            }}
            onClick={closeLightbox}
            onWheel={handleWheel}
        >
            {/* Top Controls - Respect Safe Area */}
            <div style={{ 
                position: 'absolute', top: 'env(safe-area-inset-top, 20px)', left: 0, right: 0, 
                padding: '0 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 10 
            }}>
                <div style={{ color: 'white', fontSize: '12px', fontWeight: '800', textShadow: '0 2px 4px rgba(0,0,0,0.5)', opacity: 0.8, letterSpacing: '0.05em' }}>
                    {images.length > 1 && `${currentIndex + 1} / ${images.length}`}
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    {showDownload && (
                        <button 
                            onClick={handleDownload}
                            style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', padding: '10px 18px', borderRadius: '25px', cursor: 'pointer', fontWeight: '700', fontSize: '11px', textTransform: 'uppercase' }}
                        >
                            Save
                        </button>
                    )}
                    <button 
                        onClick={closeLightbox}
                        style={{ background: 'white', border: 'none', width: '40px', height: '40px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', fontSize: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}
                    >
                        ✕
                    </button>
                </div>
            </div>

            {/* Main Image Container */}
            <div 
                style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: zoom > 1 ? 'move' : 'default' }}
                onMouseDown={e => onStart(e.clientX, e.clientY)}
                onMouseMove={e => onMove(e.clientX, e.clientY)}
                onMouseUp={onEnd}
                onMouseLeave={onEnd}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
            >
                {imgStatus === 'loading' && (
                    <div style={{ color: 'white', fontSize: '13px', fontWeight: '700', opacity: 0.6, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Optimizing View...</div>
                )}
                
                {isOffline && imgStatus === 'loading' ? (
                     <div style={{ color: '#FDA4AF', textAlign: 'center', padding: '20px' }}>
                        <div style={{ fontSize: '40px', marginBottom: '10px' }}>📡</div>
                        <p style={{ fontWeight: '800', margin: 0 }}>Photo unavailable offline</p>
                        <p style={{ fontSize: '12px', opacity: 0.6, marginTop: '4px' }}>Reconnect to view this attachment</p>
                    </div>
                ) : imgStatus === 'error' && (
                    <div style={{ color: 'white', textAlign: 'center', padding: '20px' }}>
                        <p style={{ fontWeight: '700' }}>Unable to load image</p>
                        <button 
                            onClick={(e) => { e.stopPropagation(); setImgStatus('loading'); }} 
                            style={{ background: 'white', border: 'none', padding: '10px 24px', borderRadius: '12px', cursor: 'pointer', fontWeight: '800', fontSize: '13px', marginTop: '12px' }}
                        >
                            Retry
                        </button>
                    </div>
                )}

                <img 
                    ref={imgRef}
                    src={images[currentIndex]}
                    alt={`View ${currentIndex}`}
                    onLoad={() => {
                        setImgStatus('loaded');
                        console.log(`[AUDIT:BATCH_VIEW] image_index=${currentIndex} load_success=true feedback_id=${metadata.feedback_id || 'unknown'}`);
                    }}
                    onError={() => {
                        setImgStatus('error');
                        console.log(`[AUDIT:BATCH_VIEW] image_index=${currentIndex} load_success=false feedback_id=${metadata.feedback_id || 'unknown'}`);
                    }}
                    onDoubleClick={() => handleZoomToggle()}
                    draggable={false}
                    style={{
                        maxWidth: '100vw', maxHeight: '100vh', objectFit: 'contain',
                        transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
                        transition: isDragging || zoom > 1 ? 'none' : 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        display: imgStatus === 'loaded' ? 'block' : 'none',
                        boxShadow: '0 30px 60px rgba(0,0,0,0.5)',
                        borderRadius: zoom > 1 ? '0' : '8px'
                    }}
                    onClick={(e) => e.stopPropagation()}
                />
            </div>

            {/* Navigation Indicators (Mobile optimized) */}
            {images.length > 1 && zoom === 1 && (
                <div style={{ 
                    position: 'absolute', bottom: 'calc(40px + env(safe-area-inset-bottom, 0px))', 
                    display: 'flex', gap: '40px', alignItems: 'center', zIndex: 10 
                }}>
                    <button 
                        onClick={handlePrev}
                        disabled={currentIndex === 0}
                        style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', width: '56px', height: '56px', borderRadius: '50%', color: 'white', cursor: 'pointer', fontSize: '24px', opacity: currentIndex === 0 ? 0 : 1, transition: '0.2s', backdropFilter: 'blur(5px)' }}
                    >
                        ←
                    </button>
                    <button 
                        onClick={handleNext}
                        disabled={currentIndex === images.length - 1}
                        style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', width: '56px', height: '56px', borderRadius: '50%', color: 'white', cursor: 'pointer', fontSize: '24px', opacity: currentIndex === images.length - 1 ? 0 : 1, transition: '0.2s', backdropFilter: 'blur(5px)' }}
                    >
                        →
                    </button>
                </div>
            )}

            {/* Gesture Hint (Desktop only or hidden when zoomed) */}
            {zoom === 1 && (
                <div style={{ position: 'absolute', bottom: 'calc(15px + env(safe-area-inset-bottom, 0px))', color: 'rgba(255,255,255,0.3)', fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.2em', fontWeight: '800' }}>
                    Swipe to navigate • Pinch to zoom
                </div>
            )}
        </div>
    );
};

export default PhotoLightbox;
