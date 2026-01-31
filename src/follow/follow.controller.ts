import { Controller, Post, Delete, Get, Param, UseGuards, Req } from '@nestjs/common';
import { FollowService } from './follow.service';
import { JwtAuthGuard } from '../auth/jwt.guard';


@Controller('follow')
@UseGuards(JwtAuthGuard)
export class FollowController {
    constructor(private readonly followService: FollowService) { }

    @Post(':username')
    async follow(
        @Param('username') username: string,
        @Req() req: any,
    ) {
        return this.followService.followUser(req.user.sub, username);
    }

    @Delete(':username')
    async unfollow(
        @Param('username') username: string,
        @Req() req: any,
    ) {
        return this.followService.unfollowUser(req.user.sub, username);
    }
    @Get('followers/:username')
    async followers(@Param('username') username: string) {
        return this.followService.getFollowers(username);
    }

    @Get('following/:username')
    async following(@Param('username') username: string) {
        return this.followService.getFollowing(username);
    }
    @Get('count/:username')
    async counts(@Param('username') username: string) {
        return this.followService.getFollowCounts(username);
    }
    @Get('requests')
    getRequests(@Req() req: any) {
        return this.followService.getFollowRequests(req.user.sub);
    }

    @Post('requests/:id/accept')
    acceptRequest(
        @Param('id') id: string,
        @Req() req: any,
    ) {
        return this.followService.acceptFollowRequest(req.user.sub, id);
    }

    @Delete('requests/:id')
    rejectRequest(
        @Param('id') id: string,
        @Req() req: any,
    ) {
        return this.followService.rejectFollowRequest(req.user.sub, id);
    }


    @Get('status/:username')
    async status(
        @Param('username') username: string,
        @Req() req: any,
    ) {
        const following = await this.followService.isFollowing(req.user.sub, username);
        return { following };
    }
}
