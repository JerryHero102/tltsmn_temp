"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const bcrypt = __importStar(require("bcryptjs"));
const database_service_1 = require("../database/database.service");
let AuthService = class AuthService {
    dbService;
    jwtService;
    constructor(dbService, jwtService) {
        this.dbService = dbService;
        this.jwtService = jwtService;
    }
    async validateUser(id_system_or_phone, pass) {
        const res = await this.dbService.query(`SELECT a.id, a.id_system, a.phone_number, a.password_hash, a.role, p.id as profile_id, p.fullname, p.email, p.gender, p.schedule, p.notes, p.birth_year
       FROM auth_sys a
       LEFT JOIN profile p ON p.id_auth = a.id
       WHERE a.id_system = $1 OR a.phone_number = $1`, [id_system_or_phone]);
        if (res.rows.length === 0) {
            throw new common_1.UnauthorizedException('Mã người dùng hoặc mật khẩu không chính xác');
        }
        const user = res.rows[0];
        const isMatch = await bcrypt.compare(pass, user.password_hash);
        if (!isMatch) {
            throw new common_1.UnauthorizedException('Mã người dùng hoặc mật khẩu không chính xác');
        }
        const { password_hash, ...result } = user;
        return result;
    }
    async login(user) {
        const payload = {
            sub: user.id,
            id_system: user.id_system,
            phone_number: user.phone_number,
            role: user.role,
        };
        return {
            access_token: this.jwtService.sign(payload),
            user: {
                id: user.id,
                id_system: user.id_system,
                phone_number: user.phone_number,
                role: user.role,
                profile: {
                    id: user.profile_id,
                    fullname: user.fullname || 'Người dùng',
                    email: user.email,
                    gender: user.gender,
                    schedule: user.schedule,
                    notes: user.notes,
                    birth_year: user.birth_year,
                },
            },
        };
    }
    async getProfile(userId) {
        const res = await this.dbService.query(`SELECT a.id, a.id_system, a.phone_number, a.role, p.id as profile_id, p.fullname, p.email, p.gender, p.schedule, p.notes, p.birth_year
       FROM auth_sys a
       LEFT JOIN profile p ON p.id_auth = a.id
       WHERE a.id = $1`, [userId]);
        if (res.rows.length === 0) {
            throw new common_1.UnauthorizedException('Không tìm thấy thông tin tài khoản');
        }
        const user = res.rows[0];
        return {
            id: user.id,
            id_system: user.id_system,
            phone_number: user.phone_number,
            role: user.role,
            profile: {
                id: user.profile_id,
                fullname: user.fullname || 'Người dùng',
                email: user.email,
                gender: user.gender,
                schedule: user.schedule,
                notes: user.notes,
                birth_year: user.birth_year,
            },
        };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [database_service_1.DatabaseService,
        jwt_1.JwtService])
], AuthService);
//# sourceMappingURL=auth.service.js.map