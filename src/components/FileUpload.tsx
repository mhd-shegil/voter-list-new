import { useCallback } from "react";
import { Upload, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface FileUploadProps {
  onFileUpload: (file: File) => void;
  isProcessing: boolean;
}

export const FileUpload = ({ onFileUpload, isProcessing }: FileUploadProps) => {
  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file && (file.name.endsWith('.xlsx') || file.name.endsWith('.csv'))) {
        onFileUpload(file);
      }
    },
    [onFileUpload]
  );

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileUpload(file);
    }
  };

  return (
    <Card
      className={cn(
        "border-2 border-dashed border-border bg-card p-12 text-center transition-colors",
        "hover:border-primary hover:bg-muted/50",
        isProcessing && "pointer-events-none opacity-50"
      )}
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
    >
      <div className="flex flex-col items-center gap-4">
        <div className="rounded-full bg-primary/10 p-6">
          <FileSpreadsheet className="h-12 w-12 text-primary" />
        </div>
        <div className="space-y-2">
          <h3 className="text-xl font-semibold text-foreground">
            Upload Resident Data
          </h3>
          <p className="text-sm text-muted-foreground">
            Drag and drop your Excel (.xlsx) or CSV file here
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            variant="default"
            size="lg"
            disabled={isProcessing}
            onClick={() => document.getElementById('file-input')?.click()}
          >
            <Upload className="mr-2 h-5 w-5" />
            {isProcessing ? "Processing..." : "Choose File"}
          </Button>
          <input
            id="file-input"
            type="file"
            accept=".xlsx,.csv"
            onChange={handleFileInput}
            className="hidden"
          />
        </div>
        <p className="text-xs text-muted-foreground">
          Expected columns: Serial No., Name, Guardian's Name, Ward/House No, House Name, Gender/Age, Mobile Number
        </p>
      </div>
    </Card>
  );
};
