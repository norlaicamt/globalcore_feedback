import React, { useState, useRef, useEffect } from 'react';

const ImageCropperModal = ({ isOpen, imageSrc, onCrop, onCancel }) => {
  const [zoom, setZoom] = useState(1);
  const [minZoom, setMinZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imgSize, setImgSize] = useState({ width: 0, height: 0 });
  const containerRef = useRef(null);
  const imgRef = useRef(null);

  const containerSize = 300;

  useEffect(() => {
    if (imageSrc) {
      const img = new Image();
      img.src = imageSrc;
      img.onload = () => {
        let w = img.width;
        let h = img.height;
        let initialZoom = 1;
        
        // Calculate min zoom to ensure the image always covers the 300x300 area
        if (w < h) {
          initialZoom = containerSize / w;
        } else {
          initialZoom = containerSize / h;
        }
        
        setImgSize({ width: w, height: h });
        setMinZoom(initialZoom);
        setZoom(initialZoom);
        setPosition({ x: 0, y: 0 }); // Start at center
      };
    }
  }, [imageSrc]);

  const handleMouseDown = (e) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e) => {
    if (isDragging) {
      const newX = e.clientX - dragStart.x;
      const newY = e.clientY - dragStart.y;
      
      // Constraints: Image must always cover the container
      const limitX = (imgSize.width * zoom - containerSize) / 2;
      const limitY = (imgSize.height * zoom - containerSize) / 2;
      
      setPosition({
        x: Math.max(-limitX, Math.min(limitX, newX)),
        y: Math.max(-limitY, Math.min(limitY, newY))
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleSave = () => {
    const canvas = document.createElement('canvas');
    const outputSize = 400; // Final resolution
    canvas.width = outputSize;
    canvas.height = outputSize;
    const ctx = canvas.getContext('2d');
    
    const img = imgRef.current;
    
    // The image is rendered at imgSize.width * zoom
    // Center of container is (0,0) relative to position.x/y
    // We want to capture the containerSize x containerSize area
    
    const currentW = imgSize.width * zoom;
    const currentH = imgSize.height * zoom;
    
    // Top-left of the container relative to the image center
    // Image center is at (position.x, position.y) relative to container center
    // So container top-left is at (-150 - position.x, -150 - position.y) relative to image center
    
    const captureX = (currentW / 2 - containerSize / 2 - position.x) / zoom;
    const captureY = (currentH / 2 - containerSize / 2 - position.y) / zoom;
    const captureSize = containerSize / zoom;
    
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, captureX, captureY, captureSize, captureSize, 0, 0, outputSize, outputSize);
    
    onCrop(canvas.toDataURL('image/jpeg', 0.9));
  };

  if (!isOpen) return null;

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <div style={styles.header}>
          <h3 style={styles.title}>Adjust Profile Picture</h3>
          <p style={styles.subtitle}>Drag to position, slider to zoom</p>
        </div>
        
        <div 
          ref={containerRef}
          style={styles.cropContainer}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <img
            ref={imgRef}
            src={imageSrc}
            alt="To crop"
            draggable={false}
            style={{
              ...styles.image,
              width: imgSize.width * zoom,
              height: imgSize.height * zoom,
              left: (containerSize - imgSize.width * zoom) / 2 + position.x,
              top: (containerSize - imgSize.height * zoom) / 2 + position.y,
              cursor: isDragging ? 'grabbing' : 'grab'
            }}
          />
          {/* Facebook-style overlay: dark outside the circle */}
          <div style={styles.overlayMask}>
            <div style={styles.circleCutout} />
          </div>
        </div>

        <div style={styles.controls}>
          <div style={styles.zoomRow}>
            <span style={styles.zoomLabel}>Zoom</span>
            <input 
              type="range" 
              min={minZoom} 
              max={minZoom * 3} 
              step={0.01} 
              value={zoom} 
              onChange={(e) => {
                const newZoom = parseFloat(e.target.value);
                setZoom(newZoom);
                // Reset position constraints on zoom
                setPosition({ x: 0, y: 0 });
              }}
              style={styles.slider}
            />
          </div>
          
          <div style={styles.actions}>
            <button onClick={onCancel} style={styles.cancelBtn}>Cancel</button>
            <button onClick={handleSave} style={styles.saveBtn}>Set Profile Picture</button>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  overlay: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    backdropFilter: 'blur(8px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    padding: '20px'
  },
  modal: {
    backgroundColor: 'white',
    borderRadius: '32px',
    width: '100%',
    maxWidth: '420px',
    overflow: 'hidden',
    boxShadow: '0 25px 60px -12px rgba(0,0,0,0.5)'
  },
  header: {
    padding: '32px 24px 24px',
    textAlign: 'center'
  },
  title: {
    margin: 0,
    fontSize: '20px',
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: '-0.02em'
  },
  subtitle: {
    margin: '6px 0 0 0',
    fontSize: '14px',
    color: '#64748B',
    fontWeight: '500'
  },
  cropContainer: {
    position: 'relative',
    width: '300px',
    height: '300px',
    margin: '0 auto 24px',
    backgroundColor: '#000',
    overflow: 'hidden',
    borderRadius: '12px',
    userSelect: 'none',
    boxShadow: '0 0 0 1px rgba(0,0,0,0.05)'
  },
  image: {
    position: 'absolute',
    maxWidth: 'none',
    maxHeight: 'none'
  },
  overlayMask: {
    position: 'absolute',
    inset: 0,
    pointerEvents: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(0, 0, 0, 0.4)'
  },
  circleCutout: {
    width: '300px',
    height: '300px',
    borderRadius: '50%',
    boxShadow: '0 0 0 999px rgba(0, 0, 0, 0.4)',
    border: '2px solid rgba(255, 255, 255, 0.8)'
  },
  controls: {
    padding: '24px 32px 32px',
    backgroundColor: '#F8FAFC',
    borderTop: '1px solid #F1F5F9'
  },
  zoomRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    marginBottom: '28px'
  },
  zoomLabel: {
    fontSize: '11px',
    fontWeight: '800',
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: '0.05em'
  },
  slider: {
    flex: 1,
    height: '6px',
    borderRadius: '3px',
    appearance: 'none',
    backgroundColor: '#E2E8F0',
    outline: 'none',
    cursor: 'pointer'
  },
  actions: {
    display: 'flex',
    gap: '12px'
  },
  cancelBtn: {
    flex: 1,
    padding: '14px',
    borderRadius: '16px',
    border: '1.5px solid #E2E8F0',
    backgroundColor: 'white',
    color: '#64748B',
    fontWeight: '800',
    fontSize: '14px',
    cursor: 'pointer',
    transition: '0.2s'
  },
  saveBtn: {
    flex: 2,
    padding: '14px',
    borderRadius: '16px',
    border: 'none',
    backgroundColor: '#10B981',
    color: 'white',
    fontWeight: '800',
    fontSize: '14px',
    cursor: 'pointer',
    boxShadow: '0 8px 20px -4px rgba(16, 185, 129, 0.4)',
    transition: '0.2s'
  }
};

export default ImageCropperModal;
