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
import { sendEmailUtil } from 'src/utils/email.utils';
import { inviteTemplate } from 'src/utils/email.templates';
import { FilesService } from 'src/files/files.service';
import { FilesPermissionsService } from 'src/files-permissions/file-permissions.service';
import { FilesPermissions } from 'src/files-permissions/entities/files-permissions.entity';
import { In } from 'typeorm';
import { GroupFilesPermissionsService } from 'src/group-files-permissions/group-files-permissions.service';
@Injectable()
export class GroupsService {
  constructor(
    @InjectRepository(Group)
    private readonly groupsRepository: Repository<Group>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    @InjectRepository(Organization)
    private readonly orgRepository: Repository<Organization>,

    @InjectRepository(FilesPermissions)
    private readonly fpRepository: Repository<FilesPermissions>,
    private readonly fileService: FilesService,
    private readonly gfpService: GroupFilesPermissionsService,
  ) {}

  async create(name: string, user_id: string, organization_id: string) {
    try {
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
        createdBy: find_user,
        organization: findOrg,
      });

      const find_files =
        await this.fileService.getAllFilesByOrganization(organization_id);
      const files_ids = find_files.map((files) => files.id);

      const find_file_permissions = await this.fpRepository.find({
        where: {
          file: In(files_ids),
        },
      });
      const saved_group = await this.groupsRepository.save(new_group);
      const new_group_file_permissions =
        await this.gfpService.createGroupFilePermissionsForOneGroup(
          saved_group,
          find_file_permissions,
        );
      console.log(new_group_file_permissions);
      return saved_group
    } catch (error) {
      console.log(error, 'err');
    }
  }

  async addUserToAGroup(groupId: string, user_id: string, sender_name: string) {
    try {
      const find_group = await this.groupsRepository.findOne({
        relations: ['users'],
        where: {
          id: groupId,
        },
      });

      const find_org = await this.orgRepository.findOne({
        relations: ['users'],
        where: {
          groups: {
            id: groupId,
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
      // console.log('find user in grp', find_user)
      if (!find_user) throw new NotFoundException('user not found');
      const userExistsInGroup = find_group.users.some(
        (existingUser) => existingUser.id === find_user.id,
      );
      // console.log('gere', find_group.name, find_org.name )
      if (userExistsInGroup) return;
      const link = `${process.env.FE_HOST}/dashboard/${find_org.id}`;
      // console.log('should not reach this');
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
      await sendEmailUtil(mail);
      return await this.groupsRepository.save(find_group);
    } catch (error) {
      console.log(error);
    }
  }

  async removeUserFromGroup(groupId: string, user_id: string) {
    const group = await this.groupsRepository.findOne({
      relations: ['users'],
      where: {
        id: groupId,
      },
    });
    const user = await this.userRepository.findOne({
      where: {
        id: user_id,
      },
    });
    const userIndex = group.users.findIndex(
      (existingUser) => existingUser.id === user.id,
    );
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
      // console.log('hello');
      //   const groups = await this.groupsRepository.createQueryBuilder("group")
      // .leftJoinAndSelect("group.organization", "organization")
      // .leftJoinAndSelect("group.users", "user")
      // .where("organization.creator.id = :id", { id: user_id })
      // .where("users.id = :id", { id: user_id })
      // .getManyAndCount()

      // console.log(groups,'grouuuup')

      const groups_result = [];

      // const query = this.groupsRepository
      //   .createQueryBuilder('group')
      //   .leftJoinAndSelect('group.organization', 'organization')
      //   .leftJoinAndSelect('group.createdBy', 'createdBy')
      //   .leftJoinAndSelect('group.users', 'users');

      // const find_user = await this.userRepository.findOne({
      //   where: {
      //     id: user_id,
      //   },
      // });

      const find_groups = await this.groupsRepository.find({
        relations: ['users', 'organization.creator'],
        where: {
          organization: {
            id: organization_id,
          },
        },
      });

      // console.log(find_groups,'finnn')
      find_groups.map((group) => {
        // console.log(group.users, 'user');
        if (
          group.organization.creator &&
          group.organization.creator.id == user_id
        ) {
          // console.log('now');
          groups_result.push(group);
        } else if (group.users.find((user) => user.id == user_id)) {
          groups_result.push(group);
        }
        // console.log(group.users.find((user) => user.id == user_id),'hehe', group.name)
      });

      return groups_result.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())

      // if (find_group.o === 'admin') {
      //   // Case 1: If the user is an admin (organization creator)
      //   query.where('organization.creator = :userId', { userId: user.id });
      // } else {
      //   // Case 2: If the user is not an admin
      //   query
      //     .andWhere(
      //       '(organization.creator != :userId OR organization.creator IS NULL)',
      //       { userId: user.id },
      //     )
      //     .orWhere('users.id = :userId', { userId: user.id });
      // }

      // const groups = await query.getMany();
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

  update(id: number) {
    return `This action updates a #${id} group`;
  }

  remove(id: number) {
    return `This action removes a #${id} group`;
  }
}
