import { Entity, PrimaryGeneratedColumn, BeforeInsert,ManyToOne, JoinColumn } from 'typeorm';
import { FilesPermissions } from 'src/files-permissions/entities/files-permissions.entity';
import { v4 as uuidv4 } from 'uuid';
import { Group } from 'src/groups/entities/group.entity';

@Entity()
export class GroupFilesPermissions {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Group, (group) => group.group_files_permissions)
  @JoinColumn()
  group: Group;

  @ManyToOne(() => FilesPermissions, (filePermission) => filePermission.group_files_permissions)
  @JoinColumn()
  file_permission: FilesPermissions;

 @BeforeInsert()
  addId() {
    this.id = uuidv4();
  }
}
