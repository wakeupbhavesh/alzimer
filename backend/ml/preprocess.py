"""Feature preprocessing, imputation, and normalization pipeline."""
from pathlib import Path
from typing import Tuple, Dict, Any
import joblib
import numpy as np
import pandas as pd
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import StandardScaler
from ml.data_loader import FEATURE_COLUMNS

class NeuroGraphPreprocessor:
    """
    Leak-free preprocessor fitted strictly on training cohort.
    
    Imputation Strategy:
    - SES (Socioeconomic Status): Missing values imputed using training median.
    - MMSE (Mini-Mental State Exam): Missing values imputed using training median.
    
    Scaling Strategy:
    - StandardScaler fitted on training cohort features.
    """
    def __init__(self):
        self.feature_columns = FEATURE_COLUMNS
        self.imputer = SimpleImputer(strategy="median")
        self.scaler = StandardScaler()
        self.is_fitted = False
        self.feature_statistics: Dict[str, Any] = {}

    def fit(self, train_df: pd.DataFrame) -> "NeuroGraphPreprocessor":
        X = train_df[self.feature_columns].values
        
        # Fit imputer and scaler
        X_imputed = self.imputer.fit_transform(X)
        self.scaler.fit(X_imputed)
        
        # Record cohort statistics for user reference and distribution benchmarks
        for idx, col in enumerate(self.feature_columns):
            col_vals = train_df[col].dropna().values
            self.feature_statistics[col] = {
                "median": float(np.median(col_vals)),
                "mean": float(np.mean(col_vals)),
                "std": float(np.std(col_vals)),
                "min": float(np.min(col_vals)),
                "max": float(np.max(col_vals)),
                "impute_value": float(self.imputer.statistics_[idx])
            }
            
        self.is_fitted = True
        return self

    def transform(self, df: pd.DataFrame) -> np.ndarray:
        if not self.is_fitted:
            raise RuntimeError("Preprocessor must be fitted before transforming data.")
        X = df[self.feature_columns].values
        X_imputed = self.imputer.transform(X)
        X_scaled = self.scaler.transform(X_imputed)
        return X_scaled

    def transform_single(self, feature_dict: Dict[str, Any]) -> np.ndarray:
        """Transform a single incoming patient record dictionary."""
        row = []
        for col in self.feature_columns:
            val = feature_dict.get(col)
            # Normalize sex if passed as string
            if col == "M/F":
                if isinstance(val, str):
                    val = 1.0 if val.strip().upper().startswith("M") else 0.0
                elif val is None:
                    val = 0.5  # Neutral default if somehow missing
            row.append(val if val is not None else np.nan)
            
        df_single = pd.DataFrame([row], columns=self.feature_columns)
        return self.transform(df_single)

    def save(self, filepath: Path) -> None:
        filepath = Path(filepath)
        filepath.parent.mkdir(parents=True, exist_ok=True)
        joblib.dump(self, filepath)

    @classmethod
    def load(cls, filepath: Path) -> "NeuroGraphPreprocessor":
        return joblib.load(filepath)
