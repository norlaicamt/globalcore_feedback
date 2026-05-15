import React, { useEffect, useState, useCallback } from "react";
import * as XLSX from 'xlsx';
import {
    adminGetEntities, adminGetBranches,
    adminGetProducts, adminCreateProduct, adminUpdateProduct, adminDeleteProduct,
    adminDuplicateProduct, adminBulkImportProducts, adminGetProductAnalytics,
    adminGetProductEvaluationTemplates
} from "../../../services/adminApi";
import CustomModal from "../../CustomModal";

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
    
    // Template Management
    const [templates, setTemplates] = useState([]);

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const [prodData, entData, templData] = await Promise.all([
                adminGetProducts(filterEntity || null, filterBranch || null),
                adminGetEntities(),
                adminGetProductEvaluationTemplates()
            ]);
            setProducts(prodData);
            // Only keep Service-type entities so products can't be assigned to non-service workspaces
            setEntities(entData.filter(e => SERVICE_TYPES.includes(e.fields?.operational?.workspace_type)));
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
                    const sku = row[2]?.toString().trim() || null;
                    const price = row[3] ? parseFloat(row[3]) : null;

                    return {
                        name,
                        category,
                        sku,
                        price: isNaN(price) ? null : price,
                        entity_id: parseInt(filterEntity) || adminUser?.entity_id,
                        branch_id: filterBranch ? parseInt(filterBranch) : null,
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
                    message: "Failed to parse Excel file. Ensure columns are: Name, Category, SKU, Price.",
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
                
                // Name and Category are the priority
                const name = parts[0]?.trim();
                const category = parts[1]?.trim() || "Uncategorized";
                
                // SKU and Price are optional (fallback to empty if not provided or requested to be removed)
                const sku = parts[2]?.trim() || null;
                const priceStr = parts[3]?.trim();
                const price = priceStr ? parseFloat(priceStr.replace(/[^0-9.]/g, '')) : null;

                return {
                    name,
                    category,
                    sku: sku,
                    price: isNaN(price) ? null : price,
                    entity_id: parseInt(filterEntity) || adminUser?.entity_id,
                    branch_id: filterBranch ? parseInt(filterBranch) : null,
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
                isOpen: true, type: "error", title: "Bulk Import Failed",
                message: "Please ensure your data follows the format: Name, Category. You can also paste directly from Excel.",
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

    const filteredProducts = products.filter(p => 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
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

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <h2 style={styles.title}>Product Catalog</h2>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button onClick={() => setIsBulkModalOpen(true)} style={{ ...styles.btnPrimary, background: 'none', color: theme.text, border: `1px solid ${theme.border}` }}>
                        Bulk Import
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
                        <option value="">All Services</option>
                        {entities.map(e => {
                            const wsType = e.fields?.operational?.workspace_type || 'Service';
                            const suffix = e.name.toLowerCase() !== wsType.toLowerCase() ? ` (${wsType})` : '';
                            return (
                                <option key={e.id} value={e.id}>
                                    {e.name}{suffix}
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
            </div>

            <div style={styles.tableCard}>
                <table style={styles.table}>
                    <thead>
                        <tr>
                            <th style={styles.th}>Product</th>
                            <th style={styles.th}>Product Type</th>
                            <th style={styles.th}>Activity Status</th>
                            <th style={styles.th}>Scope</th>
                            <th style={styles.th}></th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="5" style={{ padding: '40px', textAlign: 'center', color: theme.textMuted }}>Loading products...</td></tr>
                        ) : filteredProducts.length === 0 ? (
                            <tr><td colSpan="5" style={{ padding: '40px', textAlign: 'center', color: theme.textMuted }}>No products found.</td></tr>
                        ) : filteredProducts.map(p => {
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
                                            <div>
                                                <div style={{ fontWeight: '700' }}>{p.name}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td style={styles.td}>
                                        <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: '20px', fontSize: '10px', fontWeight: '800', background: 'rgba(99,102,241,0.1)', color: '#6366F1', textTransform: 'uppercase' }}>
                                            {p.category || '—'}
                                        </span>
                                    </td>
                                    <td style={styles.td}>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                            <span style={styles.badge(status)}>{status}</span>
                                            {p.feedback_count > 0 && (
                                                <span style={{ fontSize: '10px', color: theme.textMuted, fontWeight: '600' }}>
                                                    {p.feedback_count} feedback entries
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td style={styles.td}>
                                        <div style={{ fontSize: '11px', fontWeight: '700' }}>
                                            {entities.find(e => e.id === p.entity_id)?.name || "Global"}
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                                            {(() => { const ws = entities.find(e => e.id === p.entity_id)?.fields?.operational?.workspace_type; return ws ? <span style={{ fontSize: '9px', fontWeight: '900', background: 'rgba(16,185,129,0.1)', color: '#10B981', padding: '1px 6px', borderRadius: '4px', textTransform: 'uppercase' }}>{ws}</span> : null; })()}
                                            <span style={{ fontSize: '10px', color: theme.textMuted }}>
                                                {p.branch_id ? (branches.find(b => b.id === p.branch_id)?.name || 'Specific Branch') : 'All Branches'}
                                            </span>
                                        </div>
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
                                    <input style={styles.input} value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
                                </div>
                                <div style={styles.formGroup}>
                                    <label style={styles.formLabel}>Product Type</label>
                                    <select style={styles.input} value={form.category} onChange={e => setForm({...form, category: e.target.value})} required>
                                        <option value="">Select a Product Type…</option>
                                        {PRODUCT_TYPES.map(pt => <option key={pt} value={pt}>{pt}</option>)}
                                    </select>
                                </div>

                                {!isScoped && (
                                    <div style={styles.formGroup}>
                                        <label style={styles.formLabel}>Sold Under</label>
                                        <select style={styles.input} value={form.entity_id} onChange={e => setForm({...form, entity_id: e.target.value, branch_id: ""})} required>
                                            <option value="">Select a Service…</option>
                                            {entities.map(e => {
                                                const wsType = e.fields?.operational?.workspace_type || 'Service';
                                                const suffix = e.name.toLowerCase() !== wsType.toLowerCase() ? ` — ${wsType}` : '';
                                                return (
                                                    <option key={e.id} value={e.id}>
                                                        {e.name}{suffix}
                                                    </option>
                                                );
                                            })}
                                        </select>
                                        <p style={{ margin: '6px 0 0', fontSize: '11px', color: theme.textMuted }}>
                                            e.g. Sold Under: Restaurant · Spa · Gift Shop
                                        </p>
                                    </div>
                                )}
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
                                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--primary-color)" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg>
                                <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--primary-color)' }}>Click to upload Excel / CSV</span>
                                <span style={{ fontSize: '10px', color: theme.textMuted }}>Columns: Name, Product Type (Drinks / Cosmetics / Food / Souvenirs / Merchandise / Hotel Items)</span>
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
        </div>
    );
};

export default AdminProducts;
