import React, { useState, useEffect } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import { resetPassword } from "../services/api";

const ResetPassword = () => {
    const [searchParams] = useSearchParams();
    const token = searchParams.get("token");
    const navigate = useNavigate();

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!token) {
            setError("Invalid session. No security token found.");
        }
    }, [token]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            setError("Passwords do not match. Please verify.");
            return;
        }
        if (password.length < 8) {
            setError("Password must be at least 8 characters long.");
            return;
        }

        setIsLoading(true);
        setError(null);
        try {
            const data = await resetPassword(token, password);
            setMessage(data.message);
            // Redirect after 3 seconds
            setTimeout(() => navigate("/"), 3000);
        } catch (err) {
            setError(err.response?.data?.detail || "Session expired or token invalid. Please request a new link.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div style={styles.container}>
            <div style={styles.card}>
                <div style={styles.header}>
                    <div style={styles.logoCircle}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>
                    </div>
                    <h1 style={styles.title}>Update Credentials</h1>
                    <p style={styles.subtitle}>Set a new professional access key for your account.</p>
                </div>

                {!message ? (
                    <form onSubmit={handleSubmit} style={styles.form}>
                        <div style={styles.inputGroup}>
                            <label style={styles.label}>New Access Key</label>
                            <input 
                                type="password" 
                                required 
                                style={styles.input} 
                                value={password} 
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                            />
                        </div>
                        
                        <div style={styles.inputGroup}>
                            <label style={styles.label}>Confirm Access Key</label>
                            <input 
                                type="password" 
                                required 
                                style={styles.input} 
                                value={confirmPassword} 
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="••••••••"
                            />
                        </div>

                        {error && <div style={styles.error}>{error}</div>}

                        <button 
                            type="submit" 
                            disabled={isLoading || !token} 
                            style={{...styles.button, opacity: !token ? 0.6 : 1}}
                        >
                            {isLoading ? "Synchronizing..." : "Update Password"}
                        </button>
                    </form>
                ) : (
                    <div style={styles.successBox}>
                        <div style={styles.successIcon}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                        </div>
                        <p style={styles.successText}>Credentials Updated</p>
                        <p style={styles.subSuccess}>Redirecting you to the portal...</p>
                    </div>
                )}
            </div>
        </div>
    );
};

const styles = {
    container: {
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#F8FAFC',
        fontFamily: '"Inter", sans-serif',
        padding: '24px'
    },
    card: {
        width: '100%',
        maxWidth: '440px',
        background: 'white',
        borderRadius: '32px',
        border: '1px solid #E2E8F0',
        padding: '48px',
        boxShadow: '0 20px 50px rgba(0,0,0,0.04)',
        animation: 'slideUp 0.5s ease-out'
    },
    header: {
        textAlign: 'center',
        marginBottom: '40px'
    },
    logoCircle: {
        width: '56px',
        height: '56px',
        background: 'rgba(var(--primary-rgb), 0.05)',
        borderRadius: '18px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0 auto 24px',
        color: 'var(--primary-color)'
    },
    title: {
        fontSize: '28px',
        fontWeight: '900',
        color: 'var(--primary-color)',
        margin: '0 0 12px 0',
        letterSpacing: '-1px'
    },
    subtitle: {
        fontSize: '15px',
        color: '#64748B',
        margin: 0,
        lineHeight: '1.6'
    },
    form: {
        display: 'flex',
        flexDirection: 'column',
        gap: '24px'
    },
    inputGroup: {
        display: 'flex',
        flexDirection: 'column',
        gap: '10px'
    },
    label: {
        fontSize: '13px',
        fontWeight: '800',
        color: 'var(--primary-color)',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        paddingLeft: '4px'
    },
    input: {
        width: '100%',
        padding: '16px 20px',
        background: '#F8FAFC',
        border: '1.5px solid #E2E8F0',
        borderRadius: '16px',
        fontSize: '15px',
        outline: 'none',
        transition: 'all 0.2s ease',
        boxSizing: 'border-box'
    },
    button: {
        width: '100%',
        padding: '18px',
        background: 'var(--primary-color)',
        color: 'white',
        border: 'none',
        borderRadius: '18px',
        fontSize: '16px',
        fontWeight: '800',
        cursor: 'pointer',
        boxShadow: '0 10px 25px rgba(var(--primary-rgb), 0.15)',
        transition: 'transform 0.2s'
    },
    error: {
        background: '#FEF2F2',
        color: '#DC2626',
        padding: '12px 16px',
        borderRadius: '12px',
        fontSize: '13px',
        fontWeight: '600',
        textAlign: 'center'
    },
    successBox: {
        textAlign: 'center',
        padding: '24px',
        background: '#F0FDF4',
        borderRadius: '24px',
        border: '1px solid #DCFCE7'
    },
    successIcon: {
        width: '48px',
        height: '48px',
        background: 'white',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0 auto 16px'
    },
    successText: {
        fontSize: '15px',
        fontWeight: '700',
        color: '#166534',
        margin: '0 0 8px 0'
    },
    subSuccess: {
        fontSize: '13px',
        color: '#166534',
        opacity: 0.8,
        margin: 0
    }
};

export default ResetPassword;
