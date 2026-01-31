import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import admin from '../firebase/firebase-admin';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) { }

  async register(email: string, password: string, username: string) {
    const existing = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existing) {
      throw new BadRequestException('Email already exists');
    }

    username = username.toLowerCase();

    if (!/^[a-z0-9_]{3,20}$/.test(username)) {
      throw new BadRequestException('Invalid username');
    }

    const reserved = ['admin', 'support', 'fitfreak'];
    if (reserved.includes(username)) {
      throw new BadRequestException('Username not allowed');
    }

    const usernameExists = await this.prisma.user.findUnique({
      where: { username },
    });

    if (usernameExists) {
      throw new BadRequestException('Username already taken');
    }

    const hashed = await bcrypt.hash(password, 10);

    const user = await this.prisma.user.create({
      data: {
        email,
        password: hashed,
        username,
      },
    });

    return {
      access_token: this.jwtService.sign({
        sub: user.id,
        email: user.email,
      }),
    };
  }

  async firebaseLogin(firebaseToken: string, username: string) {
    const decoded = await admin.auth().verifyIdToken(firebaseToken);

    const email = decoded.email;

    if (!email) {
      throw new BadRequestException('Email not found in Firebase token');
    }

    let user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      username = username.toLowerCase();

      if (!/^[a-z0-9_]{3,20}$/.test(username)) {
        throw new BadRequestException('Invalid username');
      }

      const usernameExists = await this.prisma.user.findUnique({
        where: { username },
      });

      if (usernameExists) {
        throw new BadRequestException('Username already taken');
      }

      user = await this.prisma.user.create({
        data: {
          email,
          password: null,
          username,
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
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.password) {
      throw new UnauthorizedException('Use Google/GitHub login');
    }

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return {
      access_token: this.jwtService.sign({
        sub: user.id,
        email: user.email,
      }),
    };
  }
}
