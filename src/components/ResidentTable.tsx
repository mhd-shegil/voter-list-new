import { useState } from "react";
import { Check, Edit2, Phone, Minus, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { Resident } from "@/types/resident";

interface ResidentTableProps {
  residents: Resident[];
  onUpdatePhone: (id: string, phone: string) => void;
  onVisit: (id: string) => void;
  onDecrementVisit: (id: string) => void;
  onUpdateCategory: (id: string, category: string) => void;
  onUpdateRemark: (id: string, remark: string) => void;
}

export const ResidentTable = ({
  residents,
  onUpdatePhone,
  onVisit,
  onDecrementVisit,
  onUpdateCategory,
  onUpdateRemark,
}: ResidentTableProps) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingPhone, setEditingPhone] = useState("");
  const [remarkDialogOpen, setRemarkDialogOpen] = useState<string | null>(null);
  const [editingRemark, setEditingRemark] = useState("");

  const handleEditStart = (resident: Resident) => {
    setEditingId(resident.id);
    setEditingPhone(resident.phoneNumber || resident.mobileNumber || "");
  };

  const handleEditSave = (id: string) => {
    onUpdatePhone(id, editingPhone);
    setEditingId(null);
    setEditingPhone("");
  };

  const handleRemarkOpen = (resident: Resident) => {
    setRemarkDialogOpen(resident.id);
    setEditingRemark(resident.remark || "");
  };

  const handleRemarkSave = (id: string) => {
    onUpdateRemark(id, editingRemark);
    setRemarkDialogOpen(null);
    setEditingRemark("");
  };

  if (residents.length === 0) {
    return (
      <Card className="p-12 text-center">
        <p className="text-muted-foreground">No residents found. Upload a file to get started.</p>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="font-semibold">S.No</TableHead>
              <TableHead className="font-semibold">Name</TableHead>
              <TableHead className="font-semibold">Guardian</TableHead>
              <TableHead className="font-semibold">Ward/House</TableHead>
              <TableHead className="font-semibold">House Name</TableHead>
              <TableHead className="font-semibold">Gender/Age</TableHead>
              <TableHead className="font-semibold">Original Mobile</TableHead>
              <TableHead className="font-semibold">Phone Number</TableHead>
              <TableHead className="font-semibold">Category</TableHead>
              <TableHead className="text-center font-semibold">Visits</TableHead>
              <TableHead className="text-center font-semibold">Remark</TableHead>
              <TableHead className="text-center font-semibold">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {residents.map((resident) => (
              <TableRow
                key={resident.id}
                className={cn(
                  "transition-colors",
                  resident.visitCount === 0 && "bg-warning/5 hover:bg-warning/10"
                )}
              >
                <TableCell className="font-medium">{resident.serialNo}</TableCell>
                <TableCell className="font-medium">{resident.name}</TableCell>
                <TableCell className="text-muted-foreground">{resident.guardianName}</TableCell>
                <TableCell>{resident.wardHouseNo}</TableCell>
                <TableCell>{resident.houseName}</TableCell>
                <TableCell>{resident.genderAge}</TableCell>
                <TableCell className="text-muted-foreground">{resident.mobileNumber}</TableCell>
                <TableCell>
                  {editingId === resident.id ? (
                    <div className="flex gap-2">
                      <Input
                        type="tel"
                        value={editingPhone}
                        onChange={(e) => setEditingPhone(e.target.value)}
                        className="h-9 w-32"
                        placeholder="Phone"
                      />
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => handleEditSave(resident.id)}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="text-sm">
                        {resident.phoneNumber || "-"}
                      </span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEditStart(resident)}
                      >
                        <Edit2 className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  <Select
                    value={resident.category || ""}
                    onValueChange={(value) => onUpdateCategory(resident.id, value)}
                  >
                    <SelectTrigger className="w-[120px] h-9">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SKY">SKY</SelectItem>
                      <SelectItem value="FIRE">FIRE</SelectItem>
                      <SelectItem value="SUN">SUN</SelectItem>
                      <SelectItem value="CLOUD">CLOUD</SelectItem>
                      <SelectItem value="WIND">WIND</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell className="text-center">
                  <Badge
                    variant={resident.visitCount > 0 ? "default" : "secondary"}
                    className={cn(
                      "font-semibold",
                      resident.visitCount > 0 && "bg-success text-success-foreground"
                    )}
                  >
                    {resident.visitCount}
                  </Badge>
                </TableCell>
                <TableCell className="text-center">
                  <Dialog
                    open={remarkDialogOpen === resident.id}
                    onOpenChange={(open) => {
                      if (!open) {
                        setRemarkDialogOpen(null);
                        setEditingRemark("");
                      }
                    }}
                  >
                    <DialogTrigger asChild>
                      <Button
                        size="sm"
                        variant={resident.remark ? "default" : "outline"}
                        onClick={() => handleRemarkOpen(resident)}
                      >
                        <MessageSquare className="h-4 w-4 mr-1" />
                        {resident.remark ? "View" : "Add"}
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Remark for {resident.name}</DialogTitle>
                        <DialogDescription>
                          Add or edit remarks for this resident.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="py-4">
                        <Textarea
                          value={editingRemark}
                          onChange={(e) => setEditingRemark(e.target.value)}
                          placeholder="Enter your remarks here..."
                          className="min-h-[120px]"
                        />
                      </div>
                      <DialogFooter>
                        <Button onClick={() => handleRemarkSave(resident.id)}>
                          Save Remark
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </TableCell>
                <TableCell className="text-center">
                  <div className="flex items-center justify-center gap-2">
                    <Button
                      size="sm"
                      variant={resident.visitCount > 0 ? "secondary" : "default"}
                      onClick={() => onVisit(resident.id)}
                      className={cn(
                        "min-w-[100px]",
                        resident.visitCount > 0 && "bg-accent hover:bg-accent/90"
                      )}
                    >
                      <Phone className="mr-1 h-4 w-4" />
                      {resident.visitCount > 0 ? "Visit Again" : "Mark Visited"}
                    </Button>
                    {resident.visitCount > 0 && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onDecrementVisit(resident.id)}
                        className="border-destructive/50 text-destructive hover:bg-destructive/10"
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
};
