import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import cloudinary from '../config/cloudinary.config';
import * as fs from 'fs';

@Injectable()
export class ProfileService {
  constructor(private prisma: PrismaService) {}

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
      const day = w.date.toISOString().split("T")[0];
  
      if (!heatmap[day]) {
        heatmap[day] = 0;
      }
  
      heatmap[day] += w.sets * w.reps;
    }
  
    return heatmap;
  }
  
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
  
    const profileComplete = Boolean(
      user.profile?.firstName &&
      user.profile?.lastName &&
      user.profile?.age
    );
  
    const followers = 1234;
    const following = 567;
  
    return {
      email: user.email,
      firstName: user.profile?.firstName ?? "",
      lastName: user.profile?.lastName ?? "",
      countryCode: user.profile?.countryCode ?? "+1",
      phone: user.profile?.phone ?? "",
      gender: user.profile?.gender ?? "",
      age: user.profile?.age ?? null,
      height: user.profile?.height ?? null,
      weight: user.profile?.weight ?? null,
      bio: user.profile?.bio ?? "",
      imageUrl: user.profile?.imageUrl ?? null,
      profileComplete,
      socialStats: {
        posts: user.workouts.length,
        followers,
        following,
      },
    };
  }

  async updateProfile(userId: string, data: any) {
    // Remove email if it's in the data (email shouldn't be updated here)
    if ('email' in data) {
      delete data.email;
    }

    return this.prisma.profile.upsert({
      where: { userId },
      update: data,
      create: { ...data, userId },
    });
  }

  async uploadImage(userId: string, file: Express.Multer.File) {
    // Check if user already has a profile image and delete it from Cloudinary
    const profile = await this.prisma.profile.findUnique({
      where: { userId },
    });

    if (profile?.imageUrl) {
      const publicId = this.extractPublicId(profile.imageUrl);
      if (publicId) {
        try {
          await cloudinary.uploader.destroy(publicId);
        } catch (error) {
          console.error('Failed to delete old Cloudinary image:', error);
        }
      }
    }

    // Upload new image to Cloudinary
    const uploaded = await cloudinary.uploader.upload(file.path, {
      folder: 'fitfreak/profiles',
    });

    // Delete local file after upload
    try {
      fs.unlinkSync(file.path);
    } catch (error) {
      console.error('Failed to delete local file:', error);
    }

    // Update profile with new image URL
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

    // Delete image from Cloudinary
    const publicId = this.extractPublicId(profile.imageUrl);
    if (publicId) {
      try {
        await cloudinary.uploader.destroy(publicId);
      } catch (error) {
        console.error('Failed to delete Cloudinary image:', error);
      }
    }

    // Remove image URL from database
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
      const publicId = `${folder}/${filename.split('.')[0]}`;
      return publicId;
    } catch (error) {
      return null;
    }
  }
}