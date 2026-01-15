export interface PantryTransaction {
  chain_id: string;
  hash: string;
  nonce: number;
  block_hash: string;
  block_number: number;
  from_address: string;
  to_address: string;
  value: string;
  transaction_type: number;
  status: number;
  transaction_timestamp: number;
  text_data: string;
  transaction_extra_info_type: string;
}

export interface PantryTransactionResponse {
  meta: {
    chain_id: number;
    page: number;
    limit: number;
    total_items: number;
    total_pages: number;
  };
  data: PantryTransaction[];
}

export interface PantryTransactionWithUser extends PantryTransaction {
  userName?: string;
  userEmail?: string;
  userAvatar?: string;
  amountInDong: number;
}

export interface PaginatedPantryTransactionResponse {
  data: PantryTransactionWithUser[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
