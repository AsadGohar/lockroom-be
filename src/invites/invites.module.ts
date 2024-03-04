import { Module } from '@nestjs/common';
import { InvitesService } from './invites.service';
import { InvitesController } from './invites.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Invite } from './entities/invite.entity';
import { User } from 'src/users/entities/user.entity';
import { Group } from 'src/groups/entities/group.entity';
import { JwtService } from '@nestjs/jwt';
import { Organization } from 'src/organizations/entities/organization.entity';
import { GroupsService } from 'src/groups/groups.service';
@Module({
  imports:[TypeOrmModule.forFeature([Invite, User, Group, Organization])],
  controllers: [InvitesController],
  providers: [InvitesService, JwtService, GroupsService],
  exports:[InvitesService]
})
export class InvitesModule {}
