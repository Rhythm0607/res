import api from './api';

export interface WorkflowStage {
  id: number;
  name: string;
  order_index: number;
}

export const workflowService = {
  getStages: async (): Promise<WorkflowStage[]> => {
    const response = await api.get<WorkflowStage[]>('/workflow');
    return response.data;
  },

  createStage: async (name: string): Promise<WorkflowStage> => {
    const response = await api.post<WorkflowStage>('/workflow', { name });
    return response.data;
  },
};
