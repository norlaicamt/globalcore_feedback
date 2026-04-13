import React, { useState } from "react";
import { Link } from "react-router-dom";
import { forgotPassword } from "../services/api";

const ForgotPassword = () => {
    const [email, setEmail] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState(null);
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        try {
            const data = await forgotPassword(email);
            setMessage(data.message);
        } catch (err) {
            setError(err.response?.data?.detail || "An error occurred. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div style={styles.container}>
            <div style={styles.card}>
                <div style={styles.header}>
                    <div style={styles.logoCircle}>
                        <Link to="/" style={{textDecoration: 'none', color: 'var(--primary-color)'}}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                        </Link>
                    </div>
                    <h1 style={styles.title}>Recovery Mode</h1>
                    <p style={styles.subtitle}>Enter your professional email to receive a secure reset link.</p>
                </div>

                {!message ? (
                    <form onSubmit={handleSubmit} style={styles.form}>
                        <div style={styles.inputGroup}>
                            <label style={styles.label}>Official Email</label>
                            <input 
                                type="email" 
                                required 
                                style={styles.input} 
                                value={email} 
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="name@organization.com"
                            />
                        </div>
                        
                        {error && <div style={styles.error}>{error}</div>}

                        <button 
                            type="submit" 
                            disabled={isLoading} 
                            style={styles.button}
                        >
                            {isLoading ? "Dispatching..." : "Send Reset Link"}
                        </button>
                    </form>
                ) : (
                    <div style={styles.successBox}>
                        <div style={styles.successIcon}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                        </div>
                        <p style={styles.successText}>{message}</p>
                        <p style={styles.subSuccess}>For testing, check the backend console for the link.</p>
                    </div>
                )}

                <div style={styles.footer}>
                    <Link to="/" style={styles.backLink}>← Return to Login</Link>
                </div>
            </div>
            
            <div style={styles.branding}>
                Powered by GlobalCore Stewardship System
            </div>
        </div>
    );
};

const styles = {
    container: {
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
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
    },
    footer: {
        marginTop: '32px',
        textAlign: 'center'
    },
    backLink: {
        color: '#64748B',
        textDecoration: 'none',
        fontSize: '14px',
        fontWeight: '700',
        transition: 'color 0.2s'
    },
    branding: {
        marginTop: '40px',
        fontSize: '12px',
        fontWeight: '800',
        color: '#94A3B8',
        textTransform: 'uppercase',
        letterSpacing: '0.1em'
    }
};

export default ForgotPassword;
