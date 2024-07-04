import { Module } from '@nestjs/common';
import { SubscriptionsService } from './subscription-plans.service';
import { SubscriptionsController } from './subscription-plans.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SubscriptionPlans } from 'src/subscription-plans/entities/subscription-plan.entity';
import { JwtService } from '@nestjs/jwt';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SubscriptionPlans
    ]),
  ],
  controllers: [SubscriptionsController],
  providers: [SubscriptionsService, JwtService],
})
export class SubscriptionPlansModule {}
