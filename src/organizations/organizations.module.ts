import { Module } from '@nestjs/common';
import { OrganizationsService } from './organizations.service';
import { OrganizationsController } from './organizations.controller';
import { Organization } from './entities/organization.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Group } from 'src/groups/entities/group.entity';
import { Invite } from 'src/invites/entities/invite.entity';
import { JwtService } from '@nestjs/jwt';

@Module({
  imports:[TypeOrmModule.forFeature([Organization, Group, Invite])],
  controllers: [OrganizationsController],
  providers: [OrganizationsService, JwtService],
  exports:[OrganizationsService]
})
export class OrganizationsModule {}
