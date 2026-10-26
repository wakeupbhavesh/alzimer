"""OASIS-2 Dataset loading, validation, and leak-free subject splitting."""
import os
import urllib.request
from pathlib import Path
from typing import Tuple
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split

OASIS_PRIMARY_URL = "https://raw.githubusercontent.com/nikkithags/Detection-and-Analysis-of-Alzheimer-s-disease/master/oasis_longitudinal.csv"
OASIS_FALLBACK_URL = "https://raw.githubusercontent.com/deepak525/Dementia-Classification-Compare-Classifiers/master/oasis_longitudinal.csv"

# Model feature specification (CDR intentionally excluded to avoid label leakage)
FEATURE_COLUMNS = ["Age", "M/F", "EDUC", "SES", "MMSE", "eTIV", "nWBV", "ASF"]
TARGET_COLUMN = "Group"

def download_dataset_if_needed(target_path: Path) -> Path:
    """Ensure authentic OASIS-2 longitudinal dataset is available locally."""
    target_path = Path(target_path)
    if target_path.exists() and target_path.stat().st_size > 1000:
        return target_path
    
    target_path.parent.mkdir(parents=True, exist_ok=True)
    print(f"Downloading authentic OASIS-2 research dataset to {target_path}...")
    
    try:
        urllib.request.urlretrieve(OASIS_PRIMARY_URL, target_path)
    except Exception as e:
        print(f"Primary download mirror failed: {e}. Trying fallback mirror...")
        urllib.request.urlretrieve(OASIS_FALLBACK_URL, target_path)
        
    print(f"Dataset successfully downloaded ({target_path.stat().st_size} bytes).")
    return target_path

def load_oasis_dataset(data_path: Path) -> pd.DataFrame:
    """
    Load raw OASIS-2 data and apply initial structural validation.
    
    Returns clean DataFrame with standardized diagnosis labels.
    """
    data_path = download_dataset_if_needed(data_path)
    df = pd.read_csv(data_path)
    
    # Standardize column headers
    df.columns = [c.strip() for c in df.columns]
    
    # Verify required columns exist
    required_cols = ["Subject ID", "Group", "M/F", "Age", "EDUC", "SES", "MMSE", "eTIV", "nWBV", "ASF"]
    for col in required_cols:
        if col not in df.columns:
            raise ValueError(f"Required OASIS column missing from dataset: {col}")
            
    # Normalize M/F to numeric indicator (Male = 1, Female = 0)
    df["M/F"] = df["M/F"].apply(lambda x: 1.0 if str(x).strip().upper().startswith("M") else 0.0)
    
    # Cast numeric feature columns
    numeric_cols = ["Age", "EDUC", "SES", "MMSE", "eTIV", "nWBV", "ASF"]
    for col in numeric_cols:
        df[col] = pd.to_numeric(df[col], errors="coerce")
        
    # Standardize target categories: Nondemented (0) vs Demented (1)
    # Patients marked 'Converted' transitioned from Nondemented to Demented.
    # In binary evaluation, we map Converted to Demented or filter for clean separation.
    # Here we map: Nondemented -> 0, Demented -> 1, Converted -> 1 (Dementia phenotype)
    df["Target"] = df["Group"].apply(lambda g: 0 if str(g).strip().lower() == "nondemented" else 1)
    
    return df

def get_subject_stratified_split(
    df: pd.DataFrame,
    test_size: float = 0.15,
    val_size: float = 0.15,
    random_state: int = 42
) -> Tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame]:
    """
    Split dataset strictly at the Subject ID level to prevent data leakage.
    Scans from the same patient will NEVER appear in both training and test sets.
    """
    # Identify unique subjects and their primary diagnosis
    subject_targets = df.groupby("Subject ID")["Target"].max().reset_index()
    
    train_val_subjects, test_subjects = train_test_split(
        subject_targets,
        test_size=test_size,
        stratify=subject_targets["Target"],
        random_state=random_state
    )
    
    # Relative validation size from remaining train_val set
    val_ratio = val_size / (1.0 - test_size)
    train_subjects, val_subjects = train_test_split(
        train_val_subjects,
        test_size=val_ratio,
        stratify=train_val_subjects["Target"],
        random_state=random_state
    )
    
    train_ids = set(train_subjects["Subject ID"])
    val_ids = set(val_subjects["Subject ID"])
    test_ids = set(test_subjects["Subject ID"])
    
    # Verify zero subject overlap
    assert len(train_ids.intersection(val_ids)) == 0, "Data leakage detected: train-val overlap"
    assert len(train_ids.intersection(test_ids)) == 0, "Data leakage detected: train-test overlap"
    assert len(val_ids.intersection(test_ids)) == 0, "Data leakage detected: val-test overlap"
    
    train_df = df[df["Subject ID"].isin(train_ids)].copy().reset_index(drop=True)
    val_df = df[df["Subject ID"].isin(val_ids)].copy().reset_index(drop=True)
    test_df = df[df["Subject ID"].isin(test_ids)].copy().reset_index(drop=True)
    
    return train_df, val_df, test_df
