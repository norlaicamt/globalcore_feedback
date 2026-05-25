import React, { useEffect, useState, useCallback } from "react";
import * as XLSX from 'xlsx';
import {
    adminGetEntities, adminGetBranches,
    adminGetProducts, adminCreateProduct, adminUpdateProduct, adminDeleteProduct,
    adminDuplicateProduct, adminBulkImportProducts, adminGetProductAnalytics
} from "../../../services/adminApi";
import CustomModal from "../../CustomModal";
import { resolveMediaUrl } from "../../../utils/feedback";
import { getFeedbacks } from "../../../services/api";

// Service-type workspace types — only these can own Products
const SERVICE_TYPES = ['Restaurant', 'Pool', 'Spa', 'Housekeeping', 'Shop', 'Store', 'Gift Shop'];

// Product-type categories — locked list
const PRODUCT_TYPES = ['Drinks', 'Cosmetics', 'Souvenirs', 'Hotel Items', 'Food', 'Merchandise'];

const AdminProducts = ({ theme, darkMode, adminUser, isScoped }) => {
    const [products, setProducts] = useState([]);
    const [entities, setEntities] = useState([]);
    const [branches, setBranches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [filterEntity, setFilterEntity] = useState(adminUser?.entity_id || "");
    const [filterBranch, setFilterBranch] = useState("");

    // Columns Visibility State
    const [columns, setColumns] = useState(() => {
        const saved = localStorage.getItem("admin_product_columns");
        let initial = {
            showName: true,
            showType: false,
            showScope: false,
            showStatus: false,
            showActions: true
        };
        if (saved) {
            try {
                initial = { ...initial, ...JSON.parse(saved) };
            } catch (e) {
                // fallback
            }
        }
        // Force hide non-essential columns on mobile viewport to prevent initial crowding
        if (window.innerWidth < 768) {
            initial.showType = false;
            initial.showStatus = false;
        }
        return initial;
    });
    const [isColDropdownOpen, setIsColDropdownOpen] = useState(false);

    useEffect(() => {
        localStorage.setItem("admin_product_columns", JSON.stringify(columns));
        console.log("[PRODUCT_COLUMNS]", {
            show_product_type: columns.showType
        });
    }, [columns]);

    // Modal states
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentProduct, setCurrentProduct] = useState(null);
    const [form, setForm] = useState({
        name: "",
        category: "",
        image_url: "",
        is_active: true,
        entity_id: adminUser?.entity_id || "",
        branch_id: "",
        evaluation_template_id: ""
    });
    const [dialog, setDialog] = useState({ isOpen: false });
    const [analyticsData, setAnalyticsData] = useState(null);
    const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false);
    const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
    const [bulkData, setBulkData] = useState("");


    // Product Feedbacks Modal
    const [selectedProductForFeedback, setSelectedProductForFeedback] = useState(null);
    const [productFeedbacks, setProductFeedbacks] = useState([]);
    const [feedbacksLoading, setFeedbacksLoading] = useState(false);
    const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);

    const handleOpenFeedbackModal = async (product) => {
        setSelectedProductForFeedback(product);
        setIsFeedbackModalOpen(true);
        setFeedbacksLoading(true);
        try {
            console.log("[PRODUCT_MODAL_FETCH]", {
                caller: "AdminProducts",
                product_id: product.id
            });
            const data = await getFeedbacks({ product_id: product.id, only_approved: false, limit: 100 });
            setProductFeedbacks(Array.isArray(data) ? data : (data.items || []));
        } catch (err) {
            console.error("Failed to load feedbacks for product:", err);
            setProductFeedbacks([]);
        } finally {
            setFeedbacksLoading(false);
        }
    };

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const [prodData, entData] = await Promise.all([
                adminGetProducts(filterEntity || null, filterBranch || null),
                adminGetEntities()
            ]);
            setProducts(prodData);
            // Only keep Service-type entities so products can't be assigned to non-service workspaces
            setEntities(entData.filter(e => SERVICE_TYPES.includes(e.fields?.operational?.workspace_type)));

            if (filterEntity) {
                const branchData = await adminGetBranches(filterEntity);
                setBranches(branchData);
            } else {
                setBranches([]);
            }
        } catch (err) {
            console.error("Failed to load products:", err);
        }
        setLoading(false);
    }, [filterEntity, filterBranch]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleOpenModal = (product = null) => {
        if (product) {
            setCurrentProduct(product);
            setForm({
                name: product.name,
                category: product.category || "",
                image_url: product.image_url || "",
                is_active: product.is_active,
                entity_id: product.entity_id,
                branch_id: product.branch_id || "",
                evaluation_template_id: product.evaluation_template_id || ""
            });
        } else {
            setCurrentProduct(null);
            setForm({
                name: "",
                category: "",
                image_url: "",
                is_active: true,
                entity_id: filterEntity || adminUser?.entity_id || "",
                branch_id: "",
                evaluation_template_id: ""
            });
        }
        setIsModalOpen(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        if (!form.name) return;

        try {
            const payload = {
                ...form,
                branch_id: form.branch_id || null,
                evaluation_template_id: form.evaluation_template_id || null,
                image_url: form.image_url || null
            };

            if (currentProduct) {
                await adminUpdateProduct(currentProduct.id, payload);
            } else {
                await adminCreateProduct(payload);
            }
            setIsModalOpen(false);
            loadData();
        } catch (err) {
            setDialog({
                isOpen: true, type: "error", title: "Error",
                message: "Failed to save product. Please check your inputs.",
                confirmText: "OK", onConfirm: () => setDialog({ isOpen: false })
            });
        }
    };

    const handleDuplicate = async (product) => {
        try {
            await adminDuplicateProduct(product.id);
            loadData();
        } catch (err) {
            console.error("Failed to duplicate product", err);
        }
    };

    const handleOpenAnalytics = async (product) => {
        try {
            const data = await adminGetProductAnalytics(product.id);
            setAnalyticsData({ ...data, productName: product.name });
            setIsAnalyticsOpen(true);
        } catch (err) {
            console.error("Failed to fetch analytics", err);
        }
    };

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (evt) => {
            try {
                const bstr = evt.target.result;
                const wb = XLSX.read(bstr, { type: 'binary' });
                const wsname = wb.SheetNames[0];
                const ws = wb.Sheets[wsname];
                const data = XLSX.utils.sheet_to_json(ws, { header: 1 });

                // Skip header row and map data
                const productsToImport = data.slice(1).map(row => {
                    const name = row[0]?.toString().trim();
                    const category = row[1]?.toString().trim() || "Uncategorized";

                    let entity_id = parseInt(filterEntity) || adminUser?.entity_id || null;

                    return {
                        name,
                        category,
                        entity_id,
                        is_active: true
                    };
                }).filter(p => p.name);

                if (productsToImport.length === 0) throw new Error("No valid products found");

                await adminBulkImportProducts(productsToImport);
                setIsBulkModalOpen(false);
                setDialog({
                    isOpen: true, type: "success", title: "Import Successful",
                    message: `Successfully imported ${productsToImport.length} products from Excel.`,
                    confirmText: "Great", onConfirm: () => setDialog({ isOpen: false })
                });
                loadData();
            } catch (err) {
                setDialog({
                    isOpen: true, type: "error", title: "Import Failed",
                    message: err.response?.data?.detail || err.message || "Failed to parse Excel file. Ensure columns are: Name, Product Type.",
                    confirmText: "OK", onConfirm: () => setDialog({ isOpen: false })
                });
            }
        };
        reader.readAsBinaryString(file);
    };

    const handleBulkImport = async () => {
        if (!bulkData.trim()) return;
        try {
            const lines = bulkData.split("\n").filter(l => l.trim());
            const productsToImport = lines.map(line => {
                // Support both Comma (CSV) and Tab (Excel paste) separators
                const delimiter = line.includes("\t") ? "\t" : ",";
                const parts = line.split(delimiter);

                const name = parts[0]?.trim();
                const category = parts[1]?.trim() || "Uncategorized";

                let entity_id = parseInt(filterEntity) || adminUser?.entity_id || null;

                return {
                    name,
                    category,
                    entity_id,
                    is_active: true
                };
            }).filter(p => p.name);

            if (productsToImport.length === 0) return;
            await adminBulkImportProducts(productsToImport);
            setIsBulkModalOpen(false);
            setBulkData("");
            setDialog({
                isOpen: true, type: "success", title: "Import Successful",
                message: `Successfully imported ${productsToImport.length} products.`,
                confirmText: "Great", onConfirm: () => setDialog({ isOpen: false })
            });
            loadData();
        } catch (err) {
            setDialog({
                isOpen: true, type: "error", title: "Import Failed",
                message: err.response?.data?.detail || err.message || "Please ensure your data follows the format: Name, Product Type.",
                confirmText: "OK", onConfirm: () => setDialog({ isOpen: false })
            });
        }
    };

    const handleDelete = (product) => {
        setDialog({
            isOpen: true, type: "alert", title: "Deactivate Product",
            message: `Are you sure you want to deactivate "${product.name}"?`,
            confirmText: "Deactivate", isDestructive: true,
            onConfirm: async () => {
                try {
                    await adminDeleteProduct(product.id);
                    setDialog({ isOpen: false });
                    loadData();
                } catch (err) {
                    setDialog({
                        isOpen: true, type: "error", title: "Error",
                        message: "Failed to deactivate product.",
                        confirmText: "OK", onConfirm: () => setDialog({ isOpen: false })
                    });
                }
            },
            onCancel: () => setDialog({ isOpen: false })
        });
    };

    const filteredProducts = products
        .filter(p =>
            p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.category?.toLowerCase().includes(searchQuery.toLowerCase())
        )
        .sort((a, b) => a.name.localeCompare(b.name));

    const styles = {
        container: { animation: 'fadeIn 0.3s ease-out' },
        header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' },
        title: { fontSize: '20px', fontWeight: '900', color: theme.text, margin: 0 },
        statsRow: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' },
        statCard: { background: theme.surface, padding: '20px', borderRadius: '16px', border: `1px solid ${theme.border}` },
        statVal: { fontSize: '24px', fontWeight: '900', color: 'var(--primary-color)', margin: '0 0 4px 0' },
        statLabel: { fontSize: '11px', fontWeight: '700', color: theme.textMuted, textTransform: 'uppercase' },
        controls: { display: 'flex', gap: '12px', marginBottom: '20px', alignItems: 'center' },
        searchBox: { flex: 1, position: 'relative', maxWidth: '400px' },
        input: { width: '100%', padding: '10px 16px', borderRadius: '10px', background: theme.surface, border: `1px solid ${theme.border}`, color: theme.text, fontSize: '14px', outline: 'none' },
        select: { padding: '10px 16px', borderRadius: '10px', background: theme.surface, border: `1px solid ${theme.border}`, color: theme.text, fontSize: '14px', outline: 'none', minWidth: '150px' },
        tableCard: { background: theme.surface, borderRadius: '16px', border: `1px solid ${theme.border}`, overflow: 'hidden' },
        table: { width: '100%', borderCollapse: 'collapse' },
        th: { padding: '12px 16px', textAlign: 'left', fontSize: '11px', fontWeight: '800', color: theme.textMuted, textTransform: 'uppercase', background: darkMode ? 'rgba(255,255,255,0.02)' : '#F8FAFC', borderBottom: `1px solid ${theme.border}` },
        td: { padding: '12px 16px', fontSize: '13px', color: theme.text, borderBottom: `1px solid ${theme.border}` },
        productThumb: { width: '36px', height: '36px', borderRadius: '8px', objectFit: 'cover', background: theme.bg },
        badge: (type) => {
            let colors = { bg: 'rgba(107, 114, 128, 0.1)', text: '#6B7280' }; // Default
            if (type === 'Trending') colors = { bg: 'rgba(236, 72, 153, 0.1)', text: '#EC4899' };
            if (type === 'Active') colors = { bg: 'rgba(16, 185, 129, 0.1)', text: '#10B981' };
            if (type === 'New') colors = { bg: 'rgba(59, 130, 246, 0.1)', text: '#3B82F6' };
            if (type === 'No Feedback') colors = { bg: 'rgba(107, 114, 128, 0.1)', text: '#6B7280' };

            return { display: 'inline-block', padding: '4px 10px', borderRadius: '20px', fontSize: '10px', fontWeight: '800', background: colors.bg, color: colors.text, textTransform: 'uppercase', letterSpacing: '0.05em' };
        },
        btnPrimary: { padding: '10px 20px', background: 'var(--primary-color)', color: 'white', border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' },
        modal: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' },
        modalContent: { background: theme.surface, width: '100%', maxWidth: '600px', borderRadius: '24px', padding: '32px', boxShadow: '0 20px 50px rgba(0,0,0,0.3)', position: 'relative' },
        formGroup: { marginBottom: '20px' },
        formLabel: { display: 'block', fontSize: '12px', fontWeight: '800', color: theme.textMuted, marginBottom: '8px', textTransform: 'uppercase' }
    };

    const activeColsCount = [
        columns.showName,
        columns.showType,
        columns.showStatus,
        columns.showActions
    ].filter(Boolean).length;

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <h2 style={styles.title}>Product Catalog</h2>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button onClick={() => setIsBulkModalOpen(true)} style={{ ...styles.btnPrimary, background: 'none', color: theme.text, border: `1px solid ${theme.border}` }}>
                        Import
                    </button>
                    <button onClick={() => handleOpenModal()} style={styles.btnPrimary}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                        Add Product
                    </button>
                </div>
            </div>

            <div style={styles.statsRow}>
                <div style={styles.statCard}>
                    <p style={styles.statVal}>{products.length}</p>
                    <p style={styles.statLabel}>Total Products</p>
                </div>
                <div style={styles.statCard}>
                    <p style={styles.statVal}>{products.filter(p => p.is_active).length}</p>
                    <p style={styles.statLabel}>Active Items</p>
                </div>
                <div style={styles.statCard}>
                    <p style={styles.statVal}>{new Set(products.map(p => p.category)).size}</p>
                    <p style={styles.statLabel}>Categories</p>
                </div>
            </div>

            <div style={styles.controls}>
                <div style={styles.searchBox}>
                    <input
                        style={styles.input}
                        placeholder="Search by name or category..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                {!isScoped && (
                    <select
                        style={styles.select}
                        value={filterEntity}
                        onChange={(e) => { setFilterEntity(e.target.value); setFilterBranch(""); }}
                    >
                        <option value="">All Workspaces</option>
                        {entities.map(e => {
                            const wsType = e.fields?.operational?.workspace_type || 'Workspace';
                            const suffix = e.name.toLowerCase() !== wsType.toLowerCase() ? ` (${wsType})` : '';
                            return (
                                <option key={e.id} value={e.id}>
                                    {e.name}
                                </option>
                            );
                        })}
                    </select>
                )}
                {filterEntity && branches.length > 0 && (
                    <select
                        style={styles.select}
                        value={filterBranch}
                        onChange={(e) => setFilterBranch(e.target.value)}
                    >
                        <option value="">All Locations</option>
                        {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </select>
                )}

                {/* Columns Visibility Dropdown */}
                <div style={{ position: 'relative' }}>
                    <button
                        onClick={() => setIsColDropdownOpen(!isColDropdownOpen)}
                        style={{
                            ...styles.select,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            cursor: 'pointer',
                            userSelect: 'none',
                            fontWeight: '700',
                            background: theme.surface,
                            color: theme.text,
                            border: `1px solid ${theme.border}`,
                            padding: '10px 16px',
                            borderRadius: '10px',
                            minWidth: 'auto'
                        }}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M3 12h18M3 6h18M3 18h18" />
                        </svg>
                        <span>Columns</span>
                    </button>

                    {isColDropdownOpen && (
                        <>
                            <div 
                                onClick={() => setIsColDropdownOpen(false)} 
                                style={{ position: 'fixed', inset: 0, zIndex: 998 }} 
                            />
                            <div
                                style={{
                                    position: 'absolute',
                                    right: 0,
                                    top: 'calc(100% + 8px)',
                                    background: theme.surface,
                                    border: `1px solid ${theme.border}`,
                                    borderRadius: '12px',
                                    boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
                                    padding: '16px',
                                    zIndex: 999,
                                    minWidth: '180px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '10px'
                                }}
                            >
                                <div style={{ fontSize: '11px', fontWeight: '800', color: theme.textMuted, textTransform: 'uppercase', marginBottom: '4px', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                        <circle cx="12" cy="12" r="3" />
                                    </svg>
                                    <span>View Options</span>
                                </div>
                                {[
                                    { key: 'showName', label: 'Product Name' },
                                    { key: 'showType', label: 'Product Type' },
                                    { key: 'showStatus', label: 'Status' },
                                    { key: 'showActions', label: 'Actions' }
                                ].map(col => (
                                    <label
                                        key={col.key}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '10px',
                                            fontSize: '13px',
                                            fontWeight: '600',
                                            color: theme.text,
                                            cursor: 'pointer',
                                            padding: '2px 0',
                                            userSelect: 'none'
                                        }}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={columns[col.key]}
                                            onChange={() => {
                                                setColumns(prev => ({
                                                    ...prev,
                                                    [col.key]: !prev[col.key]
                                                }));
                                            }}
                                            style={{
                                                accentColor: 'var(--primary-color)',
                                                cursor: 'pointer',
                                                width: '15px',
                                                height: '15px'
                                            }}
                                        />
                                        {col.label}
                                    </label>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </div>

            <div style={styles.tableCard}>
                <table style={styles.table}>
                    <thead>
                        <tr>
                            {columns.showName && <th style={{ ...styles.th }}>Product</th>}
                            {columns.showType && <th style={{ ...styles.th, width: '160px' }}>Product Type</th>}
                            {columns.showStatus && <th style={{ ...styles.th, width: '140px' }}>Status</th>}
                            {columns.showActions && <th style={{ ...styles.th, width: '200px', textAlign: 'right' }}>Actions</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={activeColsCount} style={{ padding: '40px', textAlign: 'center', color: theme.textMuted }}>Loading products...</td></tr>
                        ) : filteredProducts.length === 0 ? (
                            <tr><td colSpan={activeColsCount} style={{ padding: '40px', textAlign: 'center', color: theme.textMuted }}>No products found.</td></tr>
                        ) : filteredProducts.map(p => {
                            return (
                                <tr
                                    key={p.id}
                                    onClick={() => handleOpenFeedbackModal(p)}
                                    style={{
                                        cursor: 'pointer',
                                        transition: 'background-color 0.2s'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = darkMode ? 'rgba(255,255,255,0.02)' : '#F8FAFC'}
                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                >
                                    {columns.showName && (
                                        <td style={styles.td}>
                                            <div style={{ fontWeight: '700' }}>{p.name}</div>
                                        </td>
                                    )}
                                    {columns.showType && (
                                        <td style={styles.td}>
                                            <span style={{ fontSize: '13px', color: theme.text }}>
                                                {p.category || '—'}
                                            </span>
                                        </td>
                                    )}

                                    {columns.showStatus && (
                                        <td style={styles.td}>
                                            {(() => {
                                                const getStatus = () => {
                                                    if (p.feedback_count > 5) return 'Trending';
                                                    if (p.feedback_count > 0) return 'Active';
                                                    const createdDate = new Date(p.created_at);
                                                    const now = new Date();
                                                    if ((now - createdDate) / (1000 * 60 * 60 * 24) < 7) return 'New';
                                                    return 'No Feedback';
                                                };
                                                const status = getStatus();
                                                return (
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                        <span style={styles.badge(status)}>{status}</span>
                                                        {p.feedback_count > 0 && (
                                                            <span style={{ fontSize: '10px', color: theme.textMuted, fontWeight: '600' }}>
                                                                {p.feedback_count} feedback entries
                                                            </span>
                                                        )}
                                                    </div>
                                                );
                                            })()}
                                        </td>
                                    )}
                                    {columns.showActions && (
                                        <td style={{ ...styles.td, textAlign: 'right' }} onClick={(e) => e.stopPropagation()}>
                                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                                <button onClick={() => handleOpenAnalytics(p)} title="Analytics" style={{ background: 'none', border: 'none', color: '#6366F1', cursor: 'pointer' }}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20V10M18 20V4M6 20v-4" /></svg></button>
                                                <button onClick={() => handleDuplicate(p)} title="Duplicate" style={{ background: 'none', border: 'none', color: theme.textMuted, cursor: 'pointer' }}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" /></svg></button>
                                                <button onClick={() => handleOpenModal(p)} style={{ background: 'none', border: 'none', color: 'var(--primary-color)', cursor: 'pointer', fontWeight: '700' }}>Edit</button>
                                                <button onClick={() => handleDelete(p)} style={{ background: 'none', border: 'none', color: theme.textMuted, cursor: 'pointer', fontWeight: '700' }}>Deactivate</button>
                                            </div>
                                        </td>
                                    )}
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {isModalOpen && (
                <div style={styles.modal}>
                    <div style={styles.modalContent}>
                        <h3 style={{ margin: '0 0 24px 0', fontSize: '18px', fontWeight: '900', color: theme.text }}>
                            {currentProduct ? "Edit Product" : "Add New Product"}
                        </h3>
                        <form onSubmit={handleSave}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                <div style={styles.formGroup}>
                                    <label style={styles.formLabel}>Product Name</label>
                                    <input style={styles.input} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
                                </div>
                                <div style={styles.formGroup}>
                                    <label style={styles.formLabel}>Product Type</label>
                                    <select style={styles.input} value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} required>
                                        <option value="">Select a Product Type…</option>
                                        {PRODUCT_TYPES.map(pt => <option key={pt} value={pt}>{pt}</option>)}
                                    </select>
                                </div>

                            </div>

                            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '32px' }}>
                                <button type="button" onClick={() => setIsModalOpen(false)} style={{ ...styles.btnPrimary, background: 'none', color: theme.textMuted, border: `1px solid ${theme.border}` }}>Cancel</button>
                                <button type="submit" style={styles.btnPrimary}>Save Product</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {isBulkModalOpen && (
                <div style={styles.modal}>
                    <div style={{ ...styles.modalContent, maxWidth: '500px' }}>
                        <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: '900', color: theme.text }}>Import Products</h3>
                        <p style={{ fontSize: '12px', color: theme.textMuted, marginBottom: '20px' }}>
                            Choose an Excel/CSV file or paste data below.
                        </p>

                        <div style={{ marginBottom: '20px', padding: '20px', border: `2px dashed ${theme.border}`, borderRadius: '12px', textAlign: 'center' }}>
                            <input
                                type="file"
                                accept=".xlsx, .xls, .csv"
                                onChange={handleFileUpload}
                                style={{ display: 'none' }}
                                id="excel-upload"
                            />
                            <label htmlFor="excel-upload" style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--primary-color)" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" /></svg>
                                <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--primary-color)' }}>Click to upload Excel / CSV</span>
                                <span style={{ fontSize: '10px', color: theme.textMuted }}>Columns: Name, Product Type</span>
                            </label>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
                            <div style={{ flex: 1, height: '1px', background: theme.border }} />
                            <span style={{ fontSize: '10px', color: theme.textMuted, fontWeight: '800', textTransform: 'uppercase' }}>OR PASTE DATA</span>
                            <div style={{ flex: 1, height: '1px', background: theme.border }} />
                        </div>

                        <textarea
                            style={{ ...styles.input, height: '120px', fontFamily: 'monospace', fontSize: '12px', padding: '12px', lineHeight: '1.6' }}
                            placeholder="Example:&#10;Mango Smoothie, Drinks&#10;Lavender Body Scrub, Cosmetics&#10;Keychain, Souvenirs"
                            value={bulkData}
                            onChange={e => setBulkData(e.target.value)}
                        />
                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
                            <button onClick={() => setIsBulkModalOpen(false)} style={{ ...styles.btnPrimary, background: 'none', color: theme.textMuted, border: `1px solid ${theme.border}` }}>Cancel</button>
                            <button onClick={handleBulkImport} style={styles.btnPrimary}>Import Pasted Data</button>
                        </div>
                    </div>
                </div>
            )}

            {isAnalyticsOpen && analyticsData && (
                <div style={styles.modal}>
                    <div style={{ ...styles.modalContent, maxWidth: '600px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                            <div>
                                <h3 style={{ margin: '0 0 4px 0', fontSize: '20px', fontWeight: '900', color: theme.text }}>{analyticsData.productName}</h3>
                                <p style={{ margin: 0, fontSize: '12px', color: theme.textMuted }}>Product Intelligence Dashboard</p>
                            </div>
                            <button onClick={() => setIsAnalyticsOpen(false)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: theme.textMuted }}>&times;</button>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
                            <div style={{ padding: '16px', background: theme.bg, borderRadius: '12px' }}>
                                <p style={{ fontSize: '20px', fontWeight: '900', color: 'var(--primary-color)', margin: '0 0 4px 0' }}>{analyticsData.total_reviews}</p>
                                <p style={{ fontSize: '10px', fontWeight: '700', color: theme.textMuted, textTransform: 'uppercase' }}>Reviews</p>
                            </div>
                            <div style={{ padding: '16px', background: theme.bg, borderRadius: '12px' }}>
                                <p style={{ fontSize: '20px', fontWeight: '900', color: '#F59E0B', margin: '0 0 4px 0' }}>{analyticsData.average_rating}</p>
                                <p style={{ fontSize: '10px', fontWeight: '700', color: theme.textMuted, textTransform: 'uppercase' }}>Rating</p>
                            </div>
                            <div style={{ padding: '16px', background: theme.bg, borderRadius: '12px' }}>
                                <p style={{ fontSize: '20px', fontWeight: '900', color: '#10B981', margin: '0 0 4px 0' }}>{analyticsData.sentiment.positive}%</p>
                                <p style={{ fontSize: '10px', fontWeight: '700', color: theme.textMuted, textTransform: 'uppercase' }}>Positive</p>
                            </div>
                        </div>

                        <div style={{ marginBottom: '24px' }}>
                            <p style={styles.formLabel}>Sentiment Breakdown</p>
                            <div style={{ height: '8px', width: '100%', background: '#E2E8F0', borderRadius: '4px', overflow: 'hidden', display: 'flex' }}>
                                <div style={{ width: `${analyticsData.sentiment.positive}%`, background: '#10B981', height: '100%' }} />
                                <div style={{ width: `${analyticsData.sentiment.neutral}%`, background: '#F59E0B', height: '100%' }} />
                                <div style={{ width: `${analyticsData.sentiment.negative}%`, background: '#EF4444', height: '100%' }} />
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '11px', fontWeight: '700' }}>
                                <span style={{ color: '#10B981' }}>Positive {analyticsData.sentiment.positive}%</span>
                                <span style={{ color: '#F59E0B' }}>Neutral {analyticsData.sentiment.neutral}%</span>
                                <span style={{ color: '#EF4444' }}>Negative {analyticsData.sentiment.negative}%</span>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                            <div>
                                <p style={styles.formLabel}>Media Capture</p>
                                <div style={{ display: 'flex', gap: '16px' }}>
                                    <div style={{ textAlign: 'center' }}>
                                        <p style={{ fontSize: '16px', fontWeight: '800', margin: '0 0 2px 0' }}>{analyticsData.photo_count}</p>
                                        <p style={{ fontSize: '10px', color: theme.textMuted }}>Photos</p>
                                    </div>
                                    <div style={{ textAlign: 'center' }}>
                                        <p style={{ fontSize: '16px', fontWeight: '800', margin: '0 0 2px 0' }}>{analyticsData.voice_count}</p>
                                        <p style={{ fontSize: '10px', color: theme.textMuted }}>Voice</p>
                                    </div>
                                </div>
                            </div>
                            <div>
                                <p style={styles.formLabel}>Trend (30 Days)</p>
                                <div style={{ height: '40px', display: 'flex', alignItems: 'flex-end', gap: '2px' }}>
                                    {analyticsData.trend.slice(-15).map((t, i) => (
                                        <div key={i} style={{ flex: 1, height: `${Math.min(100, (t.count / (analyticsData.total_reviews || 1)) * 100)}%`, background: 'var(--primary-color)', opacity: 0.6, borderRadius: '1px' }} />
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <CustomModal
                isOpen={dialog.isOpen} title={dialog.title} message={dialog.message}
                type={dialog.type} confirmText={dialog.confirmText} isDestructive={dialog.isDestructive}
                onConfirm={dialog.onConfirm} onCancel={() => setDialog({ isOpen: false })}
            />

            {isFeedbackModalOpen && selectedProductForFeedback && (
                <div style={styles.modal}>
                    <div style={{ ...styles.modalContent, maxWidth: '750px', maxHeight: '85vh', display: 'flex', flexDirection: 'column', padding: '24px' }}>
                        {/* Modal Header */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${theme.border}`, paddingBottom: '16px', marginBottom: '16px' }}>
                            <div>
                                <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '900', color: theme.text }}>
                                    Feedback for "{selectedProductForFeedback.name}"
                                </h3>
                                <span style={{ ...styles.badge('Active'), marginTop: '6px' }}>
                                    {selectedProductForFeedback.category || "General"}
                                </span>
                            </div>
                            <button
                                onClick={() => { setIsFeedbackModalOpen(false); setSelectedProductForFeedback(null); }}
                                style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: theme.textMuted }}
                            >
                                &times;
                            </button>
                        </div>

                        {/* Modal Scrollable Body */}
                        <div style={{ flex: 1, overflowY: 'auto', paddingRight: '4px' }}>
                            {feedbacksLoading ? (
                                <div style={{ padding: '40px 0', textAlign: 'center', color: theme.textMuted }}>
                                    Loading feedback entries...
                                </div>
                            ) : productFeedbacks.length === 0 ? (
                                <div style={{ padding: '40px 0', textAlign: 'center', color: theme.textMuted }}>
                                    No feedback entries found for this product yet.
                                </div>
                            ) : (() => {
                                const directFeedbacks = [];

                                productFeedbacks.forEach(fb => {
                                    const fbProdId = fb.product_id || (fb.custom_data && fb.custom_data.product_id);
                                    const isDirect = fbProdId && Number(fbProdId) === Number(selectedProductForFeedback.id);

                                    if (isDirect) {
                                        directFeedbacks.push(fb);
                                        console.log("[ADMIN_SUBMISSIONS_SCOPE]", {
                                            feedback_id: fb.id,
                                            entity_id: fb.entity_id,
                                            product_id: fbProdId,
                                            scope: "product"
                                        });
                                    } else {
                                        console.log("[ADMIN_SUBMISSIONS_SCOPE]", {
                                            feedback_id: fb.id,
                                            entity_id: fb.entity_id,
                                            product_id: fbProdId || null,
                                            scope: "skipped"
                                        });
                                    }
                                });

                                if (directFeedbacks.length === 0) {
                                    return (
                                        <div style={{ padding: '40px 0', textAlign: 'center', color: theme.textMuted }}>
                                            No feedback entries found for this product yet.
                                        </div>
                                    );
                                }

                                const renderFeedbackCard = (fb, isDirect) => (
                                    <div 
                                        key={fb.id} 
                                        style={{ 
                                            background: darkMode ? 'rgba(255,255,255,0.02)' : '#F8FAFC', 
                                            border: `1px solid ${theme.border}`, 
                                            borderRadius: '16px', 
                                            padding: '16px',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: '10px'
                                        }}
                                    >
                                        {/* Top row: Sender & Rating */}
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <div 
                                                    style={{ 
                                                        width: '32px', 
                                                        height: '32px', 
                                                        borderRadius: '50%', 
                                                        backgroundColor: 'var(--primary-color)', 
                                                        color: '#FFFFFF', 
                                                        display: 'flex', 
                                                        alignItems: 'center', 
                                                        justifyContent: 'center', 
                                                        fontSize: '14px', 
                                                        fontWeight: 'bold' 
                                                    }}
                                                >
                                                    {((fb.is_anonymous ? "Anonymous" : fb.user_name) || "Anonymous").charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                                        <span style={{ fontSize: '13px', fontWeight: '700', color: theme.text }}>
                                                            {fb.is_anonymous ? "Anonymous User" : (fb.user_name || "Anonymous User")}
                                                        </span>
                                                        {isDirect ? (
                                                            <span style={{ 
                                                                display: 'inline-flex', 
                                                                alignItems: 'center', 
                                                                gap: '2px',
                                                                padding: '2px 6px', 
                                                                borderRadius: '4px', 
                                                                fontSize: '9px', 
                                                                fontWeight: '800', 
                                                                background: 'rgba(16, 185, 129, 0.1)', 
                                                                color: '#10B981', 
                                                                textTransform: 'uppercase', 
                                                                letterSpacing: '0.05em' 
                                                            }}>
                                                                🎯 Product Review
                                                            </span>
                                                        ) : (
                                                            <span style={{ 
                                                                display: 'inline-flex', 
                                                                alignItems: 'center', 
                                                                gap: '2px',
                                                                padding: '2px 6px', 
                                                                borderRadius: '4px', 
                                                                fontSize: '9px', 
                                                                fontWeight: '800', 
                                                                background: 'rgba(59, 130, 246, 0.1)', 
                                                                color: '#3B82F6', 
                                                                textTransform: 'uppercase', 
                                                                letterSpacing: '0.05em' 
                                                            }}>
                                                                💬 Service Feedback
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div style={{ fontSize: '11px', color: theme.textMuted }}>
                                                        {new Date(fb.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                    </div>
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', gap: '2px', alignItems: 'center' }}>
                                                {Array.from({ length: 5 }).map((_, idx) => (
                                                    <span key={idx} style={{ color: idx < (fb.rating || 0) ? '#F59E0B' : '#E2E8F0', fontSize: '14px' }}>★</span>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Title & Description */}
                                        <div>
                                            {fb.title && (
                                                <div style={{ fontWeight: '800', fontSize: '14px', color: theme.text, marginBottom: '4px' }}>
                                                    {fb.title}
                                                </div>
                                            )}
                                            <div style={{ fontSize: '13px', color: theme.text, lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>
                                                {fb.description || "No comment left."}
                                            </div>
                                        </div>

                                        {/* Attachments & custom_data (e.g. photos) */}
                                        {fb.custom_data && (fb.custom_data.photo_upload || fb.custom_data.photo) && (
                                            <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', padding: '4px 0' }}>
                                                {(() => {
                                                    const pUpload = fb.custom_data.photo_upload || fb.custom_data.photo || [];
                                                    const arr = Array.isArray(pUpload) ? pUpload : [pUpload];
                                                    return arr.map((pic, pIdx) => {
                                                        const url = typeof pic === 'string' ? pic : (pic?.url || pic?.preview);
                                                        if (!url) return null;
                                                        return (
                                                            <img 
                                                                key={pIdx} 
                                                                src={resolveMediaUrl(url)} 
                                                                alt="attachment" 
                                                                style={{ height: '80px', borderRadius: '8px', border: `1px solid ${theme.border}`, objectFit: 'cover' }} 
                                                            />
                                                        );
                                                    });
                                                })()}
                                            </div>
                                        )}

                                        {/* Approval & Metrics */}
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', color: theme.textMuted, borderTop: `1px solid ${theme.border}`, paddingTop: '8px', marginTop: '4px' }}>
                                            <div>
                                                Status: <span style={{ fontWeight: '700', color: fb.is_approved ? '#10B981' : '#F59E0B' }}>{fb.is_approved ? 'APPROVED' : 'PENDING'}</span>
                                            </div>
                                            <div style={{ display: 'flex', gap: '12px' }}>
                                                <span>👍 {fb.likes_count || 0}</span>
                                                <span>👎 {fb.dislikes_count || 0}</span>
                                                <span>💬 {fb.replies_count || 0} replies</span>
                                            </div>
                                        </div>
                                    </div>
                                );

                                return (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                        {/* Section 1: Direct Product Reviews */}
                                        <div>
                                            <div style={{ fontWeight: '800', fontSize: '14px', color: theme.text, display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                                                <span>🎯 Product Reviews ({directFeedbacks.length})</span>
                                            </div>
                                            {directFeedbacks.length === 0 ? (
                                                <div style={{ padding: '20px 0', textAlign: 'center', color: theme.textMuted, fontSize: '12px', background: darkMode ? 'rgba(255,255,255,0.01)' : '#F8FAFC', borderRadius: '12px', border: `1px dashed ${theme.border}` }}>
                                                    No direct product reviews found yet.
                                                </div>
                                            ) : (
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                                    {directFeedbacks.map(fb => renderFeedbackCard(fb, true))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })()}
                        </div>

                        {/* Modal Footer */}
                        <div style={{ borderTop: `1px solid ${theme.border}`, paddingTop: '16px', marginTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
                            <button
                                onClick={() => { setIsFeedbackModalOpen(false); setSelectedProductForFeedback(null); }}
                                style={{ ...styles.btnPrimary, background: 'none', color: theme.textMuted, border: `1px solid ${theme.border}` }}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminProducts;
