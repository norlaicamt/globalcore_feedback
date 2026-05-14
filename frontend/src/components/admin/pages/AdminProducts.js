import React, { useEffect, useState, useCallback } from "react";
import {
    adminGetEntities, adminGetBranches,
    adminGetProducts, adminCreateProduct, adminUpdateProduct, adminDeleteProduct,
    adminDuplicateProduct, adminBulkImportProducts, adminGetProductAnalytics,
    adminGetProductEvaluationTemplates, adminCreateProductEvaluationTemplate,
    adminUpdateProductEvaluationTemplate, adminDeleteProductEvaluationTemplate
} from "../../../services/adminApi";
import CustomModal from "../../CustomModal";

const AdminProducts = ({ theme, darkMode, adminUser, isScoped }) => {
    const [products, setProducts] = useState([]);
    const [entities, setEntities] = useState([]);
    const [branches, setBranches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [filterEntity, setFilterEntity] = useState(adminUser?.entity_id || "");
    const [filterBranch, setFilterBranch] = useState("");
    
    // Modal states
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentProduct, setCurrentProduct] = useState(null);
    const [form, setForm] = useState({
        name: "",
        category: "",
        sku: "",
        price: "",
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
    
    // Template Management
    const [templates, setTemplates] = useState([]);
    const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
    const [isEditTemplateOpen, setIsEditTemplateOpen] = useState(false);
    const [currentTemplate, setCurrentTemplate] = useState(null);
    const [templateForm, setTemplateForm] = useState({ name: "", criteria: [] });

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const [prodData, entData, templData] = await Promise.all([
                adminGetProducts(filterEntity || null, filterBranch || null),
                adminGetEntities(),
                adminGetProductEvaluationTemplates()
            ]);
            setProducts(prodData);
            setEntities(entData);
            setTemplates(templData);
            
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
                sku: product.sku || "",
                price: product.price || "",
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
                sku: "",
                price: "",
                image_url: "",
                is_active: true,
                entity_id: adminUser?.entity_id || "",
                branch_id: "",
                evaluation_template_id: ""
            });
        }
        setIsModalOpen(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        if (!form.name || !form.entity_id) return;

        try {
            const payload = {
                ...form,
                price: form.price ? parseFloat(form.price) : null,
                branch_id: form.branch_id || null
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

    const handleBulkImport = async () => {
        if (!bulkData.trim()) return;
        try {
            const lines = bulkData.split("\n").filter(l => l.trim());
            const productsToImport = lines.map(line => {
                const parts = line.split(",");
                return {
                    name: parts[0]?.trim(),
                    category: parts[1]?.trim() || "",
                    sku: parts[2]?.trim() || "",
                    price: parts[3] ? parseFloat(parts[3]) : null,
                    entity_id: parseInt(filterEntity) || adminUser?.entity_id,
                    branch_id: filterBranch ? parseInt(filterBranch) : null,
                    is_active: true
                };
            }).filter(p => p.name);

            if (productsToImport.length === 0) return;
            await adminBulkImportProducts(productsToImport);
            setIsBulkModalOpen(false);
            setBulkData("");
            loadData();
        } catch (err) {
            setDialog({
                isOpen: true, type: "error", title: "Bulk Import Failed",
                message: "Please ensure your CSV data follows the format: Name,Category,SKU,Price",
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

    const handleSaveTemplate = async (e) => {
        e.preventDefault();
        if (!templateForm.name || templateForm.criteria.length === 0) return;
        try {
            if (currentTemplate) {
                await adminUpdateProductEvaluationTemplate(currentTemplate.id, templateForm);
            } else {
                await adminCreateProductEvaluationTemplate(templateForm);
            }
            const templData = await adminGetProductEvaluationTemplates();
            setTemplates(templData);
            setIsEditTemplateOpen(false);
        } catch (err) { console.error("Failed to save template:", err); }
    };

    const handleDeleteTemplate = async (id) => {
        if (!window.confirm("Are you sure? This template will be removed from all products.")) return;
        try {
            await adminDeleteProductEvaluationTemplate(id);
            setTemplates(templates.filter(t => t.id !== id));
        } catch (err) { console.error("Failed to delete template:", err); }
    };

    const handleAddCriteria = () => {
        setTemplateForm({
            ...templateForm,
            criteria: [...templateForm.criteria, { id: `c_${Date.now()}`, label: "" }]
        });
    };

    const handleRemoveCriteria = (id) => {
        setTemplateForm({
            ...templateForm,
            criteria: templateForm.criteria.filter(c => c.id !== id)
        });
    };

    const handleCriteriaChange = (id, val) => {
        setTemplateForm({
            ...templateForm,
            criteria: templateForm.criteria.map(c => c.id === id ? { ...c, label: val } : c)
        });
    };

    const openEditTemplate = (templ = null) => {
        if (templ) {
            setCurrentTemplate(templ);
            setTemplateForm({ name: templ.name, criteria: templ.criteria });
        } else {
            setCurrentTemplate(null);
            setTemplateForm({ name: "", criteria: [{ id: `c_${Date.now()}`, label: "" }] });
        }
        setIsEditTemplateOpen(true);
    };

    const filteredProducts = products.filter(p => 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.sku?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.category?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const styles = {
        container: { animation: 'fadeIn 0.3s ease-out' },
        header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' },
        title: { fontSize: '20px', fontWeight: '900', color: theme.text, margin: 0 },
        statsRow: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' },
        statCard: { background: theme.surface, padding: '20px', borderRadius: '16px', border: `1px solid ${theme.border}` },
        statVal: { fontSize: '24px', fontWeight: '900', color: 'var(--primary-color)', margin: '0 0 4px 0' },
        statLabel: { fontSize: '11px', fontWeight: '700', color: theme.textMuted, textTransform: 'uppercase' },
        controls: { display: 'flex', gap: '12px', marginBottom: '20px', alignItems: 'center' },
        searchBox: { flex: 1, position: 'relative' },
        input: { width: '100%', padding: '10px 16px', borderRadius: '10px', background: theme.surface, border: `1px solid ${theme.border}`, color: theme.text, fontSize: '14px', outline: 'none' },
        select: { padding: '10px 16px', borderRadius: '10px', background: theme.surface, border: `1px solid ${theme.border}`, color: theme.text, fontSize: '14px', outline: 'none', minWidth: '150px' },
        tableCard: { background: theme.surface, borderRadius: '16px', border: `1px solid ${theme.border}`, overflow: 'hidden' },
        table: { width: '100%', borderCollapse: 'collapse' },
        th: { padding: '14px 20px', textAlign: 'left', fontSize: '11px', fontWeight: '800', color: theme.textMuted, textTransform: 'uppercase', background: darkMode ? 'rgba(255,255,255,0.02)' : '#F8FAFC', borderBottom: `1px solid ${theme.border}` },
        td: { padding: '14px 20px', fontSize: '13px', color: theme.text, borderBottom: `1px solid ${theme.border}` },
        productThumb: { width: '36px', height: '36px', borderRadius: '8px', objectFit: 'cover', background: theme.bg },
        badge: (active) => ({ display: 'inline-block', padding: '3px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: '800', background: active ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', color: active ? '#10B981' : '#EF4444' }),
        btnPrimary: { padding: '10px 20px', background: 'var(--primary-color)', color: 'white', border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' },
        modal: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' },
        modalContent: { background: theme.surface, width: '100%', maxWidth: '600px', borderRadius: '24px', padding: '32px', boxShadow: '0 20px 50px rgba(0,0,0,0.3)', position: 'relative' },
        formGroup: { marginBottom: '20px' },
        formLabel: { display: 'block', fontSize: '12px', fontWeight: '800', color: theme.textMuted, marginBottom: '8px', textTransform: 'uppercase' }
    };

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <h2 style={styles.title}>Product Catalog</h2>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button onClick={() => setIsBulkModalOpen(true)} style={{ ...styles.btnPrimary, background: 'none', color: theme.text, border: `1px solid ${theme.border}` }}>
                        Bulk Import
                    </button>
                    <button onClick={() => setIsTemplateModalOpen(true)} style={{ ...styles.btnPrimary, background: 'none', color: '#6366F1', border: '1px solid #6366F1' }}>
                        Evaluation Templates
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
                <div style={styles.statCard}>
                    <p style={styles.statVal}>{products.filter(p => !p.image_url).length}</p>
                    <p style={styles.statLabel}>Missing Images</p>
                </div>
            </div>

            <div style={styles.controls}>
                <div style={styles.searchBox}>
                    <input 
                        style={styles.input} 
                        placeholder="Search by name, SKU or category..." 
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
                        {entities.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
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
            </div>

            <div style={styles.tableCard}>
                <table style={styles.table}>
                    <thead>
                        <tr>
                            <th style={styles.th}>Product</th>
                            <th style={styles.th}>Category</th>
                            <th style={styles.th}>SKU</th>
                            <th style={styles.th}>Price</th>
                            <th style={styles.th}>Scope</th>
                            <th style={styles.th}>Status</th>
                            <th style={styles.th}></th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="6" style={{ padding: '40px', textAlign: 'center', color: theme.textMuted }}>Loading products...</td></tr>
                        ) : filteredProducts.length === 0 ? (
                            <tr><td colSpan="6" style={{ padding: '40px', textAlign: 'center', color: theme.textMuted }}>No products found.</td></tr>
                        ) : filteredProducts.map(p => (
                            <tr key={p.id}>
                                <td style={styles.td}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        {p.image_url ? (
                                            <img src={p.image_url} alt="" style={styles.productThumb} />
                                        ) : (
                                            <div style={{ ...styles.productThumb, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(var(--primary-rgb), 0.1)', color: 'var(--primary-color)' }}>
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>
                                            </div>
                                        )}
                                        <span style={{ fontWeight: '700' }}>{p.name}</span>
                                    </div>
                                </td>
                                <td style={styles.td}>{p.category || "—"}</td>
                                <td style={styles.td}>{p.sku || "—"}</td>
                                <td style={styles.td}>{p.price ? `₱${p.price.toLocaleString()}` : "—"}</td>
                                <td style={styles.td}>
                                    <div style={{ fontSize: '11px', fontWeight: '700' }}>
                                        {entities.find(e => e.id === p.entity_id)?.name || "Global"}
                                    </div>
                                    <div style={{ fontSize: '10px', color: theme.textMuted }}>
                                        {p.branch_id ? (branches.find(b => b.id === p.branch_id)?.name || "Specific Branch") : "All Branches"}
                                    </div>
                                </td>
                                <td style={styles.td}>
                                    <span style={styles.badge(p.is_active)}>{p.is_active ? "ACTIVE" : "INACTIVE"}</span>
                                </td>
                                <td style={{ ...styles.td, textAlign: 'right' }}>
                                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                        <button onClick={() => handleOpenAnalytics(p)} title="Analytics" style={{ background: 'none', border: 'none', color: '#6366F1', cursor: 'pointer' }}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20V10M18 20V4M6 20v-4" /></svg></button>
                                        <button onClick={() => handleDuplicate(p)} title="Duplicate" style={{ background: 'none', border: 'none', color: theme.textMuted, cursor: 'pointer' }}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" /></svg></button>
                                        <button onClick={() => handleOpenModal(p)} style={{ background: 'none', border: 'none', color: 'var(--primary-color)', cursor: 'pointer', fontWeight: '700' }}>Edit</button>
                                        <button onClick={() => handleDelete(p)} style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', fontWeight: '700' }}>Deactivate</button>
                                    </div>
                                </td>
                            </tr>
                        ))}
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
                                    <input style={styles.input} value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
                                </div>
                                <div style={styles.formGroup}>
                                    <label style={styles.formLabel}>Category</label>
                                    <input style={styles.input} value={form.category} onChange={e => setForm({...form, category: e.target.value})} placeholder="e.g. Beverages" />
                                </div>
                                <div style={styles.formGroup}>
                                    <label style={styles.formLabel}>SKU / Code</label>
                                    <input style={styles.input} value={form.sku} onChange={e => setForm({...form, sku: e.target.value})} />
                                </div>
                                <div style={styles.formGroup}>
                                    <label style={styles.formLabel}>Price</label>
                                    <input type="number" step="0.01" style={styles.input} value={form.price} onChange={e => setForm({...form, price: e.target.value})} />
                                </div>
                                {!isScoped && (
                                    <div style={styles.formGroup}>
                                        <label style={styles.formLabel}>Workspace</label>
                                        <select style={styles.input} value={form.entity_id} onChange={e => setForm({...form, entity_id: e.target.value, branch_id: ""})} required>
                                            <option value="">Select Workspace</option>
                                            {entities.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                                        </select>
                                    </div>
                                )}
                                <div style={styles.formGroup}>
                                    <label style={styles.formLabel}>Location (Optional)</label>
                                    <select style={styles.input} value={form.branch_id} onChange={e => setForm({...form, branch_id: e.target.value})}>
                                        <option value="">All Locations</option>
                                        {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                                    </select>
                                </div>
                                <div style={styles.formGroup}>
                                    <label style={styles.formLabel}>Evaluation Template</label>
                                    <select style={styles.input} value={form.evaluation_template_id} onChange={e => setForm({...form, evaluation_template_id: e.target.value})}>
                                        <option value="">Standard (Stars Only)</option>
                                        {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div style={styles.formGroup}>
                                <label style={styles.formLabel}>Image URL</label>
                                <input style={styles.input} value={form.image_url} onChange={e => setForm({...form, image_url: e.target.value})} placeholder="https://..." />
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
                        <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: '900', color: theme.text }}>Bulk Import Products</h3>
                        <p style={{ fontSize: '12px', color: theme.textMuted, marginBottom: '20px' }}>Paste CSV data below (Name,Category,SKU,Price). One product per line.</p>
                        <textarea 
                            style={{ ...styles.input, height: '200px', fontFamily: 'monospace', fontSize: '12px', padding: '12px' }}
                            placeholder="Mango Smoothie,Drinks,MS-001,150&#10;Spa Oil,Wellness,SO-002,450"
                            value={bulkData}
                            onChange={e => setBulkData(e.target.value)}
                        />
                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
                            <button onClick={() => setIsBulkModalOpen(false)} style={{ ...styles.btnPrimary, background: 'none', color: theme.textMuted, border: `1px solid ${theme.border}` }}>Cancel</button>
                            <button onClick={handleBulkImport} style={styles.btnPrimary}>Import Products</button>
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
        </div>
    );
};

export default AdminProducts;
