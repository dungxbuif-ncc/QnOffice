export class CreateBranchDto {
  name: string;
  code: string;
  address?: string;
}

export class UpdateBranchDto {
  name?: string;
  code?: string;
  address?: string;
}
