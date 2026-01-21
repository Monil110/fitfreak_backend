import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import admin from "../firebase/firebase-admin";
@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(email: string, password: string) {
    const existing = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existing) {
      throw new BadRequestException('Email already exists');
    }

    const hashed = await bcrypt.hash(password, 10);

    const user = await this.prisma.user.create({
      data: {
        email,
        password: hashed,
      },
    });

    return {
      access_token: this.jwtService.sign({
        sub: user.id,
        email: user.email,
      }),
    };
  }
  async firebaseLogin(firebaseToken: string) {
    const decoded = await admin.auth().verifyIdToken(firebaseToken);
  
    const email = decoded.email;
  
    if (!email) {
      throw new BadRequestException("Email not found in Firebase token");
    }
  
    let user = await this.prisma.user.findUnique({
      where: { email },
    });
  
    if (!user) {
      user = await this.prisma.user.create({
        data: {
          email,
          password: null,
        },
      });
      
    }
  
    const jwt = this.jwtService.sign({
      sub: user.id,
      email: user.email,
    });
  
    return {
      accessToken: jwt,
      user,
    };
  }
  

  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });
  
    if (!user) {
      throw new UnauthorizedException("Invalid credentials");
    }
  
    // IMPORTANT: block password login for OAuth users
    if (!user.password) {
      throw new UnauthorizedException("Use Google/GitHub login");
    }
  
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) {
      throw new UnauthorizedException("Invalid credentials");
    }
  
    return {
      access_token: this.jwtService.sign({
        sub: user.id,
        email: user.email,
      }),
    };
  }
  
}
