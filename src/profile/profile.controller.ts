import {
  Controller,
  Get,
  Put,
  Post,
  Delete,
  Req,
  Body,
  Param,
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
import { Query } from '@nestjs/common';


@UseGuards(JwtAuthGuard)
@Controller()
export class ProfileController {
  constructor(private service: ProfileService) { }


  // Existing: get own profile

  @Get('profile')
  getProfile(@Req() req) {
    return this.service.getProfile(req.user.sub);
  }

  @Get('profile/activity-heatmap')
  getHeatmap(@Req() req) {
    return this.service.getActivityHeatmap(req.user.sub);
  }

  @Put('profile')
  updateProfile(@Req() req, @Body() body) {
    return this.service.updateProfile(req.user.sub, body);
  }


  // get profile by username

  @Get('users/profile/:username')
  getProfileByUsername(
    @Param('username') username: string,
    @Req() req,
  ) {
    return this.service.getProfileByUsername(username, req.user.sub);
  }
  //search user by username
  @Get('users/search')
  search(@Query('q') q: string) {
    return this.service.searchUsers(q);
  }





  // Profile image upload
  @Post('profile/upload-image')
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
          cb(new BadRequestException('Only image files allowed'), false);
          return;
        }
        cb(null, true);
      },
      limits: { fileSize: 2 * 1024 * 1024 },
    }),
  )
  uploadImage(@UploadedFile() file: Express.Multer.File, @Req() req) {
    if (!file) {
      throw new BadRequestException('File not received');
    }
    return this.service.uploadImage(req.user.sub, file);
  }

  @Delete('profile/upload-image')
  deleteImage(@Req() req) {
    return this.service.deleteImage(req.user.sub);
  }
}
