"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Sparkles, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

interface AIGenerateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGenerate: (html: string, css: string) => void;
}

export default function AIGenerateDialog({ 
  open, 
  onOpenChange, 
  onGenerate 
}: AIGenerateDialogProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [websiteType, setWebsiteType] = useState("portfolio");
  const [description, setDescription] = useState("");
  const [businessName, setBusinessName] = useState("");

  const handleGenerate = async () => {
    setIsGenerating(true);
    
    try {
      const response = await fetch("/api/ai/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: websiteType,
          prompt: description,
          businessName,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate website");
      }

      const data = await response.json();
      
      if (data.success) {
        onGenerate(data.data.html, data.data.css);
        onOpenChange(false);
        toast.success("Website generated successfully!");
        
        // Reset form
        setDescription("");
        setBusinessName("");
      }
    } catch (error) {
      console.error("Generation error:", error);
      toast.error("Failed to generate website. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Generate Website with AI
          </DialogTitle>
          <DialogDescription>
            Describe your website and let AI create a stunning design for you
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Website Type */}
          <div className="space-y-3">
            <Label>What type of website do you want to create?</Label>
            <RadioGroup value={websiteType} onValueChange={setWebsiteType}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="portfolio" id="portfolio" />
                <Label htmlFor="portfolio" className="font-normal cursor-pointer">
                  Portfolio / Personal Website
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="business" id="business" />
                <Label htmlFor="business" className="font-normal cursor-pointer">
                  Business / Company Website
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="landing" id="landing" />
                <Label htmlFor="landing" className="font-normal cursor-pointer">
                  Landing Page
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="blog" id="blog" />
                <Label htmlFor="blog" className="font-normal cursor-pointer">
                  Blog / Content Website
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Business Name (conditional) */}
          {(websiteType === "business" || websiteType === "landing") && (
            <div className="space-y-2">
              <Label htmlFor="businessName">Business Name</Label>
              <Input
                id="businessName"
                placeholder="Enter your business name"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
              />
            </div>
          )}

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">
              Describe your website (optional)
            </Label>
            <Textarea
              id="description"
              placeholder="E.g., A modern portfolio for a graphic designer with sections for projects, about me, and contact. Use a minimalist design with blue accents..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
            />
          </div>

          {/* Examples */}
          <div className="bg-muted/50 rounded-lg p-4">
            <p className="text-sm font-medium mb-2">Example prompts:</p>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• "A tech startup landing page with modern animations"</li>
              <li>• "A photographer's portfolio with a dark theme and image galleries"</li>
              <li>• "A restaurant website with menu sections and reservation form"</li>
              <li>• "A personal blog with a clean, readable design"</li>
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={isGenerating}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleGenerate}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Generate Website
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}