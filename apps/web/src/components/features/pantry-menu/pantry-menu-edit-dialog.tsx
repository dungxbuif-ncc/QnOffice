import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ICreatePantryMenuItemDto,
  IUpdatePantryMenuItemDto,
  PantryMenuCategory,
  PantryMenuItem,
} from '@qnoffice/shared';
import React, { useEffect, useState } from 'react';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: ICreatePantryMenuItemDto | IUpdatePantryMenuItemDto) => void;
  item: PantryMenuItem | null;
  isLoading?: boolean;
}

export function PantryMenuEditDialog({
  open,
  onOpenChange,
  onSubmit,
  item,
  isLoading,
}: Props) {
  const [formData, setFormData] = useState<ICreatePantryMenuItemDto>({
    name: '',
    price: '',
    category: PantryMenuCategory.FOOD,
  });

  useEffect(() => {
    if (item) {
      setFormData({
        name: item.name,
        price: item.price,
        category: item.category,
      });
    } else {
      setFormData({
        name: '',
        price: '',
        category: PantryMenuCategory.FOOD,
      });
    }
  }, [item, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {item ? 'Sửa món ăn' : 'Thêm món ăn mới'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Tên món
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="col-span-3"
              required
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="price" className="text-right">
              Giá
            </Label>
            <Input
              id="price"
              value={formData.price}
              onChange={(e) =>
                setFormData({ ...formData, price: e.target.value })
              }
              className="col-span-3"
              required
              placeholder="e.g. 5K, 12K"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="category" className="text-right">
              Loại
            </Label>
            <Select
              value={formData.category}
              onValueChange={(value: PantryMenuCategory) =>
                setFormData({ ...formData, category: value })
              }
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Chọn loại" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={PantryMenuCategory.FOOD}>Đồ ăn</SelectItem>
                <SelectItem value={PantryMenuCategory.DRINK}>Đồ uống</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Đang lưu...' : 'Lưu'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
