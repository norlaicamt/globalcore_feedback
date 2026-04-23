import sys
import os
sys.path.append(os.path.join(os.getcwd(), "backend"))

from app.database import SessionLocal
from app import models
import json

def seed():
    db = SessionLocal()
    try:
        # 1. Complaint Intake Template
        complaint_config = {
            "version": 1,
            "steps": [
                {
                    "id": "step_routing",
                    "label": "Service Selection",
                    "enabled": True,
                    "items": [{"type": "module", "key": "entity_picker", "label_override": "Select Program", "required": True}]
                },
                {
                    "id": "step_details",
                    "label": "Incident Details",
                    "enabled": True,
                    "items": [
                        {"type": "module", "key": "long_text", "label_override": "Describe the incident", "required": True},
                        {"type": "module", "key": "location_picker", "label_override": "Location/Branch", "required": True},
                        {"type": "module", "key": "photo_upload", "label_override": "Attach Evidence", "required": False}
                    ]
                }
            ],
            "terminology": {"entity_label": "Program", "location_label": "Office"}
        }

        # 2. Service Evaluation (TER-Style)
        eval_config = {
            "version": 1,
            "steps": [
                {
                    "id": "step_routing",
                    "label": "Service Selection",
                    "enabled": True,
                    "items": [{"type": "module", "key": "entity_picker", "label_override": "Select Service", "required": True}]
                },
                {
                    "id": "step_eval",
                    "label": "Evaluation Matrix",
                    "enabled": True,
                    "items": [
                        {
                            "type": "module", 
                            "key": "rating_matrix", 
                            "label_override": "Service Standards", 
                            "required": True,
                            "criteria": ["Staff Courtesy", "Waiting Time", "Facility Cleanliness", "Professionalism"]
                        },
                        {"type": "module", "key": "long_text", "label_override": "Additional Comments", "required": False}
                    ]
                },
                {
                    "id": "details", # Mandatory Details step
                    "label": "Submission",
                    "enabled": True,
                    "items": [{"type": "module", "key": "short_text", "label_override": "Full Name (Optional)", "required": False}]
                }
            ],
            "terminology": {"entity_label": "Service", "location_label": "Branch"}
        }

        templates = [
            models.WorkflowTemplate(
                name="Standard Complaint Intake",
                description="A structured flow for capturing detailed complaints with evidence attachments.",
                category="Complaint Intake",
                config=complaint_config,
                is_global=True
            ),
            models.WorkflowTemplate(
                name="High-Fidelity Service Evaluation",
                description="Professional evaluation grid using a matrix-style rating system.",
                category="Service Evaluation",
                config=eval_config,
                is_global=True
            )
        ]

        for t in templates:
            existing = db.query(models.WorkflowTemplate).filter(models.WorkflowTemplate.name == t.name).first()
            if not existing:
                db.add(t)
        
        db.commit()
        print("Workflow templates seeded successfully.")
    finally:
        db.close()

if __name__ == "__main__":
    seed()
