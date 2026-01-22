import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  PantryTransactionResponse,
  PantryTransactionWithUser,
} from '@qnoffice/shared';
import { AppPaginationDto } from '@src/common/dtos/paginate.dto';
import UserEntity from '@src/modules/user/user.entity';
import axios from 'axios';
import { MmnClient } from 'mmn-client-js';
import { Repository } from 'typeorm';
import { addressMap } from './constants';

@Injectable()
export class PantryTransactionService {
  private readonly logger = new Logger(PantryTransactionService.name);
  private readonly indexerApiUrl = 'https://dong.mezon.ai/indexer-api';
  private readonly recipientAddress =
    '9c56GKBKRjRn5BQNPGk7VyikrrS7un61DkGaUPGaPSag';
  private readonly chainId = 1337;
  private readonly mmnClient: MmnClient;

  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {
    this.mmnClient = new MmnClient({
      baseUrl: 'https://dong.mezon.ai',
      timeout: 30000,
    });
  }

  async getTransactions(
    page: number = 1,
    limit: number = 10,
    startTime?: string,
    endTime?: string,
  ): Promise<AppPaginationDto<PantryTransactionWithUser>> {
    try {
      const params: any = {
        page: page - 1,
        limit,
        sort_by: 'transaction_timestamp',
        sort_order: 'desc',
        filter_to_address: this.recipientAddress,
      };

      if (startTime) params.start_time = startTime;
      if (endTime) params.end_time = endTime;

      const url = `${this.indexerApiUrl}/${this.chainId}/transactions`;
      this.logger.log(`Fetching transactions from: ${url}`);
      this.logger.log(`Params: ${JSON.stringify(params)}`);

      const response = await axios.get<PantryTransactionResponse>(url, {
        params,
      });

      this.logger.log(`Indexer API response meta:`, response.data.meta);
      const transactions = response.data.data;

      const users = await this.userRepository.find();

      // Create a map of address to user by converting userId to address
      const addressToUserMap = new Map<string, UserEntity>();
      for (const user of users) {
        try {
          const address = this.mmnClient.getAddressFromUserId(user.mezonId);
          addressToUserMap.set(address, user);
        } catch (error) {
          this.logger.warn(
            `Failed to convert userId ${user.mezonId} to address: ${error.message}`,
          );
        }
      }

      const mezonIdToUserMap = new Map(users.map((u) => [u.mezonId, u]));

      const enrichedTransactions: PantryTransactionWithUser[] =
        transactions.map((transaction) => {
          let user = addressToUserMap.get(transaction.from_address);
          let userName: string | undefined;
          let userEmail: string | undefined;
          let userAvatar: string | undefined;

          if (user) {
            userName = user.name;
            userEmail = user.email;
            userAvatar = user.avatar;
          } else if (addressMap[transaction.from_address]) {
            // Fallback: check addressMap
            const mappedData = addressMap[transaction.from_address];
            const dbUser = mezonIdToUserMap.get(mappedData.mezonId);

            if (dbUser) {
              // User found in database via addressMap mezonId
              userName = dbUser.name;
              userEmail = dbUser.email;
              userAvatar = dbUser.avatar;
              this.logger.debug(
                `Found user in DB via addressMap for ${transaction.from_address}`,
              );
            } else {
              // User not in database, use addressMap data directly
              userName = mappedData.username;
              userAvatar = mappedData.avatar;
              this.logger.debug(
                `Using addressMap data directly for ${transaction.from_address}`,
              );
            }
          }

          const amountInDong = parseInt(transaction.value) / 1_000_000;
          return {
            ...transaction,
            userName,
            userEmail,
            userAvatar,
            amountInDong,
          };
        });

      const result: AppPaginationDto<PantryTransactionWithUser> = {
        page: response.data.meta.page,
        pageSize: response.data.meta.limit,
        total: response.data.meta.total_items,
        result: enrichedTransactions,
      };

      this.logger.log(
        `Returning ${enrichedTransactions.length} transactions, page ${result.page} of ${Math.ceil(result.total / result.pageSize)}`,
      );
      return result;
    } catch (error) {
      this.logger.error('Failed to fetch transactions:', error);
      throw error;
    }
  }

  async getTransactionStats(
    startTime?: string,
    endTime?: string,
  ): Promise<{
    totalTransactions: number;
    totalAmount: number;
    uniqueContributors: number;
  }> {
    try {
      const params: any = {
        page: 0,
        limit: 1000,
        sort_by: 'transaction_timestamp',
        sort_order: 'desc',
        filter_to_address: this.recipientAddress,
      };

      if (startTime) params.start_time = startTime;
      if (endTime) params.end_time = endTime;

      const url = `${this.indexerApiUrl}/${this.chainId}/transactions`;
      const response = await axios.get<PantryTransactionResponse>(url, {
        params,
      });

      const transactions = response.data.data;
      const totalAmount = transactions.reduce(
        (sum, t) => sum + parseInt(t.value) / 1_000_000,
        0,
      );
      const uniqueContributors = new Set(
        transactions.map((t) => t.from_address),
      ).size;

      return {
        totalTransactions: response.data.meta.total_items,
        totalAmount,
        uniqueContributors,
      };
    } catch (error) {
      this.logger.error('Failed to fetch transaction stats:', error);
      throw error;
    }
  }
}
