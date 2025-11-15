import { useState, useEffect, useMemo } from "react";
import {
  Download,
  Users,
  CheckCircle2,
  FileSpreadsheet,
  LogOut,
  Filter,
} from "lucide-react";

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
  const BACKEND_URL = "https://voter-list-backend.onrender.com";

  const [residents, setResidents] = useState<Resident[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [showVisitedOnly, setShowVisitedOnly] = useState(false);

  const { toast } = useToast();
  const { logout } = useAuth();
  const navigate = useNavigate();

  // -----------------------------------------------------
  // LOGOUT
  // -----------------------------------------------------
  const handleLogout = () => {
    logout();
    navigate("/login");
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out.",
    });
  };

  // -----------------------------------------------------
  // AUTO SYNC SINGLE RESIDENT TO BACKEND
  // -----------------------------------------------------
  const syncResidentToBackend = async (resident: Resident) => {
    try {
      await fetch(`${BACKEND_URL}/update-resident`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(resident),
      });
      console.log("✔ Synced:", resident.name);
    } catch (err) {
      console.error("❌ Sync failed:", err);
    }
  };

  // -----------------------------------------------------
  // LOAD DATA FROM STORAGE
  // -----------------------------------------------------
  useEffect(() => {
    const saved = loadFromStorage();
    if (saved.length > 0) {
      setResidents(saved);
      toast({
        title: "Data Loaded",
        description: `${saved.length} residents loaded from storage.`,
      });
    }
  }, []);

  // ============================
  // 🚀 FETCH DATA FROM BACKEND ON STARTUP
  // ============================
  useEffect(() => {
    const fetchFromBackend = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/fetch-residents`);
        const data = await res.json();

        if (data.success) {
          setResidents((prev) => {
            return data.residents.map((sheetRow) => {
              const existing = prev.find((r) => r.serialNo === sheetRow.serialNo);

              return {
                ...sheetRow,
                category: existing?.category || sheetRow.category || "",
                remark: existing?.remark || sheetRow.remark || "",
                phoneNumber: existing?.phoneNumber || sheetRow.phoneNumber || "",
                visitCount: existing?.visitCount || sheetRow.visitCount || 0,
              };
            });
          });

          toast({
            title: "☁️ Synced from Cloud",
            description: `Loaded ${data.residents.length} rows from Google Sheets`,
          });
        }
      } catch (err) {
        console.error("Fetch failed:", err);
      }
    };

    fetchFromBackend();
  }, []);

  // -----------------------------------------------------
  // AUTO SAVE TO STORAGE
  // -----------------------------------------------------
  useEffect(() => {
    if (residents.length > 0) {
      saveToStorage(residents);
    }
  }, [residents]);

  // -----------------------------------------------------
  // UPLOAD EXCEL FILE  **🔥 FULLY FIXED VERSION**
  // -----------------------------------------------------
  const handleFileUpload = async (file: File) => {
    setIsProcessing(true);
    try {
      let parsed = await parseExcelFile(file);

      // Add serial numbers
      parsed = parsed.map((r, index) => ({
        ...r,
        serialNo: index + 1,
      }));

      setResidents(parsed);

      // 🔥 NEW: Sync ALL Excel rows to Google Sheet
      await fetch(`${BACKEND_URL}/sync-residents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed),
      });

      toast({
        title: "Synced to Google Sheet!",
        description: `${parsed.length} rows uploaded.`,
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to read file or sync.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // -----------------------------------------------------
  // UPDATE PHONE + SYNC
  // -----------------------------------------------------
  const handleUpdatePhone = (id: string, phone: string) => {
    setResidents((prev) => {
      const updated = prev.map((r) =>
        r.id === id ? { ...r, phoneNumber: phone } : r
      );
      const updatedResident = updated.find((r) => r.id === id);
      if (updatedResident) syncResidentToBackend(updatedResident);
      return updated;
    });
  };

  // -----------------------------------------------------
  // VISIT + SYNC
  // -----------------------------------------------------
  const handleVisit = (id: string) => {
    setResidents((prev) => {
      const updated = prev.map((r) =>
        r.id === id ? { ...r, visitCount: r.visitCount + 1 } : r
      );
      const updatedResident = updated.find((r) => r.id === id);
      if (updatedResident) syncResidentToBackend(updatedResident);
      return updated;
    });
  };

  // -----------------------------------------------------
  // DECREMENT VISIT + SYNC
  // -----------------------------------------------------
  const handleDecrementVisit = (id: string) => {
    setResidents((prev) => {
      const updated = prev.map((r) =>
        r.id === id && r.visitCount > 0
          ? { ...r, visitCount: r.visitCount - 1 }
          : r
      );
      const updatedResident = updated.find((r) => r.id === id);
      if (updatedResident) syncResidentToBackend(updatedResident);
      return updated;
    });
  };

  // -----------------------------------------------------
  // UPDATE CATEGORY + SYNC
  // -----------------------------------------------------
  const handleUpdateCategory = (id: string, category: string) => {
    setResidents((prev) => {
      const updated = prev.map((r) =>
        r.id === id ? { ...r, category } : r
      );
      const updatedResident = updated.find((r) => r.id === id);
      if (updatedResident) syncResidentToBackend(updatedResident);
      return updated;
    });
  };

  // -----------------------------------------------------
  // UPDATE REMARK + SYNC
  // -----------------------------------------------------
  const handleUpdateRemark = (id: string, remark: string) => {
    setResidents((prev) => {
      const updated = prev.map((r) =>
        r.id === id ? { ...r, remark } : r
      );
      const updatedResident = updated.find((r) => r.id === id);
      if (updatedResident) syncResidentToBackend(updatedResident);
      return updated;
    });
  };

  // -----------------------------------------------------
  // EXPORT EXCEL
  // -----------------------------------------------------
  const handleExport = () => {
    exportToExcel(residents, "field_residents");
    toast({ title: "Exported!", description: "Excel file downloaded." });
  };

  // -----------------------------------------------------
  // CLEAR ALL DATA
  // -----------------------------------------------------
  const handleClearData = () => {
    if (confirm("Are you sure? This cannot be undone.")) {
      clearStorage();
      setResidents([]);
      setSearchQuery("");
      toast({ title: "Cleared", description: "All local data removed." });
    }
  };

  // -----------------------------------------------------
  // FILTER LOGIC
  // -----------------------------------------------------
  const filteredResidents = useMemo(() => {
    let list = residents;

    if (showVisitedOnly) {
      list = list.filter((r) => r.visitCount > 0);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          r.guardianName.toLowerCase().includes(q) ||
          r.wardHouseNo.toLowerCase().includes(q) ||
          r.houseName.toLowerCase().includes(q)
      );
    }

    return list;
  }, [residents, searchQuery, showVisitedOnly]);

  // -----------------------------------------------------
  // STATS
  // -----------------------------------------------------
  const stats = useMemo(() => {
    const total = residents.length;
    const visited = residents.filter((r) => r.visitCount > 0).length;
    const unvisited = total - visited;
    const totalVisits = residents.reduce((sum, r) => sum + r.visitCount, 0);

    return { total, visited, unvisited, totalVisits };
  }, [residents]);

  return (
    <div className="min-h-screen bg-background">
      {/* HEADER */}
      <header className="border-b bg-card border-border">
        <div className="container mx-auto px-4 py-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-2">
              <FileSpreadsheet className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Election Field Manager</h1>
              <p className="text-sm text-muted-foreground">
                Track voter visits & information
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
      </header>

      {/* MAIN SECTION */}
      <main className="container mx-auto px-4 py-8">
        {residents.length === 0 ? (
          <FileUpload
            onFileUpload={handleFileUpload}
            isProcessing={isProcessing}
          />
        ) : (
          <div className="space-y-6">
            <StatsBlock stats={stats} />

            <div className="flex flex-col sm:flex-row gap-4">
              <SearchBar value={searchQuery} onChange={setSearchQuery} />

              <Button
                variant={showVisitedOnly ? "default" : "outline"}
                onClick={() => setShowVisitedOnly(!showVisitedOnly)}
              >
                <Filter className="mr-2 h-4 w-4" />
                {showVisitedOnly ? "Show All" : "Show Visited Only"}
              </Button>
            </div>

            <ResidentTable
              residents={filteredResidents}
              onUpdatePhone={handleUpdatePhone}
              onVisit={handleVisit}
              onDecrementVisit={handleDecrementVisit}
              onUpdateCategory={handleUpdateCategory}
              onUpdateRemark={handleUpdateRemark}
            />
          </div>
        )}
      </main>
    </div>
  );
};

// -----------------------------------------------------
// STATS BLOCK
// -----------------------------------------------------
const StatsBlock = ({ stats }: any) => (
  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
    <StatCard title="Total Residents" value={stats.total} icon={<Users className="h-5 w-5 text-primary" />} />
    <StatCard title="Visited" value={stats.visited} icon={<CheckCircle2 className="h-5 w-5 text-success" />} />
    <StatCard title="Unvisited" value={stats.unvisited} icon={<Users className="h-5 w-5 text-warning" />} />
    <StatCard title="Total Visits" value={stats.totalVisits} icon={<CheckCircle2 className="h-5 w-5 text-accent" />} />
  </div>
);

const StatCard = ({ icon, title, value }: any) => (
  <div className="rounded-lg border bg-card p-4">
    <div className="flex items-center gap-3">
      <div className="rounded-full bg-primary/10 p-2">{icon}</div>
      <div>
        <p className="text-sm text-muted-foreground">{title}</p>
        <p className="text-2xl font-bold">{value}</p>
      </div>
    </div>
  </div>
);

export default Index;
