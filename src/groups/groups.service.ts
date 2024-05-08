import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Group } from './entities/group.entity';
import { Repository } from 'typeorm';
import { User } from 'src/users/entities/user.entity';
import { Organization } from 'src/organizations/entities/organization.entity';
import { EmailService } from 'src/email/email.service';
import { inviteTemplate } from 'src/utils/email.templates';
import { FilesService } from 'src/files/files.service';
import { GroupFilesPermissionsService } from 'src/group-files-permissions/group-files-permissions.service';
import { FilesPermissionsService } from 'src/files-permissions/file-permissions.service';
import { UserRoleEnum } from 'src/types/enums';
@Injectable()
export class GroupsService {
  constructor(
    @InjectRepository(Group)
    private readonly groupsRepository: Repository<Group>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Organization)
    private readonly orgRepository: Repository<Organization>,

    private readonly fileService: FilesService,
    private readonly gfpService: GroupFilesPermissionsService,
    private readonly filePermissionService: FilesPermissionsService,
    private readonly emailService: EmailService,
  ) {}

  async create(name: string, user_id: string, organization_id: string) {
    try {
      // console.log(user_id, 'user id');
      if (!name || !user_id || !organization_id)
        throw new NotFoundException('Missing Fields');
      const group = await this.groupsRepository.findOne({
        where: {
          name: name,
        },
      });
      if (group)
        throw new ConflictException('group already exists with same name');
      const find_user = await this.userRepository.findOne({
        where: {
          id: user_id,
        },
      });
      if (!find_user) throw new NotFoundException('user not found');
      const findOrg = await this.orgRepository.findOne({
        where: {
          id: organization_id,
        },
      });
      const new_group = this.groupsRepository.create({
        name,
        created_by: find_user,
        organization: findOrg,
      });

      const find_files =
        await this.fileService.getAllFilesByOrganization(organization_id);

      // const files_ids = find_files.map((files) => files.id);

      // const find_file_permissions = await this.fpRepository.find({
      //   where: {
      //     file: In(files_ids),
      //   },
      // });

      const new_file_permissions = [];

      for (let index = 0; index < find_files.length; index++) {
        const element = find_files[index];
        new_file_permissions.push(
          await this.filePermissionService.createFilePermissions(element),
        );
      }
      // console.log(new_file_permissions.flat(), 'neww fppp');
      const saved_group = await this.groupsRepository.save(new_group);
      await this.gfpService.createGroupFilePermissionsForOneGroup(
        saved_group,
        new_file_permissions.flat(),
      );
      return saved_group;
    } catch (error) {
      console.log(error, 'err');
      throw Error(error);
    }
  }

  async addUserToAGroup(
    group_id: string,
    user_id: string,
    sender_name: string,
  ) {
    try {
      if (!group_id || !user_id || !sender_name)
        throw new NotFoundException('Missing Fields');
      const find_group = await this.groupsRepository.findOne({
        relations: ['users'],
        where: {
          id: group_id,
        },
      });

      const find_org = await this.orgRepository.findOne({
        relations: ['users'],
        where: {
          groups: {
            id: group_id,
          },
        },
      });

      if (!find_group) throw new NotFoundException('group not found');
      const find_user = await this.userRepository.findOne({
        relations: ['organizations_added_in'],
        where: {
          id: user_id,
        },
      });
      if (!find_user) throw new NotFoundException('user not found');
      const userExistsInGroup = find_group.users.some(
        (existingUser) => existingUser.id === find_user.id,
      );
      if (userExistsInGroup) return;
      const link = `${process.env.FE_HOST}/dashboard/${find_org.id}`;
      const mail = {
        to: find_user.email,
        subject: 'Invited to LockRoom',
        from:
          String(process.env.VERIFIED_SENDER_EMAIL) || 'waleed@lockroom.com',
        text: 'Hello',
        html: inviteTemplate(sender_name, link, 'View Organization'),
      };
      // throw new ConflictException('user already exists group');
      find_group.users.push(find_user);
      find_user.organizations_added_in.push(find_org);
      await this.userRepository.save(find_user);
      await this.emailService.send(mail);
      return await this.groupsRepository.save(find_group);
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async removeUserFromGroup(group_id: string, user_id: string) {
    const group = await this.groupsRepository.findOne({
      relations: ['users'],
      where: {
        id: group_id,
      },
    });
    const user = await this.userRepository.findOne({
      where: {
        id: user_id,
      },
    });
    console.log(group.users);
    const userIndex = group.users.findIndex(
      (existingUser) => existingUser.id === user.id,
    );
    // console.log(userIndex,'indexxx')
    if (userIndex == -1) throw new ConflictException('user not in the group');
    group.users.splice(userIndex, 1);
    return await this.groupsRepository.save(group);
  }

  async findAll() {
    return await this.groupsRepository.find();
  }

  async findAllUsersInGroup(id: string) {
    try {
      return await this.groupsRepository.findOne({
        relations: ['users'],
        where: {
          id,
        },
      });
    } catch (error) {}
  }

  async findOne(id: string) {
    try {
      return await this.groupsRepository.findOne({
        where: {
          id,
        },
        relations: ['users'],
      });
    } catch (error) {}
  }

  async getGroupsByOrganization(organization_id: string, user_id: string) {
    try {
      if (!organization_id || !user_id)
        throw new NotFoundException('Missing Fields');
      const groups_result = [];
      const find_groups = await this.groupsRepository.find({
        relations: ['users', 'organization.creator'],
        where: {
          organization: {
            id: organization_id,
          },
        },
      });

      find_groups.map((group) => {
        if (
          group.organization.creator &&
          group.organization.creator.id == user_id
        ) {
          groups_result.push(group);
        } else if (group.users.find((user) => user.id == user_id)) {
          groups_result.push(group);
        }
      });

      return groups_result.sort(
        (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
      );
    } catch (error) {
      console.log(error, 'in group org');
    }
  }

  async getGroupsByOrg(organization_id: string) {
    return this.groupsRepository.find({
      where: {
        organization: {
          id: organization_id,
        },
      },
    });
  }

  async switchUser(
    guest_user_id: string,
    new_group_id: string,
    old_group_id: string,
  ) {
    await this.removeUserFromGroup(old_group_id, guest_user_id);
    const find_new_group = await this.groupsRepository.findOne({
      relations: ['users'],
      where: {
        id: new_group_id,
      },
    });
    const find_user = await this.userRepository.findOne({
      relations: ['organizations_added_in'],
      where: {
        id: guest_user_id,
      },
    });
    find_new_group.users.push(find_user);
    return await this.groupsRepository.save(find_new_group);
  }

  async updateUserRoleAndChangeGroup(
    user_id: string,
    user_role: UserRoleEnum,
    old_group_id: string,
  ) {
    const update_user = await this.userRepository.update(
      {
        id: user_id,
      },
      {
        role: user_role,
      },
    );
    if (update_user.affected > 0) {
      const find_admin_group = await this.groupsRepository.findOne({
        where: {
          name: 'Admin',
        },
      });
      const addUserToAdminGroup = await this.switchUser(
        user_id,
        find_admin_group.id,
        old_group_id,
      );
      if (addUserToAdminGroup) {
        return {
          group: addUserToAdminGroup,
        };
      }
    }
  }
}
