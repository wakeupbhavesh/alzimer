# NeuroGraph AI: Alzheimer's Disease Prediction Using Graph Neural Networks

An academic research platform and clinical AI prototype designed for Alzheimer's disease prediction using **Patient-Similarity Graph Neural Networks (GNN)** implemented with **PyTorch Geometric**, a **FastAPI** backend, and an interactive **React + TypeScript + Cytoscape.js** healthcare dashboard.

---

## 1. Scientific Background & GNN Methodology

Traditional medical classifiers treat patients as independent and identically distributed (I.I.D.) tabular samples. However, neurodegenerative pathology operates across continuous clinical spectrums where individuals sharing phenotypic similarities exhibit comparable disease progressions.

### Patient-Similarity Graph (PSG) Formulation
- **Nodes ($V$)**: Individual patient clinical records.
- **Node Features ($X \in \mathbb{R}^8$)**: Standardized clinical and neuroimaging variables:
  - Demographics: Age, Biological Sex ($M/F$), Formal Education ($EDUC$), Socioeconomic Status ($SES$)
  - Cognitive Testing: Mini-Mental State Examination ($MMSE$)
  - Neuroimaging Volumetric Biomarkers: Estimated Total Intracranial Volume ($eTIV$), Normalized Whole Brain Volume ($nWBV$), Atlas Scaling Factor ($ASF$)
- **Edges ($E$)**: Constructed via $k$-Nearest Neighbors ($k=5$) with Gaussian RBF similarity weights:
  $$W_{ij} = \exp\left(-\gamma \|x_i - x_j\|_2^2\right) \quad \text{for } j \in \mathcal{N}_k(i)$$
- **Graph Attention Network (GAT)**:
  - 2-layer Graph Attention architecture using `GATConv` with 4 multi-head attention heads, Batch Normalization, and ELU non-linearity.
  - Dynamically weights neighbor contributions according to learned clinical importance.
- **Inductive Out-of-Sample Inference**:
  - Unseen incoming patients are embedded dynamically by computing similarity to reference cohort nodes and performing neighborhood message passing across the resulting local subgraph.

---

## 2. Dataset & Data-Leakage Prevention Protocol

The system is evaluated on the authentic **OASIS-2: Longitudinal MRI Data in Nondemented and Demented Older Adults** (Washington University in St. Louis; Marcus et al., 2010):
- **Cohort**: 373 MRI scan sessions across 150 unique subjects aged 60 to 96.
- **Target Variable**: Clinical Dementia diagnosis (`Group`: `Nondemented` vs. `Demented`).
- **Subject-Level Stratified Splitting**:
  - Patients are partitioned at the **Subject ID** level into 70% Train (252 scans), 15% Validation (63 scans), and 15% Held-Out Test (58 scans).
  - Guarantees **zero patient overlap** across splits.
- **Leakage Prevention**:
  - Clinical Dementia Rating ($CDR$) is strictly **withheld** from input features because $CDR \ge 0.5$ defines clinical dementia; including it would create trivial label leakage.
  - Feature scaling (`StandardScaler`) and missingness imputation (`SimpleImputer` using median) are fitted strictly on the training set only.

---

## 3. Empirical Model Evaluation (Held-Out Test Set)

The model was trained and evaluated on 58 unseen test scans from independent subjects:

| Metric | Score | Evaluation Setting |
| :--- | :--- | :--- |
| **Accuracy** | **79.31%** | Held-Out Test Cohort ($N=58$) |
| **Macro F1-Score** | **79.21%** | Harmonic mean across classes |
| **Sensitivity (Recall)** | **79.64%** | True positive detection rate |
| **Precision (Macro)** | **79.31%** | Balanced precision |
| **ROC-AUC** | **0.8964** | Area under the ROC curve |

*All metrics are verified from genuine held-out evaluation and saved to `backend/models/evaluation_results.json`.*

---

## 4. Technology Stack

- **Frontend**: React 18, TypeScript, Vite 6, Tailwind CSS, Recharts, Cytoscape.js, Lucide Icons.
- **Backend**: Python 3.11+, FastAPI, Uvicorn, Pydantic v2, SQLAlchemy, SQLite.
- **Machine Learning**: PyTorch, PyTorch Geometric (`torch_geometric`), Scikit-learn, Pandas, NumPy, Joblib.

---

## 5. Project Structure

```
neurograph-ai/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI application initialization & CORS
│   │   ├── config.py            # Environment configuration & paths
│   │   ├── database.py          # SQLite engine & session maker
│   │   ├── models.py            # SQLAlchemy database models
│   │   ├── schemas.py           # Pydantic input/output schemas
│   │   └── routes/
│   │       └── api.py           # API endpoints (/health, /predict, /evaluation, /assessments)
│   ├── ml/
│   │   ├── data_loader.py       # OASIS dataset downloader & subject-stratified splitter
│   │   ├── preprocess.py        # Leak-free imputer & scaler pipeline
│   │   ├── graph_builder.py     # Patient-similarity graph & inductive query builder
│   │   ├── model.py             # PyTorch Geometric Graph Attention Network (GAT)
│   │   ├── train.py             # Reproducible training pipeline with checkpoint saving
│   │   ├── evaluate.py          # Held-out test evaluation & confusion matrix calculator
│   │   └── predict.py           # Inductive inference engine
│   ├── data/
│   │   └── oasis_longitudinal.csv # Real OASIS-2 research dataset
│   ├── models/
│   │   ├── gnn_model.pt         # Trained GNN weights
│   │   ├── preprocessor.joblib  # Fitted feature preprocessor
│   │   ├── reference_graph.pt   # Reference prototypes for inductive inference
│   │   ├── evaluation_results.json # Verified test metrics
│   │   └── metadata.json        # Hyperparameters and training history
│   ├── tests/
│   │   ├── test_data_preprocess.py
│   │   ├── test_graph_builder.py
│   │   ├── test_model.py
│   │   └── test_api.py
│   ├── requirements.txt
│   └── run_backend.py
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.tsx           # Header with live system badges
│   │   │   ├── Sidebar.tsx          # Navigation sidebar across 9 pages
│   │   │   ├── MetricCard.tsx       # KPI & metric cards
│   │   │   ├── GraphViewer.tsx      # Cytoscape.js interactive graph component
│   │   │   ├── ConfusionMatrix.tsx  # Interactive test confusion matrix
│   │   │   └── DisclaimerBanner.tsx # Prominent research disclaimer
│   │   ├── pages/
│   │   │   ├── LandingPage.tsx          # 1. Project overview & GNN methodology
│   │   │   ├── DashboardPage.tsx        # 2. Live research dashboard
│   │   │   ├── AssessmentFormPage.tsx   # 3. Validated patient intake form
│   │   │   ├── PredictionResultPage.tsx # 4. GNN predictions & neighbor subgraph
│   │   │   ├── GraphExplorerPage.tsx    # 5. Full Cytoscape.js graph explorer
│   │   │   ├── AssessmentHistoryPage.tsx# 6. Persistent assessment history
│   │   │   ├── ModelEvaluationPage.tsx  # 7. Deep-dive ROC-AUC & loss curves
│   │   │   ├── AboutProjectPage.tsx     # 8. Mathematical formulation & references
│   │   │   └── PrivacyLimitationsPage.tsx# 9. Zero-PII & ethical boundaries
│   │   ├── services/api.ts          # Fetch client for FastAPI backend
│   │   ├── types/index.ts           # TypeScript interfaces
│   │   ├── App.tsx                  # Main router shell
│   │   └── main.tsx
│   ├── package.json
│   ├── vite.config.ts
│   └── tailwind.config.js
└── README.md
```

---

## 6. Installation & Setup Instructions

### Prerequisites
- Python 3.11, 3.12, or 3.13
- Node.js 18+ and npm

### Backend Setup
1. Open a terminal in `backend/`:
   ```bash
   cd backend
   pip install -r requirements.txt
   ```
2. (Optional) Re-train the GNN model from scratch:
   ```bash
   python -m ml.train
   ```
3. (Optional) Run held-out test evaluation:
   ```bash
   python -m ml.evaluate
   ```
4. Run automated test suite:
   ```bash
   python -m pytest tests
   ```
5. Launch the backend server:
   ```bash
   python run_backend.py
   # Or using uvicorn directly:
   # uvicorn app.main:app --host 127.0.0.1 --port 8000
   ```
   *The backend will be available at `http://127.0.0.1:8000`. Swagger API docs at `http://127.0.0.1:8000/docs`.*

### Frontend Setup
1. Open a separate terminal in `frontend/`:
   ```bash
   cd frontend
   npm install
   ```
2. Run development server:
   ```bash
   npm run dev
   ```
   *The web application will open at `http://localhost:5173`.*
3. Build for production:
   ```bash
   npm run build
   ```

---

## 7. API Endpoints

- `GET /api/health`: Health status, dataset presence, and model availability.
- `POST /api/predict`: Validates patient input, creates inductive graph representation, runs GAT message passing, and saves the assessment record.
- `GET /api/model-info`: GNN architecture, supported input features, and hyperparameters.
- `GET /api/evaluation`: Verified held-out test metrics, confusion matrix, and ROC-AUC curve.
- `GET /api/assessments`: History of past patient intakes.
- `DELETE /api/assessments/{id}`: Secure deletion of an assessment record.

---

## 8. Privacy, Security & Ethics

- **Zero-PII Policy**: No patient names, birthdates, or contact details are collected. Records utilize pseudonymous identifiers (e.g. `REF-4821`).
- **No Local Storage**: Sensitive clinical telemetry is not cached in browser local storage.
- **Audit Trails**: Intake logs are persisted in a local SQLite database with parameter binding.

---

## 9. Research Disclaimer

> **IMPORTANT**: This academic research prototype is **not** a medical diagnostic tool. Predictions are experimental and must not be used to make clinical decisions or diagnose neurodegenerative conditions. Always consult a certified healthcare professional for medical evaluations.
