import {
  HealthResponse,
  ModelInfoResponse,
  EvaluationResponse,
  PatientAssessmentInput,
  PredictionResponse,
  AssessmentRecord
} from '../types';

const API_BASE = '/api';

class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = 'ApiError';
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    let detail = `Request failed with status ${response.status}`;
    try {
      const errJson = await response.json();
      if (errJson.detail) detail = errJson.detail;
    } catch {
      // ignore
    }
    throw new ApiError(detail, response.status);
  }

  return response.json();
}

export const api = {
  getHealth: () => request<HealthResponse>('/health'),
  getModelInfo: () => request<ModelInfoResponse>('/model-info'),
  getEvaluation: () => request<EvaluationResponse>('/evaluation'),
  predict: (patientData: PatientAssessmentInput) =>
    request<PredictionResponse>('/predict', {
      method: 'POST',
      body: JSON.stringify(patientData),
    }),
  getAssessments: (limit = 50, offset = 0) =>
    request<AssessmentRecord[]>(`/assessments?limit=${limit}&offset=${offset}`),
  deleteAssessment: (id: number) =>
    request<{ status: string; message: string }>(`/assessments/${id}`, {
      method: 'DELETE',
    }),
};
