import sys
import os

path = 'c:/GlobalCore-Feedback/backend/app/crud.py'
with open(path, 'r') as f:
    content = f.read()

# 1. Add dislikes_count subquery definition 
# This handles both get_feedbacks and get_public_feed since they are identical
target_sq = """    likes_count_sq = (
        select(func.count(models.Reaction.id))
        .where((models.Reaction.feedback_id == models.Feedback.id) & (models.Reaction.is_like == True))
        .scalar_subquery()
        .label("likes_count")
    )"""

replacement_sq = """    likes_count_sq = (
        select(func.count(models.Reaction.id))
        .where((models.Reaction.feedback_id == models.Feedback.id) & (models.Reaction.is_like == True))
        .scalar_subquery()
        .label("likes_count")
    )
    dislikes_count_sq = (
        select(func.count(models.Reaction.id))
        .where((models.Reaction.feedback_id == models.Feedback.id) & (models.Reaction.is_like == False))
        .scalar_subquery()
        .label("dislikes_count")
    )"""

if target_sq in content:
    content = content.replace(target_sq, replacement_sq)
else:
    print("Warning: target_sq not found")

# 2. Add dislikes_count to the query result selections
# Two occurrences: line 120 and line 235
target_sel = "        likes_count_sq\n    )"
replacement_sel = "        likes_count_sq,\n        dislikes_count_sq\n    )"

if target_sel in content:
    content = content.replace(target_sel, replacement_sel)
else:
    print("Warning: target_sel not found")

with open(path, 'w') as f:
    f.write(content)

print(f"Update complete for {path}")
