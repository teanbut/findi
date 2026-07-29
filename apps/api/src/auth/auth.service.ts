import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException('An account with that email already exists');

    const passwordHash = await bcrypt.hash(dto.password, 12);

    // NOTE: role-specific profile rows (CustomerProfile / SupplierProfile /
    // FundraisingOrganisation) are created here too, in the same transaction,
    // once the corresponding onboarding forms exist — see SuppliersService
    // for the supplier application flow this feeds into (feature spec §5.2).
    const user = await this.prisma.user.create({
      data: { email: dto.email, phone: dto.phone, passwordHash, role: dto.role },
    });

    return this.issueTokens(user.id, user.role);
  }

  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      throw new UnauthorizedException('Invalid email or password');
    }
    return this.issueTokens(user.id, user.role);
  }

  private issueTokens(userId: string, role: string) {
    const payload = { sub: userId, role };
    return {
      accessToken: this.jwt.sign(payload, { expiresIn: '15m' }),
      refreshToken: this.jwt.sign(payload, { expiresIn: '30d' }),
    };
  }
}
