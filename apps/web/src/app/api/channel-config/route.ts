import { ChannelConfigServerService } from '@/shared/services/server/channel-config-server-service';
import { NextRequest, NextResponse } from 'next/server';

const service = new ChannelConfigServerService();

export async function GET() {
  try {
    const configs = await service.getAllConfigs();
    return NextResponse.json(configs);
  } catch (error) {
    console.error('Error fetching channel configs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch channel configs' },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const config = await service.configureChannel(body);
    return NextResponse.json(config);
  } catch (error) {
    console.error('Error configuring channel:', error);
    return NextResponse.json(
      { error: 'Failed to configure channel' },
      { status: 500 },
    );
  }
}
