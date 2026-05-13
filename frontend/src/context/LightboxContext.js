import React, { createContext, useState, useContext, useCallback } from 'react';

const LightboxContext = createContext();

export const useLightbox = () => {
    const context = useContext(LightboxContext);
    if (!context) {
        throw new Error('useLightbox must be used within a LightboxProvider');
    }
    return context;
};

export const LightboxProvider = ({ children }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [images, setImages] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [metadata, setMetadata] = useState({});

    const openLightbox = useCallback((imagesList, index = 0, meta = {}) => {
        setImages(imagesList);
        setCurrentIndex(index);
        setMetadata(meta);
        setIsOpen(true);
        
        // [AUDIT:PHOTO_VIEW]
        console.log('[AUDIT:PHOTO_VIEW]', {
            feedback_id: meta.feedback_id || 'unknown',
            viewer_mode: meta.viewer_mode || 'public',
            image_index: index,
            image_url: imagesList[index]
        });
    }, []);

    const closeLightbox = useCallback(() => {
        setIsOpen(false);
    }, []);

    return (
        <LightboxContext.Provider value={{ isOpen, images, currentIndex, metadata, openLightbox, closeLightbox, setCurrentIndex }}>
            {children}
        </LightboxContext.Provider>
    );
};
