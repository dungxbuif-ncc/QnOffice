import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import pantryMenuService from '@/shared/services/client/pantry-menu.service';
import {
  ICreatePantryMenuItemDto,
  IUpdatePantryMenuItemDto,
  PantryMenuItem,
} from '@qnoffice/shared';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Edit, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { PantryMenuEditDialog } from './pantry-menu-edit-dialog';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: PantryMenuItem[];
}

export function PantryMenuManagementModal({
  open,
  onOpenChange,
  items,
}: Props) {
  const queryClient = useQueryClient();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<PantryMenuItem | null>(null);

  const createMutation = useMutation({
    mutationFn: (data: ICreatePantryMenuItemDto) =>
      pantryMenuService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pantry-menu'] });
      toast.success('Thêm món thành công');
      setIsFormOpen(false);
    },
    onError: () => toast.error('Thêm món thất bại'),
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number;
      data: IUpdatePantryMenuItemDto;
    }) => pantryMenuService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pantry-menu'] });
      toast.success('Cập nhật món thành công');
      setIsFormOpen(false);
    },
    onError: () => toast.error('Cập nhật món thất bại'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => pantryMenuService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pantry-menu'] });
      toast.success('Xóa món thành công');
    },
    onError: () => toast.error('Xóa món thất bại'),
  });

  const handleCreate = () => {
    setEditingItem(null);
    setIsFormOpen(true);
  };

  const handleEdit = (item: PantryMenuItem) => {
    setEditingItem(item);
    setIsFormOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm('Bạn có chắc chắn muốn xóa món này?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleFormSubmit = (
    data: ICreatePantryMenuItemDto | IUpdatePantryMenuItemDto,
  ) => {
    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, data });
    } else {
      createMutation.mutate(data as any);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col">
          <DialogHeader className="flex flex-row items-center justify-between">
            <DialogTitle>Quản lý Menu Pantry</DialogTitle>
            <Button onClick={handleCreate} size="sm" className="ml-auto mr-8">
              <Plus className="w-4 h-4 mr-1" />
              Thêm món
            </Button>
          </DialogHeader>

          <div className="flex-1 overflow-auto mt-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tên món</TableHead>
                  <TableHead>Giá</TableHead>
                  <TableHead>Loại</TableHead>
                  <TableHead className="w-[100px] text-right">Hành động</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>{item.price}</TableCell>
                    <TableCell>
                      {item.category === 'FOOD' ? 'Đồ ăn' : 'Đồ uống'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(item)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => handleDelete(item.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {items.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                      Chưa có món nào
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>

      <PantryMenuEditDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSubmit={handleFormSubmit}
        item={editingItem}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />
    </>
  );
}
