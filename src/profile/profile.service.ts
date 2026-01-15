import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import cloudinary from '../config/cloudinary.config';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class ProfileService {
  constructor(private prisma: PrismaService) {}

  async get(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        email: true,
        profile: true,
      },
    });

    if (!user) return null;

    return {
      email: user.email,
      ...(user.profile ?? {}),
    };
  }

  async save(userId: string, data: any) {
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

    const uploaded = await cloudinary.uploader.upload(file.path, {
      folder: 'fitfreak/profiles',
    });

    try {
      fs.unlinkSync(file.path);
    } catch (error) {
      console.error('Failed to delete local file:', error);
    }

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
      } catch (error) {
        console.error('Failed to delete Cloudinary image:', error);
      }
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
      const publicId = `${folder}/${filename.split('.')[0]}`;
      return publicId;
    } catch (error) {
      return null;
    }
  }
}