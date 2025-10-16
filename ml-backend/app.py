from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import joblib
import pandas as pd
import os

app = FastAPI(title="FinLearn ML Recommendations")

# CORS configuration for your frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load models at startup
try:
    model = joblib.load("model_1.pkl")
    encoders = joblib.load("encoders_2.pkl")
    mlb = joblib.load("labels_3.pkl")
    print("✓ Models loaded successfully")
except Exception as e:
    print(f"✗ Error loading models: {e}")
    model = None
    encoders = None
    mlb = None

class OnboardingInput(BaseModel):
    q1: str  # AgeGroup
    q2: str | list[str]  # Knowledge
    q3: str | list[str]  # Interest
    q4: str  # Confidence
    q5: str  # Goal

class RecommendationResponse(BaseModel):
    recommendedModules: list[str]

@app.get("/")
def read_root():
    return {
        "service": "FinLearn ML Recommendations",
        "status": "running",
        "models_loaded": model is not None
    }

@app.get("/health")
def health_check():
    return {
        "status": "healthy" if model is not None else "unhealthy",
        "models": {
            "model": model is not None,
            "encoders": encoders is not None,
            "mlb": mlb is not None
        }
    }

@app.post("/recommend", response_model=RecommendationResponse)
def recommend(data: OnboardingInput):
    if model is None or encoders is None or mlb is None:
        raise HTTPException(status_code=503, detail="Models not loaded")
    
    try:
        # Map onboarding answers to model features
        user_data = {
            "AgeGroup": data.q1,
            "Knowledge": data.q2 if isinstance(data.q2, str) else ", ".join(data.q2),
            "Interest": data.q3 if isinstance(data.q3, str) else ", ".join(data.q3),
            "Confidence": data.q4,
            "Goal": data.q5
        }
        
        # Create DataFrame
        df = pd.DataFrame([user_data])
        
        # Encode features
        for col in df.columns:
            if col in encoders:
                try:
                    df[col] = encoders[col].transform(df[col])
                except ValueError as e:
                    # Handle unknown categories with default encoding
                    print(f"Warning: Unknown category in {col}: {df[col][0]}")
                    df[col] = 0
        
        # Predict
        predictions = model.predict(df)
        
        # Decode module labels
        recommended_modules = mlb.classes_[predictions[0] == 1].tolist()
        
        # Fallback if no modules recommended
        if not recommended_modules:
            recommended_modules = [
                "Budgeting", "Saving", "EmergencyFund", "Banking",
                "Investing101", "PortfolioDiversification", "PersonalFinance",
                "Tax", "Insurance", "DebtManagement"
            ]
        
        return {"recommendedModules": recommended_modules}
    
    except Exception as e:
        print(f"Error during prediction: {e}")
        raise HTTPException(status_code=500, detail=f"Prediction error: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
