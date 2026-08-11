"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JwtStrategy = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const passport_jwt_1 = require("passport-jwt");
const database_service_1 = require("../database/database.service");
const cookieExtractor = (req) => {
    if (req && req.cookies && req.cookies['access_token']) {
        return req.cookies['access_token'];
    }
    if (req && req.headers && req.headers.cookie) {
        const match = req.headers.cookie.match(/access_token=([^;]+)/);
        if (match)
            return match[1];
    }
    return null;
};
let JwtStrategy = class JwtStrategy extends (0, passport_1.PassportStrategy)(passport_jwt_1.Strategy) {
    dbService;
    constructor(dbService) {
        super({
            jwtFromRequest: passport_jwt_1.ExtractJwt.fromExtractors([
                cookieExtractor,
                passport_jwt_1.ExtractJwt.fromAuthHeaderAsBearerToken(),
            ]),
            ignoreExpiration: false,
            secretOrKey: process.env.JWT_SECRET || 'TLTSMN_SECRET_KEY_2026',
        });
        this.dbService = dbService;
    }
    async validate(payload) {
        const res = await this.dbService.query(`SELECT a.id, a.id_system, a.phone_number, a.role, p.id as profile_id, p.fullname, p.email, p.gender, p.schedule, p.notes, p.birth_year
       FROM auth_sys a
       LEFT JOIN profile p ON p.id_auth = a.id
       WHERE a.id = $1`, [payload.sub]);
        if (res.rows.length === 0) {
            throw new common_1.UnauthorizedException('Không tìm thấy tài khoản');
        }
        return res.rows[0];
    }
};
exports.JwtStrategy = JwtStrategy;
exports.JwtStrategy = JwtStrategy = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [database_service_1.DatabaseService])
], JwtStrategy);
//# sourceMappingURL=jwt.strategy.js.map