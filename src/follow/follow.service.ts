import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FollowService {
    constructor(private prisma: PrismaService) { }

    // =========================
    // FOLLOW USER
    // =========================
    async followUser(followerId: string, followingUsername: string) {
        const target = await this.prisma.user.findUnique({
            where: { username: followingUsername },
        });

        if (!target) {
            throw new NotFoundException('User not found');
        }

        if (target.id === followerId) {
            throw new BadRequestException('Cannot follow yourself');
        }

        // already following?
        const alreadyFollowing = await this.prisma.follow.findUnique({
            where: {
                followerId_followingId: {
                    followerId,
                    followingId: target.id,
                },
            },
        });

        if (alreadyFollowing) {
            throw new BadRequestException('Already following');
        }

        // PRIVATE ACCOUNT → FOLLOW REQUEST
        if (target.isPrivate) {
            const existingRequest = await this.prisma.followRequest.findUnique({
                where: {
                    requesterId_targetId: {
                        requesterId: followerId,
                        targetId: target.id,
                    },
                },
            });

            if (existingRequest) {
                throw new BadRequestException('Follow request already sent');
            }

            await this.prisma.followRequest.create({
                data: {
                    requesterId: followerId,
                    targetId: target.id,
                },
            });

            return { requested: true };
        }

        // PUBLIC ACCOUNT → FOLLOW DIRECTLY
        await this.prisma.follow.create({
            data: {
                followerId,
                followingId: target.id,
            },
        });

        return { following: true };
    }

    // =========================
    // UNFOLLOW USER
    // =========================
    async unfollowUser(followerId: string, followingUsername: string) {
        const target = await this.prisma.user.findUnique({
            where: { username: followingUsername },
        });

        if (!target) {
            throw new NotFoundException('User not found');
        }

        // delete follow if exists
        const follow = await this.prisma.follow.findUnique({
            where: {
                followerId_followingId: {
                    followerId,
                    followingId: target.id,
                },
            },
        });

        if (follow) {
            await this.prisma.follow.delete({
                where: { id: follow.id },
            });

            return { unfollowed: true };
        }

        // also delete pending follow request (important edge case)
        const request = await this.prisma.followRequest.findUnique({
            where: {
                requesterId_targetId: {
                    requesterId: followerId,
                    targetId: target.id,
                },
            },
        });

        if (request) {
            await this.prisma.followRequest.delete({
                where: { id: request.id },
            });

            return { requestCancelled: true };
        }

        throw new BadRequestException('Not following this user');
    }

    // CHECK FOLLOW STATUS
    async isFollowing(followerId: string, followingUsername: string) {
        const target = await this.prisma.user.findUnique({
            where: { username: followingUsername },
        });

        if (!target) {
            return false;
        }

        const follow = await this.prisma.follow.findUnique({
            where: {
                followerId_followingId: {
                    followerId,
                    followingId: target.id,
                },
            },
        });

        return !!follow;
    }

    // GET FOLLOWERS LIST
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

    // GET FOLLOWING LIST
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

    // GET FOLLOW COUNTS
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
    // =========================
    // LIST INCOMING FOLLOW REQUESTS
    // =========================
    async getFollowRequests(userId: string) {
        return this.prisma.followRequest.findMany({
            where: {
                targetId: userId,
            },
            include: {
                requester: {
                    select: {
                        id: true,
                        username: true,
                        email: true,
                        profile: {
                            select: {
                                imageUrl: true,
                                firstName: true,
                                lastName: true,
                            },
                        },
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });
    }

    // =========================
    // ACCEPT FOLLOW REQUEST
    // =========================
    async acceptFollowRequest(userId: string, requestId: string) {
        const request = await this.prisma.followRequest.findUnique({
            where: { id: requestId },
        });

        if (!request || request.targetId !== userId) {
            throw new BadRequestException('Invalid follow request');
        }

        // create follow
        await this.prisma.follow.create({
            data: {
                followerId: request.requesterId,
                followingId: request.targetId,
            },
        });

        // delete request
        await this.prisma.followRequest.delete({
            where: { id: requestId },
        });

        return { accepted: true };
    }

    // =========================
    // REJECT FOLLOW REQUEST
    // =========================
    async rejectFollowRequest(userId: string, requestId: string) {
        const request = await this.prisma.followRequest.findUnique({
            where: { id: requestId },
        });

        if (!request || request.targetId !== userId) {
            throw new BadRequestException('Invalid follow request');
        }

        await this.prisma.followRequest.delete({
            where: { id: requestId },
        });

        return { rejected: true };
    }

}
