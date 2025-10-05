"use client";

import { useParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";

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

  useEffect(() => {
    // Load project data from localStorage (in a real app, this would be from a database)
    const savedData = localStorage.getItem(`project-${projectId}`);
    if (savedData) {
      setProjectData(JSON.parse(savedData));
    }
  }, [projectId]);

  const handleSave = (data: any) => {
    // Save to localStorage (in a real app, this would be to a database)
    localStorage.setItem(`project-${projectId}`, JSON.stringify(data));
    toast.success("Project saved successfully!");
  };

  return (
    <WebsiteBuilder
      projectId={projectId}
      onSave={handleSave}
      initialData={projectData}
    />
  );
}