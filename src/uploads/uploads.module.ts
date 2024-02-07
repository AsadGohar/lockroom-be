import { Module } from '@nestjs/common';
import { UploadController } from './uploads.controller';
import { UploadService } from './uploads.service';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';

@Module({
  imports: [
    ThrottlerModule.forRootAsync({
      useFactory: (configService: ConfigService) => ({
        throttlers: [
          {
            ttl: configService.getOrThrow('UPLOAD_RATE_TTL'),
            limit: configService.getOrThrow('UPLOAD_RATE_LIMIT'),
          },
        ],
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [UploadController],
  providers: [
    UploadService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class UploadsModule {}
