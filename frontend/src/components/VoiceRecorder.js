import React, { useState, useRef, useEffect } from 'react';

const VoiceRecorder = ({ onComplete, onDelete, initialValue, primaryColor = '#3B82F6' }) => {
    const [status, setStatus] = useState(initialValue ? 'completed' : 'idle');
    const [recordingTime, setRecordingTime] = useState(0);
    const [audioUrl, setAudioUrl] = useState(initialValue?.url || null);
    const [duration, setDuration] = useState(initialValue?.duration || 0);
    const [isUploading, setIsUploading] = useState(false);
    
    const mediaRecorderRef = useRef(null);
    const timerRef = useRef(null);
    const chunksRef = useRef([]);
    const audioRef = useRef(null);

    useEffect(() => {
        const isDev = process.env.NODE_ENV === 'development';
        if (isDev) {
            const supportedMime = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') ? 'audio/webm;codecs=opus' :
                                MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4';
            console.log('[AUDIT:VOICE_BROWSER_SUPPORT]', {
                user_agent: navigator.userAgent,
                supported_mime: supportedMime,
                can_record: !!navigator.mediaDevices?.getUserMedia
            });
        }
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
            if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
                mediaRecorderRef.current.stop();
            }
        };
    }, []);

    const playTestBeep = async () => {
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            if (ctx.state === 'suspended') await ctx.resume();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(440, ctx.currentTime);
            gain.gain.setValueAtTime(0.1, ctx.currentTime);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + 0.1);
            console.log('[AUDIT:SPEAKER_BEEP] Test beep played successfully.');
        } catch (e) {
            console.error('[AUDIT:SPEAKER_BEEP_FAILED]', e);
        }
    };

    const canvasRef = useRef(null);
    const animationRef = useRef(null);
    const analyserRef = useRef(null);
    const dataArrayRef = useRef(null);

    const drawWaveform = () => {
        if (!canvasRef.current || !analyserRef.current || !dataArrayRef.current) return;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;
        const analyser = analyserRef.current;
        const dataArray = dataArrayRef.current;

        const draw = () => {
            if (status !== 'recording') return;
            animationRef.current = requestAnimationFrame(draw);
            analyser.getByteTimeDomainData(dataArray);

            ctx.fillStyle = '#000000';
            ctx.fillRect(0, 0, width, height);
            
            // Draw center line (faint grid)
            ctx.lineWidth = 1;
            ctx.strokeStyle = '#1a1a1a';
            ctx.beginPath();
            ctx.moveTo(0, height / 2);
            ctx.lineTo(width, height / 2);
            ctx.stroke();

            ctx.lineWidth = 2;
            ctx.strokeStyle = '#00FF00'; // Neon Green
            ctx.beginPath();

            const sliceWidth = width * 1.0 / dataArray.length;
            let x = 0;

            for (let i = 0; i < dataArray.length; i++) {
                const v = dataArray[i] / 128.0;
                const y = v * height / 2;
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
                x += sliceWidth;
            }

            ctx.lineTo(canvas.width, canvas.height / 2);
            ctx.stroke();
        };
        draw();
    };

    useEffect(() => {
        if (status === 'recording' && canvasRef.current) {
            drawWaveform();
        }
        return () => {
            if (animationRef.current) cancelAnimationFrame(animationRef.current);
        };
    }, [status]);

    const startRecording = async () => {
        const isDev = process.env.NODE_ENV === 'development';
        try {
            await playTestBeep();

            const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') ? 'audio/webm;codecs=opus' :
                            MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4';
            
            // Use simplest possible constraints to maximize hardware compatibility
            const constraints = { audio: true };
            if (isDev) console.log('[AUDIT:MIC_SETTINGS] Using raw audio:true constraints');

            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            
            // Force engagement of all tracks
            stream.getAudioTracks().forEach(track => {
                track.enabled = true;
                if (isDev) {
                    console.log('[AUDIT:TRACK_ENGAGEMENT]', {
                        label: track.label,
                        enabled: track.enabled,
                        muted: track.muted,
                        readyState: track.readyState,
                        settings: track.getSettings()
                    });
                }
            });

            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            if (audioContext.state === 'suspended') await audioContext.resume();
            
            const source = audioContext.createMediaStreamSource(stream);
            
            // Analyser for UI Waveform - Connect DIRECTLY to source for truth
            const analyser = audioContext.createAnalyser();
            source.connect(analyser);
            analyser.fftSize = 2048;
            const dataArray = new Uint8Array(analyser.frequencyBinCount);
            
            analyserRef.current = analyser;
            dataArrayRef.current = dataArray;

            const mediaRecorder = new MediaRecorder(stream, { mimeType });
            mediaRecorderRef.current = mediaRecorder;
            chunksRef.current = [];

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    chunksRef.current.push(e.data);
                }
            };

            mediaRecorder.onstop = async () => {
                const blob = new Blob(chunksRef.current, { type: mimeType });
                if (isDev) analyzeAmplitude(blob);

                if (blob.size === 0) {
                    setStatus('idle');
                    return;
                }

                const url = URL.createObjectURL(blob);
                setAudioUrl(url);
                setDuration(recordingTime);
                setStatus('completed');
                uploadRecording(blob, recordingTime, mimeType);
            };

            mediaRecorder.start(250);
            setStatus('recording');
            setRecordingTime(0);
            timerRef.current = setInterval(() => {
                setRecordingTime(prev => prev + 1);
            }, 1000);
        } catch (err) {
            console.error("Error accessing microphone:", err);
            alert("Microphone access denied or not available.");
        }
    };

    const analyzeAmplitude = async (blob) => {
        try {
            const arrayBuffer = await blob.arrayBuffer();
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
            const channelData = audioBuffer.getChannelData(0);
            
            let sumSquares = 0;
            for (let i = 0; i < channelData.length; i++) {
                sumSquares += channelData[i] * channelData[i];
            }
            const rms = Math.sqrt(sumSquares / channelData.length);
            
            console.log('[AUDIT:VOICE_AMPLITUDE]', { 
                rms_level: rms.toFixed(6),
                is_silent: rms < 0.0001,
                sample_count: channelData.length
            });
            
            if (rms < 0.0001) {
                console.warn("[AUDIT:VOICE_TRUTH] RECORDING IS SILENT (RMS ≈ 0)");
            }
        } catch (e) {
            console.error("[AUDIT:VOICE_AMPLITUDE_ERROR]", e);
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.stop();
            mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
            if (timerRef.current) clearInterval(timerRef.current);
        }
    };

    const cancelRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.stop();
            mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
            if (timerRef.current) clearInterval(timerRef.current);
        }
        setStatus('idle');
        setRecordingTime(0);
    };

    const uploadRecording = async (blob, finalDuration, mimeType) => {
        setIsUploading(true);
        const isDev = process.env.NODE_ENV === 'development';
        try {
            const ext = mimeType.includes('webm') ? 'webm' : 'mp4';
            const filename = `recording_${Date.now()}.${ext}`;

            if (isDev) {
                console.log('[AUDIT:VOICE_UPLOAD]', {
                    file_name: filename,
                    bytes: blob.size,
                    mime_type: mimeType
                });
            }

            const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8000';
            const formData = new FormData();
            formData.append('file', blob, filename);
            
            const response = await fetch(`${API_BASE}/feedbacks/upload`, {
                method: 'POST',
                body: formData
            });

            if (!response.ok) throw new Error("Upload failed");
            const data = await response.json();
            
            onComplete({
                type: 'voice_recording',
                url: data.url,
                duration: finalDuration
            });
        } catch (err) {
            console.error("Upload error:", err);
            setStatus('idle'); // Or some error state
        } finally {
            setIsUploading(false);
        }
    };

    const handleDelete = () => {
        setAudioUrl(null);
        setDuration(0);
        setStatus('idle');
        onDelete();
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    if (status === 'idle') {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', padding: '24px', background: '#F8FAFC', borderRadius: '24px', border: '1.5px dashed #E2E8F0' }}>
                <button 
                    onClick={startRecording}
                    style={{ width: '64px', height: '64px', borderRadius: '50%', background: primaryColor, color: 'white', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: `0 8px 16px rgba(var(--primary-rgb, 59, 130, 246), 0.3)`, transition: 'all 0.2s' }}
                    className="press-effect"
                >
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></svg>
                </button>
                <div style={{ fontSize: '14px', fontWeight: '800', color: '#64748B' }}>Tap to start recording</div>
            </div>
        );
    }

    if (status === 'recording') {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', padding: '24px', background: '#FFF5F5', borderRadius: '24px', border: '1.5px solid #FCA5A5' }}>
                {/* HIGH-CONTRAST WAVEFORM MONITOR */}
                <canvas 
                    ref={canvasRef} 
                    width="280" 
                    height="80" 
                    style={{ 
                        borderRadius: '12px', 
                        background: '#000000', 
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                        border: '2px solid #333'
                    }} 
                />
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#EF4444', animation: 'pulse 1.5s infinite' }}></div>
                    <span style={{ fontSize: '16px', fontWeight: '800', color: '#B91C1C' }}>Recording... {formatTime(recordingTime)}</span>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button 
                        onClick={stopRecording}
                        style={{ padding: '10px 24px', borderRadius: '12px', background: '#EF4444', color: 'white', border: 'none', fontWeight: '800', cursor: 'pointer' }}
                    >
                        Done
                    </button>
                    <button 
                        onClick={cancelRecording}
                        style={{ padding: '10px 24px', borderRadius: '12px', background: '#F1F5F9', color: '#64748B', border: 'none', fontWeight: '800', cursor: 'pointer' }}
                    >
                        Cancel
                    </button>
                </div>
                <style>{`
                    @keyframes pulse {
                        0% { transform: scale(1); opacity: 1; }
                        50% { transform: scale(1.5); opacity: 0.5; }
                        100% { transform: scale(1); opacity: 1; }
                    }
                `}</style>
            </div>
        );
    }

    if (status === 'completed') {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '20px', background: 'white', borderRadius: '20px', border: '1.5px solid #E2E8F0', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: isUploading ? '#F1F5F9' : 'rgba(var(--primary-rgb), 0.1)', color: 'var(--primary-color)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {isUploading ? (
                             <div className="loader-mini" style={{ width: '16px', height: '16px', border: '2px solid var(--primary-color)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }}></div>
                        ) : (
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path></svg>
                        )}
                    </div>
                    <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '13px', fontWeight: '800', color: '#1E293B' }}>Voice Feedback</div>
                        <div style={{ fontSize: '11px', color: '#64748B' }}>{formatTime(duration)} • {isUploading ? 'Uploading...' : 'Ready'}</div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button 
                            onClick={() => setStatus('idle')}
                            style={{ padding: '6px 12px', borderRadius: '8px', background: '#F1F5F9', border: 'none', color: '#64748B', fontSize: '11px', fontWeight: '800', cursor: 'pointer' }}
                        >
                            Retake
                        </button>
                        <button 
                            onClick={handleDelete}
                            style={{ padding: '6px 12px', borderRadius: '8px', background: '#FFF5F5', border: 'none', color: '#EF4444', fontSize: '11px', fontWeight: '800', cursor: 'pointer' }}
                        >
                            Delete
                        </button>
                    </div>
                </div>
                {audioUrl && (
                    <audio 
                        ref={audioRef}
                        src={audioUrl} 
                        controls 
                        preload="metadata"
                        style={{ width: '100%', height: '32px', marginTop: '8px' }} 
                        onCanPlay={() => {
                            if (audioRef.current) {
                                audioRef.current.muted = false;
                                audioRef.current.volume = 1;
                            }
                        }}
                    />
                )}
            </div>
        );
    }

    return null;
};

export default VoiceRecorder;
