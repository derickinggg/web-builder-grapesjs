"use client";

import { useEffect, useRef, useState } from "react";
import grapesjs from "grapesjs";
import "grapesjs/dist/css/grapes.min.css";
import gjsBlocksBasic from "grapesjs-blocks-basic";
import gjsPresetWebpage from "grapesjs-preset-webpage";
import { Button } from "@/components/ui/button";
import { 
  Save, 
  Download, 
  Eye, 
  Code, 
  Undo, 
  Redo,
  Sparkles,
  Settings
} from "lucide-react";
import toast from "react-hot-toast";
import AIGenerateDialog from "./AIGenerateDialog";

interface WebsiteBuilderProps {
  projectId: string;
  onSave?: (data: any) => void;
  initialData?: any;
}

export default function WebsiteBuilder({ projectId, onSave, initialData }: WebsiteBuilderProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [editor, setEditor] = useState<any>(null);
  const [isPreview, setIsPreview] = useState(false);
  const [showAIDialog, setShowAIDialog] = useState(false);

  useEffect(() => {
    if (!editorRef.current) return;

    const editorInstance = grapesjs.init({
      container: editorRef.current,
      height: "100%",
      width: "auto",
      storageManager: false,
      plugins: [gjsBlocksBasic, gjsPresetWebpage],
      pluginsOpts: {
        [gjsBlocksBasic]: {},
        [gjsPresetWebpage]: {
          blocks: ["link-block", "quote", "text-basic"],
        },
      },
      canvas: {
        styles: [
          "https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css",
        ],
      },
      blockManager: {
        appendTo: "#blocks",
      },
      layerManager: {
        appendTo: "#layers",
      },
      panels: {
        defaults: [],
      },
      deviceManager: {
        devices: [
          {
            name: "Desktop",
            width: "",
          },
          {
            name: "Tablet",
            width: "768px",
          },
          {
            name: "Mobile",
            width: "375px",
          },
        ],
      },
      styleManager: {
        appendTo: "#styles",
        sectors: [
          {
            name: "General",
            properties: [
              "float",
              "display",
              "position",
              "top",
              "right",
              "left",
              "bottom",
            ],
          },
          {
            name: "Dimension",
            open: false,
            properties: [
              "width",
              "height",
              "max-width",
              "min-height",
              "margin",
              "padding",
            ],
          },
          {
            name: "Typography",
            open: false,
            properties: [
              "font-family",
              "font-size",
              "font-weight",
              "letter-spacing",
              "color",
              "line-height",
              "text-align",
              "text-shadow",
            ],
          },
          {
            name: "Decorations",
            open: false,
            properties: [
              "border-radius",
              "background-color",
              "border",
              "box-shadow",
              "background",
            ],
          },
        ],
      },
    });

    // Load initial data if provided
    if (initialData) {
      editorInstance.loadProjectData(initialData);
    }

    setEditor(editorInstance);

    // Cleanup
    return () => {
      editorInstance.destroy();
    };
  }, [initialData]);

  const handleSave = () => {
    if (!editor) return;
    
    const projectData = editor.getProjectData();
    const html = editor.getHtml();
    const css = editor.getCss();
    
    if (onSave) {
      onSave({ projectData, html, css });
    }
    
    toast.success("Project saved successfully!");
  };

  const handlePreview = () => {
    if (!editor) return;
    setIsPreview(!isPreview);
    editor.runCommand(isPreview ? "sw-visibility" : "preview");
  };

  const handleExport = () => {
    if (!editor) return;
    
    const html = editor.getHtml();
    const css = editor.getCss();
    const fullHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Exported Website</title>
    <style>${css}</style>
</head>
<body>${html}</body>
</html>`;
    
    const blob = new Blob([fullHtml], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "website.html";
    a.click();
    URL.revokeObjectURL(url);
    
    toast.success("Website exported successfully!");
  };

  const handleUndo = () => {
    if (!editor) return;
    editor.runCommand("core:undo");
  };

  const handleRedo = () => {
    if (!editor) return;
    editor.runCommand("core:redo");
  };

  const handleAIGenerate = (html: string, css: string) => {
    if (!editor) return;
    
    // Clear existing content
    editor.setComponents(html);
    editor.setStyle(css);
    
    toast.success("AI-generated content added to the canvas!");
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <div className="w-80 border-r flex flex-col">
        {/* Toolbar */}
        <div className="border-b p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Website Builder</h2>
            <Button variant="ghost" size="icon">
              <Settings className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="icon" onClick={handleUndo}>
              <Undo className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={handleRedo}>
              <Redo className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={handlePreview}>
              <Eye className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon">
              <Code className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {/* Tabs */}
        <div className="flex-1 overflow-hidden">
          <div className="p-4">
            <div className="mb-4">
              <h3 className="text-sm font-medium mb-2">Blocks</h3>
              <div id="blocks" className="min-h-[200px]"></div>
            </div>
            <div className="mb-4">
              <h3 className="text-sm font-medium mb-2">Layers</h3>
              <div id="layers" className="min-h-[150px]"></div>
            </div>
            <div>
              <h3 className="text-sm font-medium mb-2">Styles</h3>
              <div id="styles" className="min-h-[200px]"></div>
            </div>
          </div>
        </div>
        
        {/* Actions */}
        <div className="border-t p-4 space-y-2">
          <Button 
            className="w-full" 
            variant="outline"
            onClick={() => setShowAIDialog(true)}
          >
            <Sparkles className="h-4 w-4 mr-2" />
            Generate with AI
          </Button>
          <Button className="w-full" onClick={handleSave}>
            <Save className="h-4 w-4 mr-2" />
            Save Project
          </Button>
          <Button 
            className="w-full" 
            variant="secondary"
            onClick={handleExport}
          >
            <Download className="h-4 w-4 mr-2" />
            Export HTML
          </Button>
        </div>
      </div>
      
      {/* Editor Canvas */}
      <div className="flex-1 relative">
        <div ref={editorRef} className="h-full" />
      </div>

      {/* AI Generate Dialog */}
      <AIGenerateDialog
        open={showAIDialog}
        onOpenChange={setShowAIDialog}
        onGenerate={handleAIGenerate}
      />
    </div>
  );
}