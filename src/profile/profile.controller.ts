import {
  Controller,
  Get,
  Put,
  Post,
  Delete,
  Req,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { ProfileService } from './profile.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';

@UseGuards(JwtAuthGuard)
@Controller('profile')
export class ProfileController {
  constructor(private service: ProfileService) {}

  @Get()
  get(@Req() req) {
    return this.service.get(req.user.userId);
  }

  @Post('upload-image')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/profile',
        filename: (req, file, cb) => {
          const ext = extname(file.originalname);
          const filename = `${Date.now()}-${Math.random()
            .toString(36)
            .substring(2)}${ext}`;
          cb(null, filename);
        },
      }),
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.startsWith('image/')) {
          cb(new Error('Only image files allowed'), false);
        }
        cb(null, true);
      },
      limits: { fileSize: 2 * 1024 * 1024 },
    }),
  )
  async uploadImage(@UploadedFile() file: Express.Multer.File, @Req() req) {
    if (!file) {
      throw new BadRequestException('File not received');
    }

    return this.service.uploadImage(req.user.userId, file);
  }

  @Delete('upload-image')
  deleteImage(@Req() req) {
    return this.service.deleteImage(req.user.userId);
  }

  @Put()
  save(@Req() req, @Body() body) {
    return this.service.save(req.user.userId, body);
  }
}
