import { ChannelConfigServerService } from '@/shared/services/server/channel-config-server-service';
import { NextRequest, NextResponse } from 'next/server';

const service = new ChannelConfigServerService();

export async function GET(
  _request: NextRequest,
  { params }: { params: { channelType: string } },
) {
  try {
    const config = await service.getConfig(params.channelType as any);
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
  { params }: { params: { channelType: string } },
) {
  try {
    const body = await request.json();
    const config = await service.updateConfig(params.channelType as any, body);
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
  { params }: { params: { channelType: string } },
) {
  try {
    const result = await service.deleteConfig(params.channelType as any);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error deleting channel config:', error);
    return NextResponse.json(
      { error: 'Failed to delete channel config' },
      { status: 500 },
    );
  }
}
