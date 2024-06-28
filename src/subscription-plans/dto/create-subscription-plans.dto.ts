import {
  IsNotEmpty,
  IsString,
  Min
} from 'class-validator';
import { SubscriptionTypeEnum } from 'src/types/enums';

export class CreateSubscriptionPlanDto {
  @IsNotEmpty()
  @IsString()
  name: string

  @IsNotEmpty()
  @IsString()
  type: SubscriptionTypeEnum;

  @IsNotEmpty()
  @Min(1)
  days: number;

  @IsNotEmpty()
  @Min(1)
  price: number;
}
