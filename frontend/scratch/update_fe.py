import os

file_path = r'c:\GlobalCore-Feedback\frontend\src\components\GeneralFeedback.js'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update Summary Box
summary_old = """                <p style={{ margin: 0, fontSize: '12px', color: '#64748B' }}>
                    {isManualLocation ? `📍 Manual: ${manualLocationText}` : `@ ${selectedBranch?.name}`}
                </p>"""
summary_new = """                <p style={{ margin: 0, fontSize: '12px', color: '#64748B' }}>
                    {isManualLocation ? `📍 Manual: ${manualLocationText}` : `@ ${selectedBranch?.name}`}
                </p>
                {selectedMentions.length > 0 && (
                    <p style={{ margin: '5px 0 0 0', fontSize: '11px', color: '#3B82F6', fontWeight: '700' }}>
                        👤 MENTIONED: {selectedMentions.map(m => m.name).join(", ")}
                    </p>
                )}"""

if summary_old in content:
    content = content.replace(summary_old, summary_new)
else:
    print("Summary box not found exactly, trying relaxed match")
    # Relaxed match just in case
    import re
    content = re.sub(r'\{isManualLocation \? `📍 Manual: \$\{manualLocationText\}` : `@ \$\{selectedBranch\?\.name\}`\}', 
                     r'{isManualLocation ? `📍 Manual: ${manualLocationText}` : `@ ${selectedBranch?.name}`}\n                </p>\n                {selectedMentions.length > 0 && (\n                    <p style={{ margin: "5px 0 0 0", fontSize: "11px", color: "#3B82F6", fontWeight: "700" }}>\n                        👤 MENTIONED: {selectedMentions.map(m => m.name).join(", ")}\n                    </p>\n                )}', content)

# 2. Add Tagging UI
target_ui_old = """             <div style={styles.formGroup}>
                 <label style={styles.label}>Your Message</label>"""
target_ui_new = """             <div style={styles.formGroup}>
                 <label style={styles.label}>Mention Staff / Employees (Optional - Max 5)</label>
                 <div style={{ position: 'relative' }}>
                    <div style={styles.mentionInputContainer}>
                        {selectedMentions.map(user => (
                            <span key={user.id} style={styles.mentionPill}>
                                {user.name}
                                <button onClick={() => setSelectedMentions(prev => prev.filter(u => u.id !== user.id))} style={styles.removeTag}>✕</button>
                            </span>
                        ))}
                        {selectedMentions.length < 5 && (
                            <input 
                                placeholder={selectedMentions.length === 0 ? "Type staff name to tag..." : "Add another..."}
                                style={styles.mentionInput}
                                value={mentionSearch}
                                onChange={e => setMentionSearch(e.target.value)}
                            />
                        )}
                    </div>
                    
                    {mentionSuggestions.length > 0 && (
                        <div style={styles.suggestionsDropdown}>
                            {mentionSuggestions.map(user => (
                                <button 
                                    key={user.id} 
                                    onClick={() => {
                                        setSelectedMentions(prev => [...prev, user]);
                                        setMentionSearch("");
                                        setMentionSuggestions([]);
                                    }}
                                    style={styles.suggestionRow}
                                >
                                    <div style={styles.suggestionAvatar}>
                                        {user.avatar_url ? <img src={user.avatar_url} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%' }} /> : user.name[0]}
                                    </div>
                                    <div style={{ textAlign: 'left' }}>
                                        <div style={{ fontWeight: '700', fontSize: '13px' }}>{user.name}</div>
                                        <div style={{ fontSize: '11px', color: '#64748B' }}>{user.role_identity || user.department}</div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                 </div>
              </div>

              <div style={styles.formGroup}>
                 <label style={styles.label}>Your Message</label>"""

if target_ui_old in content:
    content = content.replace(target_ui_old, target_ui_new)
else:
    print("Tagging UI target not found exactly")

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print("File updated successfully")
