"""Unit tests for data loading, leakage prevention, and preprocessing."""
import numpy as np
import pandas as pd
import pytest
from ml.data_loader import get_subject_stratified_split, FEATURE_COLUMNS
from ml.preprocess import NeuroGraphPreprocessor

def create_mock_oasis_df(num_subjects=20, visits_per_subject=2):
    records = []
    for s_idx in range(num_subjects):
        subj_id = f"OAS2_{s_idx:04d}"
        target = 1 if s_idx % 2 == 0 else 0
        group = "Demented" if target == 1 else "Nondemented"
        for v in range(1, visits_per_subject + 1):
            records.append({
                "Subject ID": subj_id,
                "MRI ID": f"{subj_id}_MR{v}",
                "Group": group,
                "Target": target,
                "Visit": v,
                "M/F": 1.0 if s_idx % 3 == 0 else 0.0,
                "Age": 70.0 + s_idx + v,
                "EDUC": 14.0,
                "SES": 2.0 if s_idx != 1 else np.nan,  # simulate missing
                "MMSE": 28.0 - (target * 4),
                "eTIV": 1500.0,
                "nWBV": 0.73 - (target * 0.04),
                "ASF": 1.15
            })
    return pd.DataFrame(records)

def test_subject_stratified_split_zero_leakage():
    df = create_mock_oasis_df(num_subjects=30, visits_per_subject=2)
    train_df, val_df, test_df = get_subject_stratified_split(df, test_size=0.2, val_size=0.2, random_state=42)
    
    train_subjects = set(train_df["Subject ID"])
    val_subjects = set(val_df["Subject ID"])
    test_subjects = set(test_df["Subject ID"])
    
    # Must be mutually disjoint
    assert len(train_subjects.intersection(val_subjects)) == 0
    assert len(train_subjects.intersection(test_subjects)) == 0
    assert len(val_subjects.intersection(test_subjects)) == 0
    
    # All rows must belong to their assigned subject partition
    assert len(train_df) + len(val_df) + len(test_df) == len(df)

def test_preprocessor_imputation_and_scaling():
    df = create_mock_oasis_df(num_subjects=20, visits_per_subject=1)
    preprocessor = NeuroGraphPreprocessor()
    preprocessor.fit(df)
    
    assert preprocessor.is_fitted
    assert "SES" in preprocessor.feature_statistics
    
    # Transform test sample with missing SES
    sample_with_nan = {
        "Age": 75.0,
        "M/F": "M",
        "EDUC": 16.0,
        "SES": None,  # Should be imputed
        "MMSE": 26.0,
        "eTIV": 1600.0,
        "nWBV": 0.71,
        "ASF": 1.10
    }
    transformed = preprocessor.transform_single(sample_with_nan)
    assert transformed.shape == (1, 8)
    assert not np.isnan(transformed).any(), "Imputation failed to eliminate NaNs"
