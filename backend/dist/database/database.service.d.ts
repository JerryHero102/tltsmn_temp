import { OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Pool } from 'pg';
export declare class DatabaseService implements OnModuleInit, OnModuleDestroy {
    private pool;
    onModuleInit(): void;
    onModuleDestroy(): Promise<void>;
    query(text: string, params?: any[]): Promise<import("pg").QueryResult<any>>;
    getPool(): Pool;
}
