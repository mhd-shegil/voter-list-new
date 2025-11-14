import { useState, useEffect, useMemo } from "react";
import { Download, Users, CheckCircle2, FileSpreadsheet, LogOut, Filter } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { FileUpload } from "@/components/FileUpload";
import { SearchBar } from "@/components/SearchBar";
import { ResidentTable } from "@/components/ResidentTable";
import { Resident } from "@/types/resident";
import { parseExcelFile, exportToExcel } from "@/utils/excelUtils";
import { saveToStorage, loadFromStorage, clearStorage } from "@/utils/storage";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const [residents, setResidents] = useState<Resident[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [showVisitedOnly, setShowVisitedOnly] = useState(false);
  const { toast } = useToast();
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out.",
    });
  };

  // Load data from storage on mount
  useEffect(() => {
    const savedData = loadFromStorage();
    if (savedData.length > 0) {
      setResidents(savedData);
      toast({
        title: "Data Loaded",
        description: `${savedData.length} residents loaded from storage.`,
      });
    }
  }, []);

  // Save to storage whenever residents change
  useEffect(() => {
    if (residents.length > 0) {
      saveToStorage(residents);
    }
  }, [residents]);

  const handleFileUpload = async (file: File) => {
    setIsProcessing(true);
    try {
      const parsedResidents = await parseExcelFile(file);
      setResidents(parsedResidents);
      toast({
        title: "Success!",
        description: `${parsedResidents.length} residents imported successfully.`,
        variant: "default",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to parse file. Please check the format.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUpdatePhone = (id: string, phone: string) => {
    setResidents((prev) =>
      prev.map((r) => (r.id === id ? { ...r, phoneNumber: phone } : r))
    );
    toast({
      title: "Phone Updated",
      description: "Phone number saved successfully.",
    });
  };

  const handleVisit = (id: string) => {
    setResidents((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, visitCount: r.visitCount + 1 } : r
      )
    );
    toast({
      title: "Visit Recorded",
      description: "Visit count updated successfully.",
      variant: "default",
    });
  };

  const handleDecrementVisit = (id: string) => {
    setResidents((prev) =>
      prev.map((r) =>
        r.id === id && r.visitCount > 0 ? { ...r, visitCount: r.visitCount - 1 } : r
      )
    );
    toast({
      title: "Visit Decremented",
      description: "Visit count decreased successfully.",
    });
  };

  const handleUpdateCategory = (id: string, category: string) => {
    setResidents((prev) =>
      prev.map((r) => (r.id === id ? { ...r, category } : r))
    );
    toast({
      title: "Category Updated",
      description: "Category saved successfully.",
    });
  };

  const handleUpdateRemark = (id: string, remark: string) => {
    setResidents((prev) =>
      prev.map((r) => (r.id === id ? { ...r, remark } : r))
    );
    toast({
      title: "Remark Saved",
      description: "Remark updated successfully.",
    });
  };

  const handleExport = () => {
    exportToExcel(filteredResidents, 'field_residents');
    toast({
      title: "Export Complete",
      description: "Data exported to Excel successfully.",
    });
  };

  const handleClearData = () => {
    if (confirm("Are you sure you want to clear all data? This cannot be undone.")) {
      clearStorage();
      setResidents([]);
      setSearchQuery("");
      toast({
        title: "Data Cleared",
        description: "All data has been removed.",
      });
    }
  };

  const filteredResidents = useMemo(() => {
    let filtered = residents;

    // Apply visited filter
    if (showVisitedOnly) {
      filtered = filtered.filter((r) => r.visitCount > 0);
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (r) =>
          r.name.toLowerCase().includes(query) ||
          r.guardianName.toLowerCase().includes(query) ||
          r.wardHouseNo.toLowerCase().includes(query) ||
          r.houseName.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [residents, searchQuery, showVisitedOnly]);

  const stats = useMemo(() => {
    const total = residents.length;
    const visited = residents.filter((r) => r.visitCount > 0).length;
    const unvisited = total - visited;
    const totalVisits = residents.reduce((sum, r) => sum + r.visitCount, 0);

    return { total, visited, unvisited, totalVisits };
  }, [residents]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-2">
                <FileSpreadsheet className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">
                  Election Field Manager
                </h1>
                <p className="text-sm text-muted-foreground">
                  Track voter visits and contact information
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              {residents.length > 0 && (
                <>
                  <Button variant="outline" size="sm" onClick={handleClearData}>
                    Clear Data
                  </Button>
                  <Button variant="default" size="sm" onClick={handleExport}>
                    <Download className="mr-2 h-4 w-4" />
                    Export
                  </Button>
                </>
              )}
              <Button variant="destructive" size="sm" onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {residents.length === 0 ? (
          <FileUpload
            onFileUpload={handleFileUpload}
            isProcessing={isProcessing}
          />
        ) : (
          <div className="space-y-6">
            {/* Stats */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-lg border border-border bg-card p-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-primary/10 p-2">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Residents</p>
                    <p className="text-2xl font-bold text-foreground">{stats.total}</p>
                  </div>
                </div>
              </div>
              <div className="rounded-lg border border-border bg-card p-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-success/10 p-2">
                    <CheckCircle2 className="h-5 w-5 text-success" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Visited</p>
                    <p className="text-2xl font-bold text-foreground">{stats.visited}</p>
                  </div>
                </div>
              </div>
              <div className="rounded-lg border border-border bg-card p-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-warning/10 p-2">
                    <Users className="h-5 w-5 text-warning" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Unvisited</p>
                    <p className="text-2xl font-bold text-foreground">{stats.unvisited}</p>
                  </div>
                </div>
              </div>
              <div className="rounded-lg border border-border bg-card p-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-accent/10 p-2">
                    <CheckCircle2 className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Visits</p>
                    <p className="text-2xl font-bold text-foreground">{stats.totalVisits}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Search and Filter */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <SearchBar value={searchQuery} onChange={setSearchQuery} />
              </div>
              <Button
                variant={showVisitedOnly ? "default" : "outline"}
                onClick={() => setShowVisitedOnly(!showVisitedOnly)}
                className="whitespace-nowrap"
              >
                <Filter className="mr-2 h-4 w-4" />
                {showVisitedOnly ? "Show All" : "Show Visited Only"}
              </Button>
            </div>

            {/* Table */}
            <ResidentTable
              residents={filteredResidents}
              onUpdatePhone={handleUpdatePhone}
              onVisit={handleVisit}
              onDecrementVisit={handleDecrementVisit}
              onUpdateCategory={handleUpdateCategory}
              onUpdateRemark={handleUpdateRemark}
            />

            {/* Results Info */}
            {searchQuery && (
              <p className="text-center text-sm text-muted-foreground">
                Showing {filteredResidents.length} of {residents.length} residents
              </p>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default Index;
