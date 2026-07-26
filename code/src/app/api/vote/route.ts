// filepath: src/app/api/vote/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { pusherServer } from '@/lib/pusher';
import { auth } from '@/app/api/auth/[...nextauth]/route';

export async function POST(request: NextRequest) {
  try {
    // Check if user is authenticated
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'You must be logged in to vote' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { argumentId, vote, voteType = 'item', argumentSupportId } = body;
    const itemId = argumentId;

    if (!vote || (vote !== 'for' && vote !== 'against')) {
      return NextResponse.json(
        { error: 'Invalid vote value' },
        { status: 400 }
      );
    }

    if (voteType === 'support' && !argumentSupportId) {
      return NextResponse.json(
        { error: 'Missing support relationship id' },
        { status: 400 }
      );
    }

    if (voteType === 'support') {
      const existingSupportVote = await prisma.supportVote.findFirst({
        where: {
          userId: session.user.id,
          argumentSupportId,
        },
      });

      if (existingSupportVote) {
        return NextResponse.json(
          { error: 'You have already voted on this support relationship' },
          { status: 409 }
        );
      }

      const [, argumentSupport] = await prisma.$transaction([
        prisma.supportVote.create({
          data: {
            userId: session.user.id,
            argumentSupportId,
            vote,
          },
        }),
        prisma.argumentSupport.update({
          where: { id: argumentSupportId },
          data: vote === 'for'
            ? { votesFor: { increment: 1 } }
            : { votesAgainst: { increment: 1 } },
        }),
      ]);

      return NextResponse.json({
        success: true,
        votesFor: argumentSupport.votesFor,
        votesAgainst: argumentSupport.votesAgainst,
      });
    }

    if (!itemId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const existingVote = await prisma.vote.findUnique({
      where: {
        userId_itemId: {
          userId: session.user.id,
          itemId,
        },
      },
    });

    if (existingVote) {
      return NextResponse.json(
        { error: 'You have already voted on this argument' },
        { status: 409 }
      );
    }

    const [, item] = await prisma.$transaction([
      prisma.vote.create({
        data: {
          userId: session.user.id,
          itemId,
          vote,
        },
      }),
      prisma.item.update({
        where: { id: itemId },
        data: vote === 'for'
          ? { votesFor: { increment: 1 } }
          : { votesAgainst: { increment: 1 } },
        include: { parent: true }
      }),
    ]);

    // Trigger Pusher event for real-time updates
    try {
      await pusherServer.trigger(
        `debate-${item.parentId}`,
        'vote-update',
        {
          argumentId: itemId,
          votesFor: item.votesFor,
          votesAgainst: item.votesAgainst
        }
      );
    } catch (pusherError) {
      // Log but don't fail if Pusher is not configured
      console.log('Pusher update skipped:', pusherError);
    }

    return NextResponse.json({
      success: true,
      votesFor: item.votesFor,
      votesAgainst: item.votesAgainst
    });
  } catch (error) {
    console.error('Vote error:', error);
    return NextResponse.json(
      { error: 'Failed to record vote' },
      { status: 500 }
    );
  }
}