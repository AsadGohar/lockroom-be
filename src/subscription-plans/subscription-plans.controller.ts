import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { SubscriptionsService } from './subscription-plans.service';
import { CreateSubscriptionPlanDto } from './dto/create-subscription-plans.dto';
import { UpdateSubscriptionPlanDto } from './dto/update-subscription-plans.dto';
import { AuthGuard } from 'src/guards/auth.guard';

@Controller('subscription-plans')
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Post()
  create(@Body() createSubscriptionDto: CreateSubscriptionPlanDto) {
    return this.subscriptionsService.create(createSubscriptionDto);
  }

  @UseGuards(AuthGuard)
  @Get()
  findAll() {
    return this.subscriptionsService.findAll();
  }

  @UseGuards(AuthGuard)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.subscriptionsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateSubscriptionDto: UpdateSubscriptionPlanDto) {
    return this.subscriptionsService.update(+id, updateSubscriptionDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.subscriptionsService.remove(+id);
  }
}
