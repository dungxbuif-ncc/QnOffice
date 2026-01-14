export enum EventStatus {
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum CycleStatus {
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  DRAFT = 'DRAFT',
}

export enum AssignmentStatus {
  SCHEDULED = 'scheduled',
  COMPLETED = 'completed',
  SWAPPED = 'swapped',
  CANCELLED = 'cancelled',
  SKIPPED = 'skipped',
}

export enum OpentalkSlideStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export enum OpentalkSlideType {
  FILE = 'file',
  LINK = 'link',
}
