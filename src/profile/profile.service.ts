import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import cloudinary from '../config/cloudinary.config';
import * as fs from 'fs';

@Injectable()
export class ProfileService {
  constructor(private prisma: PrismaService) { }

  private isProfileComplete(profile: any) {
    return (
      profile?.firstName &&
      profile?.lastName &&
      profile?.age
    );
  }

  async getActivityHeatmap(userId: string) {
    const workouts = await this.prisma.workout.findMany({
      where: { userId },
      select: {
        date: true,
        sets: true,
        reps: true,
      },
    });

    const heatmap: Record<string, number> = {};

    for (const w of workouts) {
      const day = w.date.toISOString().split('T')[0];

      if (!heatmap[day]) {
        heatmap[day] = 0;
      }

      heatmap[day] += w.sets * w.reps;
    }

    return heatmap;
  }

  // =========================
  // EXISTING: profile by userId
  // =========================
  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        workouts: true,
      },
    });

    if (!user) {
      return null;
    }

    const profileComplete = this.isProfileComplete(user.profile);

    const [followers, following] = await Promise.all([
      this.prisma.follow.count({
        where: { followingId: user.id },
      }),
      this.prisma.follow.count({
        where: { followerId: user.id },
      }),
    ]);

    return {
      email: user.email,
      firstName: user.profile?.firstName ?? '',
      lastName: user.profile?.lastName ?? '',
      countryCode: user.profile?.countryCode ?? '+1',
      phone: user.profile?.phone ?? '',
      gender: user.profile?.gender ?? '',
      age: user.profile?.age ?? null,
      height: user.profile?.height ?? null,
      weight: user.profile?.weight ?? null,
      bio: user.profile?.bio ?? '',
      imageUrl: user.profile?.imageUrl ?? null,
      profileComplete,
      socialStats: {
        posts: user.workouts.length,
        followers,
        following,
      },
    };
  }

  // =========================
  // NEW: profile by username (STEP 9)
  // =========================
  async getProfileByUsername(username: string, viewerId: string) {
    const user = await this.prisma.user.findUnique({
      where: { username },
      include: {
        profile: true,
        workouts: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const profileComplete = this.isProfileComplete(user.profile);

    const [followers, following, isFollowing] = await Promise.all([
      this.prisma.follow.count({
        where: { followingId: user.id },
      }),
      this.prisma.follow.count({
        where: { followerId: user.id },
      }),
      this.prisma.follow.findUnique({
        where: {
          followerId_followingId: {
            followerId: viewerId,
            followingId: user.id,
          },
        },
      }),
    ]);

    return {
      id: user.id,
      username: user.username,
      email: user.email,
      firstName: user.profile?.firstName ?? '',
      lastName: user.profile?.lastName ?? '',
      gender: user.profile?.gender ?? '',
      age: user.profile?.age ?? null,
      height: user.profile?.height ?? null,
      weight: user.profile?.weight ?? null,
      bio: user.profile?.bio ?? '',
      imageUrl: user.profile?.imageUrl ?? null,
      createdAt: user.createdAt,
      profileComplete,
      socialStats: {
        posts: user.workouts.length,
        followers,
        following,
      },
      isFollowing: !!isFollowing,
    };
  }

  async updateProfile(userId: string, data: any) {
    if ('email' in data) {
      delete data.email;
    }

    return this.prisma.profile.upsert({
      where: { userId },
      update: data,
      create: { ...data, userId },
    });
  }
  async searchUsers(query: string) {
    if (!query || query.trim().length < 2) {
      return [];
    }

    return this.prisma.user.findMany({
      where: {
        username: {
          contains: query.toLowerCase(),
          mode: 'insensitive',
        },
      },
      select: {
        id: true,
        username: true,
        profile: {
          select: {
            firstName: true,
            lastName: true,
            imageUrl: true,
          },
        },
      },
      take: 10,
    });
  }


  async uploadImage(userId: string, file: Express.Multer.File) {
    const profile = await this.prisma.profile.findUnique({
      where: { userId },
    });

    if (profile?.imageUrl) {
      const publicId = this.extractPublicId(profile.imageUrl);
      if (publicId) {
        try {
          await cloudinary.uploader.destroy(publicId);
        } catch { }
      }
    }

    const uploaded = await cloudinary.uploader.upload(file.path, {
      folder: 'fitfreak/profiles',
    });

    try {
      fs.unlinkSync(file.path);
    } catch { }

    const updatedProfile = await this.prisma.profile.upsert({
      where: { userId },
      update: {
        imageUrl: uploaded.secure_url,
      },
      create: {
        userId,
        imageUrl: uploaded.secure_url,
      },
    });

    return {
      imageUrl: updatedProfile.imageUrl,
    };
  }

  async deleteImage(userId: string) {
    const profile = await this.prisma.profile.findUnique({
      where: { userId },
    });

    if (!profile?.imageUrl) {
      return { message: 'No image to delete' };
    }

    const publicId = this.extractPublicId(profile.imageUrl);
    if (publicId) {
      try {
        await cloudinary.uploader.destroy(publicId);
      } catch { }
    }

    await this.prisma.profile.update({
      where: { userId },
      data: {
        imageUrl: null,
      },
    });

    return { message: 'Image deleted successfully' };
  }


  private extractPublicId(imageUrl: string): string | null {
    try {
      const parts = imageUrl.split('/');
      const filename = parts[parts.length - 1];
      const folder = parts[parts.length - 2];
      return `${folder}/${filename.split('.')[0]}`;
    } catch {
      return null;
    }
  }
}
