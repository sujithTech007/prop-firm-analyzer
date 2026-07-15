from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import router as api_router

app = FastAPI(
    title="Prop Firm Challenge Readiness Analyzer API",
    description="Backend API for evaluating historical trade compliance and calculating readiness scoring."
)

# Enable CORS for all origins in development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include the API routes
app.include_router(api_router, prefix="/api")

@app.get("/")
def read_root():
    return {"message": "Prop Firm Challenge Readiness Analyzer API is active. Go to /docs for Swagger documentation."}
