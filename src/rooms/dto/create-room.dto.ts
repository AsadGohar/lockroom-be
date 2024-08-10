import { IsNotEmpty, IsString } from 'class-validator';
import { Group } from 'src/groups/entities/group.entity';
import { Invite } from 'src/invites/entities/invite.entity';
import { Organization } from 'src/organizations/entities/organization.entity';

export class CreateRoomDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  organization: Organization;

  @IsNotEmpty()
  groups: Group[];

  @IsNotEmpty()
  invites: Invite[] | [];
}
