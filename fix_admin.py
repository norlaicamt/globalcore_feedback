path = 'backend/app/routers/admin.py'

with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# The broken section - after db.delete(field) and db.commit() there is leftover garbage code
# that was accidentally inserted. We need to remove lines:
#    performed_by_id=admin['id'],
#    target_id=str(user_id),
#    details={'user_email': user.email, **changes}
#    )
#    db.commit()
#    return {'id': user_id, 'role': user.role, 'department': user.department}

bad_block = (
    "    db.delete(field)\n"
    "    db.commit()\n"
    "       performed_by_id=admin['id'],\n"
    "        target_id=str(user_id),\n"
    "        details={'user_email': user.email, **changes}\n"
    "    )\n"
    "    \n"
    "    db.commit()\n"
    "    return {'id': user_id, 'role': user.role, 'department': user.department}"
)

good_block = (
    "    db.delete(field)\n"
    "    db.commit()\n"
    "    return {\"message\": \"Field deleted\"}"
)

if bad_block in content:
    content = content.replace(bad_block, good_block)
    print("Fixed: removed orphaned lines from delete_form_field")
else:
    print("Pattern not found - searching for performed_by_id line...")
    # Try to find the line manually
    lines = content.split('\n')
    for i, line in enumerate(lines):
        if "performed_by_id=admin['id']" in line or "performed_by_id=admin[\"id\"]" in line:
            print(f"  Found at line {i+1}: {repr(line)}")

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Done.")
