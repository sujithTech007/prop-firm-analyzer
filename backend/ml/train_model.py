import os
import json
import pickle
import numpy as np
import pandas as pd
from sklearn.model_selection import StratifiedKFold, train_test_split, GridSearchCV
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score, confusion_matrix
from sklearn.calibration import CalibratedClassifierCV
import shap
import warnings
warnings.filterwarnings("ignore")

def generate_synthetic_data(n_samples: int = 5000) -> pd.DataFrame:
    """
    Generates a realistic synthetic dataset representing historical trader stats.
    Expands to 15+ features correlated to 'passed' label.
    """
    np.random.seed(42)

    # Core Performance Features
    win_rate = np.random.uniform(20.0, 80.0, n_samples)
    reward_risk = np.random.uniform(0.3, 4.0, n_samples)
    profit_factor = (win_rate / 100) * reward_risk / np.maximum(1 - (win_rate / 100), 0.01)
    expectancy = (win_rate / 100.0) * reward_risk - ((100.0 - win_rate) / 100.0)
    
    # Risk & Drawdown Features
    max_drawdown_pct = np.random.uniform(0.5, 20.0, n_samples)
    avg_drawdown_pct = max_drawdown_pct * np.random.uniform(0.3, 0.8, n_samples)
    drawdown_duration_days = np.random.uniform(1, 30, n_samples)
    daily_loss_volatility = max_drawdown_pct * np.random.uniform(0.1, 0.5, n_samples)
    worst_day_pct = max_drawdown_pct * np.random.uniform(0.5, 1.0, n_samples)
    
    # Behavioral Features
    overtrading_ratio = np.random.uniform(0.0, 0.8, n_samples)
    revenge_ratio = np.random.uniform(0.0, 0.5, n_samples)
    consistency_score = np.random.uniform(0.1, 1.0, n_samples) # 1.0 is highly consistent
    
    # Contextual Features
    trade_frequency_trend = np.random.uniform(-1.0, 1.0, n_samples) # >0 increasing freq
    symbol_diversification = np.random.randint(1, 10, n_samples)
    longest_losing_streak = np.random.randint(1, 15, n_samples)
    longest_winning_streak = np.random.randint(1, 15, n_samples)

    data = pd.DataFrame({
        "win_rate": win_rate,
        "reward_risk": reward_risk,
        "profit_factor": profit_factor,
        "expectancy": expectancy,
        "max_drawdown_pct": max_drawdown_pct,
        "avg_drawdown_pct": avg_drawdown_pct,
        "drawdown_duration_days": drawdown_duration_days,
        "daily_loss_volatility": daily_loss_volatility,
        "worst_day_pct": worst_day_pct,
        "overtrading_ratio": overtrading_ratio,
        "revenge_ratio": revenge_ratio,
        "consistency_score": consistency_score,
        "trade_frequency_trend": trade_frequency_trend,
        "symbol_diversification": symbol_diversification,
        "longest_losing_streak": longest_losing_streak,
        "longest_winning_streak": longest_winning_streak
    })

    # Heuristics for passing label (correlating features with success)
    passed = []
    for idx, row in data.iterrows():
        score = 0.0
        
        # Performance
        if row["expectancy"] > 0.15: score += 1.0
        elif row["expectancy"] > 0: score += 0.5
        else: score -= 1.0
        
        if row["profit_factor"] > 1.5: score += 0.5
        elif row["profit_factor"] < 1.0: score -= 0.5
            
        # Drawdown penalties
        if row["max_drawdown_pct"] < 5.0: score += 1.0
        elif row["max_drawdown_pct"] > 10.0: score -= 1.5
        
        if row["worst_day_pct"] > 4.0: score -= 1.0
        
        # Behavioral penalties/bonuses
        score -= row["overtrading_ratio"] * 1.0
        score -= row["revenge_ratio"] * 1.5
        score += row["consistency_score"] * 1.0
        
        if row["longest_losing_streak"] > 8: score -= 0.5
        
        # Pass threshold
        is_pass = 1 if score > 0.5 else 0
        
        # Random noise (5%)
        if np.random.rand() < 0.05:
            is_pass = 1 - is_pass
            
        passed.append(is_pass)

    data["passed"] = passed
    return data

def train_and_evaluate():
    print("Generating synthetic trader dataset with 5000 samples and 16 features...")
    df = generate_synthetic_data(5000)
    
    pass_count = df["passed"].sum()
    print(f"Dataset generated: {len(df)} samples ({pass_count} passed, {len(df) - pass_count} failed)")

    feature_cols = [c for c in df.columns if c != "passed"]
    X = df[feature_cols]
    y = df["passed"]

    # Split for final evaluation
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)

    models = {
        "RandomForest": RandomForestClassifier(random_state=42),
        "GradientBoosting": GradientBoostingClassifier(random_state=42),
        "LogisticRegression": LogisticRegression(max_iter=1000, random_state=42)
    }

    skf = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    
    results = {}
    best_model_name = None
    best_f1 = -1

    print("\nEvaluating Models using 5-Fold Cross Validation:")
    for name, model in models.items():
        metrics = {"accuracy": [], "precision": [], "recall": [], "f1": [], "roc_auc": []}
        
        for train_idx, val_idx in skf.split(X_train, y_train):
            X_fold_train, X_fold_val = X_train.iloc[train_idx], X_train.iloc[val_idx]
            y_fold_train, y_fold_val = y_train.iloc[train_idx], y_train.iloc[val_idx]
            
            model.fit(X_fold_train, y_fold_train)
            y_pred = model.predict(X_fold_val)
            y_prob = model.predict_proba(X_fold_val)[:, 1] if hasattr(model, "predict_proba") else y_pred
            
            metrics["accuracy"].append(accuracy_score(y_fold_val, y_pred))
            metrics["precision"].append(precision_score(y_fold_val, y_pred, zero_division=0))
            metrics["recall"].append(recall_score(y_fold_val, y_pred, zero_division=0))
            metrics["f1"].append(f1_score(y_fold_val, y_pred, zero_division=0))
            metrics["roc_auc"].append(roc_auc_score(y_fold_val, y_prob))
            
        avg_metrics = {k: np.mean(v) for k, v in metrics.items()}
        results[name] = avg_metrics
        
        print(f"[{name}] F1: {avg_metrics['f1']:.4f} | Accuracy: {avg_metrics['accuracy']:.4f} | ROC-AUC: {avg_metrics['roc_auc']:.4f}")
        
        if avg_metrics['f1'] > best_f1:
            best_f1 = avg_metrics['f1']
            best_model_name = name

    print(f"\nBest model selected: {best_model_name}")

    # Hyperparameter tuning on best model
    print(f"\nTuning hyperparameters for {best_model_name}...")
    if best_model_name == "RandomForest":
        param_grid = {'n_estimators': [100, 200], 'max_depth': [6, 10, None]}
        best_base = RandomForestClassifier(random_state=42)
    elif best_model_name == "GradientBoosting":
        param_grid = {'n_estimators': [100, 200], 'learning_rate': [0.05, 0.1], 'max_depth': [3, 5]}
        best_base = GradientBoostingClassifier(random_state=42)
    else:
        param_grid = {'C': [0.1, 1.0, 10.0]}
        best_base = LogisticRegression(max_iter=1000, random_state=42)

    grid = GridSearchCV(best_base, param_grid, cv=3, scoring='f1', n_jobs=-1)
    grid.fit(X_train, y_train)
    
    best_tuned = grid.best_estimator_
    print(f"Best parameters: {grid.best_params_}")

    # Calibration for reliable probabilities
    print("\nCalibrating model...")
    calibrated_clf = CalibratedClassifierCV(best_tuned, cv=5, method='isotonic')
    calibrated_clf.fit(X_train, y_train)

    # Final Evaluation on Hold-out Test Set
    y_test_pred = calibrated_clf.predict(X_test)
    y_test_prob = calibrated_clf.predict_proba(X_test)[:, 1]
    
    test_metrics = {
        "accuracy": accuracy_score(y_test, y_test_pred),
        "precision": precision_score(y_test, y_test_pred),
        "recall": recall_score(y_test, y_test_pred),
        "f1": f1_score(y_test, y_test_pred),
        "roc_auc": roc_auc_score(y_test, y_test_prob)
    }
    
    print("\nFinal Test Set Metrics:")
    for k, v in test_metrics.items():
        print(f"{k.capitalize()}: {v:.4f}")

    cm = confusion_matrix(y_test, y_test_pred).tolist()

    # Explainability (Feature Importances & SHAP proxy for frontend)
    if hasattr(best_tuned, 'feature_importances_'):
        importances = best_tuned.feature_importances_
    else:
        # Logistic Regression fallback
        importances = np.abs(best_tuned.coef_[0])
        importances = importances / np.sum(importances)
        
    feat_importances = [{"feature": f, "importance": float(imp)} for f, imp in zip(feature_cols, importances)]
    feat_importances.sort(key=lambda x: x["importance"], reverse=True)

    # Save Model Report
    report = {
        "model_used": best_model_name,
        "best_params": grid.best_params_,
        "cross_val_results": results,
        "test_metrics": test_metrics,
        "confusion_matrix": cm,
        "feature_importances": feat_importances
    }
    
    model_dir = os.path.dirname(os.path.abspath(__file__))
    
    report_path = os.path.join(model_dir, "model_report.json")
    with open(report_path, "w") as f:
        json.dump(report, f, indent=4)
        
    model_path = os.path.join(model_dir, "readiness_model.pkl")
    with open(model_path, "wb") as f:
        # Save a dictionary with the calibrated model and feature columns
        pickle.dump({
            "model": calibrated_clf,
            "features": feature_cols
        }, f)
        
    print(f"\nSaved model report to {report_path}")
    print(f"Saved trained model to {model_path}")
    print("ML pipeline completed successfully.")

if __name__ == "__main__":
    train_and_evaluate()
