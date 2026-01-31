import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FollowService {
    constructor(private prisma: PrismaService) { }

    async followUser(followerId: string, followingUsername: string) {
        const followingUser = await this.prisma.user.findUnique({
            where: { username: followingUsername },
        });

        if (!followingUser) {
            throw new NotFoundException('User not found');
        }

        if (followingUser.id === followerId) {
            throw new BadRequestException('Cannot follow yourself');
        }

        const exists = await this.prisma.follow.findUnique({
            where: {
                followerId_followingId: {
                    followerId,
                    followingId: followingUser.id,
                },
            },
        });

        if (exists) {
            throw new BadRequestException('Already following');
        }

        return this.prisma.follow.create({
            data: {
                followerId,
                followingId: followingUser.id,
            },
        });
    }

    async unfollowUser(followerId: string, followingUsername: string) {
        const followingUser = await this.prisma.user.findUnique({
            where: { username: followingUsername },
        });

        if (!followingUser) {
            throw new NotFoundException('User not found');
        }

        const follow = await this.prisma.follow.findUnique({
            where: {
                followerId_followingId: {
                    followerId,
                    followingId: followingUser.id,
                },
            },
        });

        if (!follow) {
            throw new BadRequestException('Not following this user');
        }

        await this.prisma.follow.delete({
            where: {
                id: follow.id,
            },
        });

        return { success: true };
    }

    async isFollowing(followerId: string, followingUsername: string) {
        const followingUser = await this.prisma.user.findUnique({
            where: { username: followingUsername },
        });

        if (!followingUser) {
            return false;
        }

        const follow = await this.prisma.follow.findUnique({
            where: {
                followerId_followingId: {
                    followerId,
                    followingId: followingUser.id,
                },
            },
        });

        return !!follow;
    }
    async getFollowers(username: string) {
        const user = await this.prisma.user.findUnique({
            where: { username },
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        const followers = await this.prisma.follow.findMany({
            where: {
                followingId: user.id,
            },
            include: {
                follower: {
                    select: {
                        id: true,
                        username: true,
                        email: true,
                    },
                },
            },
        });

        return followers.map(f => f.follower);
    }

    async getFollowing(username: string) {
        const user = await this.prisma.user.findUnique({
            where: { username },
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        const following = await this.prisma.follow.findMany({
            where: {
                followerId: user.id,
            },
            include: {
                following: {
                    select: {
                        id: true,
                        username: true,
                        email: true,
                    },
                },
            },
        });

        return following.map(f => f.following);
    }
    async getFollowCounts(username: string) {
        const user = await this.prisma.user.findUnique({
            where: { username },
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        const [followers, following] = await Promise.all([
            this.prisma.follow.count({
                where: { followingId: user.id },
            }),
            this.prisma.follow.count({
                where: { followerId: user.id },
            }),
        ]);

        return {
            followers,
            following,
        };
    }


}
