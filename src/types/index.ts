export interface PatientAssessmentInput {
  patient_ref_id: string;
  age: number;
  sex: 'M' | 'F';
  education_years: number;
  ses?: number | null;
  mmse_score?: number | null;
  etiv: number;
  nwbv: number;
  asf: number;
  family_history?: string;
  hypertension_history?: string;
  diabetes_history?: string;
  smoking_status?: string;
  physical_activity?: string;
  moca_score?: number | null;
  clinical_dementia_rating?: number | null;
  memory_assessment_score?: number | null;
  apoe_e4_status?: string;
}

export interface NeighborNode {
  id: string;
  similarity: number;
  rbf_weight: number;
  diagnosis: 'Nondemented' | 'Demented';
  age: number;
  mmse: number | null;
  nwbv: number;
  label: string;
}

export interface CytoscapeNodeData {
  data: {
    id: string;
    label: string;
    type?: string;
    diagnosis?: string;
    color?: string;
    [key: string]: any;
  };
}

export interface CytoscapeEdgeData {
  data: {
    id: string;
    source: string;
    target: string;
    weight: number;
    label?: string;
  };
}

export interface GraphDataPayload {
  nodes: CytoscapeNodeData[];
  edges: CytoscapeEdgeData[];
}

export interface FeatureSummaryItem {
  patient_value: any;
  cohort_median?: number;
  cohort_mean?: number;
}

export interface PredictionResponse {
  id?: number;
  patient_ref_id: string;
  prediction_label: 'Nondemented' | 'Demented';
  confidence: number;
  probabilities: {
    Nondemented: number;
    Demented: number;
  };
  nearest_neighbors: NeighborNode[];
  graph_data: GraphDataPayload;
  feature_summary: Record<string, FeatureSummaryItem>;
  model_version: string;
  timestamp: string;
  disclaimer: string;
}

export interface HealthResponse {
  status: string;
  model_available: boolean;
  dataset_available: boolean;
  model_version: string | null;
  environment: string;
}

export interface ModelInfoResponse {
  model_name: string;
  model_version: string;
  architecture: string;
  dataset: string;
  supported_features: string[];
  target_classes: string[];
  is_trained: boolean;
  last_trained_timestamp: string | null;
  graph_construction: {
    type: string;
    method: string;
    k_neighbors: number;
    inference: string;
  };
  limitations: string[];
}

export interface EvaluationResponse {
  dataset_name: string;
  total_samples: number;
  train_samples: number;
  val_samples: number;
  test_samples: number;
  metrics: {
    accuracy: number;
    precision: number;
    precision_weighted: number;
    recall: number;
    recall_weighted: number;
    f1_score: number;
    f1_weighted: number;
    roc_auc: number;
  };
  confusion_matrix: {
    matrix: number[][];
    labels: string[];
    tn: number;
    fp: number;
    fn: number;
    tp: number;
  };
  class_distribution: {
    Nondemented: number;
    Demented: number;
  };
  roc_curve?: {
    fpr: number[];
    tpr: number[];
  };
  training_history?: {
    train_loss: number[];
    val_loss: number[];
    train_acc: number[];
    val_acc: number[];
  };
  is_real_data: boolean;
  evaluation_timestamp: string;
}

export interface AssessmentRecord {
  id: number;
  patient_ref_id: string;
  age: number;
  sex: string;
  education_years: number;
  ses: number | null;
  mmse_score: number | null;
  etiv: number;
  nwbv: number;
  asf: number;
  prediction_label: string;
  prediction_probability: number;
  model_version: string;
  created_at: string;
}

export type PageId =
  | 'landing'
  | 'dashboard'
  | 'assessment'
  | 'results'
  | 'graph-explorer'
  | 'history'
  | 'evaluation'
  | 'about'
  | 'privacy';
