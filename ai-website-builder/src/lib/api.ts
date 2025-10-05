// API helper functions

const API_BASE = '/api';

export const api = {
  // Projects
  projects: {
    getAll: async () => {
      const res = await fetch(`${API_BASE}/projects`);
      if (!res.ok) throw new Error('Failed to fetch projects');
      return res.json();
    },
    
    get: async (id: string) => {
      const res = await fetch(`${API_BASE}/projects/${id}`);
      if (!res.ok) throw new Error('Failed to fetch project');
      return res.json();
    },
    
    create: async (data: { name: string; description?: string }) => {
      const res = await fetch(`${API_BASE}/projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to create project');
      return res.json();
    },
    
    update: async (id: string, data: any) => {
      const res = await fetch(`${API_BASE}/projects/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to update project');
      return res.json();
    },
    
    delete: async (id: string) => {
      const res = await fetch(`${API_BASE}/projects/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete project');
      return res.json();
    },
    
    save: async (id: string, data: any) => {
      const res = await fetch(`${API_BASE}/projects/${id}/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to save project data');
      return res.json();
    },
    
    getData: async (id: string) => {
      const res = await fetch(`${API_BASE}/projects/${id}/save`);
      if (!res.ok) throw new Error('Failed to fetch project data');
      return res.json();
    },
  },
  
  // AI
  ai: {
    generate: async (data: { type: string; prompt?: string; businessName?: string }) => {
      const res = await fetch(`${API_BASE}/ai/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to generate with AI');
      return res.json();
    },
  },
};