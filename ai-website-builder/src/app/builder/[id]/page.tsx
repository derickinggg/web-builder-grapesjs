"use client";

import { useParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { api } from "@/lib/api";

// Dynamically import the builder to avoid SSR issues
const WebsiteBuilder = dynamic(
  () => import("@/components/builder/WebsiteBuilder"),
  { ssr: false }
);

export default function BuilderPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;
  const [projectData, setProjectData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadProjectData();
  }, [projectId]);

  const loadProjectData = async () => {
    try {
      const response = await api.projects.getData(projectId);
      if (response.success && response.data) {
        setProjectData(response.data.projectData);
      }
    } catch (error) {
      console.error("Failed to load project data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (data: any) => {
    try {
      const response = await api.projects.save(projectId, data);
      if (response.success) {
        toast.success("Project saved successfully!");
      }
    } catch (error) {
      console.error("Failed to save project:", error);
      toast.error("Failed to save project");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading project...</p>
        </div>
      </div>
    );
  }

  return (
    <WebsiteBuilder
      projectId={projectId}
      onSave={handleSave}
      initialData={projectData}
    />
  );
}