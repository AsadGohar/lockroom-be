import { Module } from '@nestjs/common';
import { InvitesService } from './invites.service';
import { InvitesController } from './invites.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Invite } from './entities/invite.entity';
import { User } from 'src/users/entities/user.entity';
import { Group } from 'src/groups/entities/group.entity';
@Module({
  imports:[TypeOrmModule.forFeature([Invite, User, Group])],
  controllers: [InvitesController],
  providers: [InvitesService],
  exports:[InvitesService]
})
export class InvitesModule {}
