import { PartialType } from '@nestjs/mapped-types';
import { InviteDto } from './invite.dto';

export class PartialInviteDto extends PartialType(InviteDto) {}
