from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine
import models
from routers import users, departments, categories, feedback, analytics

# Create database tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Global Core - Feedback Module")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(users.router)
app.include_router(departments.router)
app.include_router(categories.router)
app.include_router(feedback.router)
app.include_router(analytics.router)

@app.get("/")
def root():
    return {"message": "Feedback System API Running"}