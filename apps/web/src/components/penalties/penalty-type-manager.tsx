'use client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { BaseDataTable } from '@/components/ui/base-data-table';
import { Button } from '@/components/ui/button';
import { PERMISSIONS, ProtectedComponent } from '@/shared/auth';
import { usePagination } from '@/shared/hooks/use-pagination';
import penaltyTypeService from '@/shared/services/client/penalty-type.service';
import { PaginationState, PenaltyType } from '@qnoffice/shared';
import { ColumnDef } from '@tanstack/react-table';
import { Edit, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { PenaltyTypeForm } from './penalty-type-form';

interface PenaltyTypeManagerProps {
  initialData: PenaltyType[];
  initialPagination: PaginationState;
}

export function PenaltyTypeManager({
  initialData,
  initialPagination,
}: PenaltyTypeManagerProps) {
  const [showForm, setShowForm] = useState(false);
  const [selectedType, setSelectedType] = useState<PenaltyType | undefined>();
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const pagination = usePagination({
    defaultPage: 1,
    defaultPageSize: 10,
  });

  const handleEdit = (type: PenaltyType) => {
    setSelectedType(type);
    setShowForm(true);
  };

  const handleCreate = () => {
    setSelectedType(undefined);
    setShowForm(true);
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      await penaltyTypeService.remove(deleteId);
      toast.success('Penalty type deleted successfully');
      window.location.reload();
    } catch {
      toast.error('Failed to delete penalty type');
    } finally {
      setDeleteId(null);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  const columns: ColumnDef<PenaltyType>[] = [
    {
      accessorKey: 'name',
      header: 'Name',
      cell: ({ row }) => <div className="font-medium">{row.original.name}</div>,
    },
    {
      accessorKey: 'description',
      header: 'Description',
      cell: ({ row }) => (
        <div className="max-w-md truncate">
          {row.original.description || '-'}
        </div>
      ),
    },
    {
      accessorKey: 'amount',
      header: 'Default Amount',
      cell: ({ row }) => (
        <div className="text-right font-medium">
          {formatCurrency(Number(row.original.amount))}
        </div>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex justify-end gap-2">
          <ProtectedComponent permission={PERMISSIONS.MANAGE_PENALTIES}>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleEdit(row.original)}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDeleteId(row.original.id)}
            >
              <Trash2 className="h-4 w-4 text-red-500" />
            </Button>
          </ProtectedComponent>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <ProtectedComponent permission={PERMISSIONS.MANAGE_PENALTIES}>
          <Button onClick={handleCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Add Penalty Type
          </Button>
        </ProtectedComponent>
      </div>

      <BaseDataTable
        columns={columns}
        initialData={initialData}
        initialPagination={initialPagination}
        pagination={pagination}
        searchPlaceholder="Search penalty types..."
        showSearch={false}
      />

      <PenaltyTypeForm
        isOpen={showForm}
        onClose={() => {
          setShowForm(false);
          setSelectedType(undefined);
        }}
        onSuccess={() => window.location.reload()}
        penaltyType={selectedType}
      />

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this penalty type. This action cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
