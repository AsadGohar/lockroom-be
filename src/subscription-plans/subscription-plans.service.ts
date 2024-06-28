import { Injectable } from '@nestjs/common';
import { CreateSubscriptionPlanDto } from './dto/create-subscription-plans.dto';
import { UpdateSubscriptionPlanDto } from './dto/update-subscription-plans.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { SubscriptionPlans } from './entities/subscription-plan.entity';
import { Repository } from 'typeorm';
import { SubscriptionTypeEnum } from 'src/types/enums';

@Injectable()
export class SubscriptionsService {
  constructor(
    @InjectRepository(SubscriptionPlans)
    private readonly subscriptionsRepository: Repository<SubscriptionPlans>,
  ) {}

  async create(createSubscriptionDto: CreateSubscriptionPlanDto) {
    const new_subscription = this.subscriptionsRepository.create(createSubscriptionDto);
    return await this.subscriptionsRepository.save(new_subscription);
  }

  async findAll() {
    return await this.subscriptionsRepository.find()
  }

  async findOne(id: string) {
    return await this.subscriptionsRepository.findOne({
      where: {
        id,
      },
    });
  }

  async findOneByType(type: SubscriptionTypeEnum) {
    return await this.subscriptionsRepository.findOne({
      where: {
       type,
      },
    });
  }

  update(id: number, updateSubscriptionDto: UpdateSubscriptionPlanDto) {
    return `This action updates a #${id} subscription`;
  }

  remove(id: number) {
    return `This action removes a #${id} subscription`;
  }
}
