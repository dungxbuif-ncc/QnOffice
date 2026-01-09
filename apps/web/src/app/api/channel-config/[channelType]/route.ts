import { ChannelConfigServerService } from '@/shared/services/server/channel-config-server-service';
import { NextRequest, NextResponse } from 'next/server';

const service = new ChannelConfigServerService();

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ channelType: string }> },
) {
  try {
    const { channelType } = await params;
    const config = await service.getConfig(channelType as any);
    return NextResponse.json(config);
  } catch (error) {
    console.error('Error fetching channel config:', error);
    return NextResponse.json(
      { error: 'Failed to fetch channel config' },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ channelType: string }> },
) {
  try {
    const { channelType } = await params;
    const body = await request.json();
    const config = await service.updateConfig(channelType as any, body);
    return NextResponse.json(config);
  } catch (error) {
    console.error('Error updating channel config:', error);
    return NextResponse.json(
      { error: 'Failed to update channel config' },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ channelType: string }> },
) {
  try {
    const { channelType } = await params;
    const result = await service.deleteConfig(channelType as any);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error deleting channel config:', error);
    return NextResponse.json(
      { error: 'Failed to delete channel config' },
      { status: 500 },
    );
  }
}
