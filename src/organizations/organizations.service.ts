import { Injectable, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Organization } from './entities/organization.entity';
import { Invite } from 'src/invites/entities/invite.entity';

@Injectable()
export class OrganizationsService {
  constructor(
    @InjectRepository(Organization)
    private readonly orgRepository: Repository<Organization>,
    @InjectRepository(Invite)
    private readonly inviteRepository: Repository<Invite>,
  ) {}

  async findOne(id: string) {
    return await this.orgRepository.findOne({
      relations: ['groups'],
      where: {
        id,
      },
    });
  }

  async getUsersByOrganization(organization_id: string) {
    try {
      const find_org = await this.orgRepository.findOne({
        relations: ['creator', 'users', 'groups.users'],
        where: [
          {
            id: organization_id,
          },
        ],
      });
      const find_invites = await this.inviteRepository.find({
        relations:['sender'],
        where: {
          organization: {
            id: organization_id,
          },
          status:'pending'
        },
      });
      if (!find_org) throw new NotFoundException('organization not found');
      return {
        organization: find_org,
        invites: find_invites.filter(item=> item.status == 'pending'),
      };
    } catch (error) {
      console.log(error);
      return error;
    }
  }

  async getUsersByOrganizationAndGroup(
    organization_id: string,
    group_id: string,
  ) {
    try {
      const find_org = await this.orgRepository.findOne({
        relations: ['creator', 'groups.users'],
        where: {
          id: organization_id,
          groups: {
            id: group_id,
          },
        },
      });
      if (!find_org) throw new NotFoundException('organization not found');
      const find_invites = await this.inviteRepository.find({
        relations:['sender'],
        where: {
          organization: {
            id: organization_id,
          },
          group: {
            id: group_id
          },
          status:'pending'
        },
      });

      return {
        organization: {...find_org, group_name:find_org.groups[0].name},
        invites:  find_invites,
      };
    } catch (error) {
      console.log(error);
      return error;
    }
  }
}
