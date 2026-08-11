import { Strategy } from 'passport-jwt';
import { DatabaseService } from '../database/database.service';
declare const JwtStrategy_base: new (...args: [opt: import("passport-jwt").StrategyOptionsWithRequest] | [opt: import("passport-jwt").StrategyOptionsWithoutRequest]) => Strategy & {
    validate(...args: any[]): unknown;
};
export declare class JwtStrategy extends JwtStrategy_base {
    private readonly dbService;
    constructor(dbService: DatabaseService);
    validate(payload: any): Promise<any>;
}
export {};
