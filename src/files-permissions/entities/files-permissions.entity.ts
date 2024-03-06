import { Entity, PrimaryGeneratedColumn, ManyToOne, BeforeInsert, OneToMany } from 'typeorm';
import { Permission } from '../../permission/entities/permission.entity';
import { File } from '../../files/entities/file.entity';
import { v4 as uuidv4 } from 'uuid';
import { GroupFilesPermissions } from 'src/group-files-permissions/entities/group-files-permissions.entity';
@Entity()
export class FilesPermissions {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => File, (file) => file.FilesPermissions)
  file: File;

  @ManyToOne(() => Permission, (permission) => permission.FilesPermissions)
  permission: Permission;

  @OneToMany(() => GroupFilesPermissions, (groupFilePermission) => groupFilePermission.file_permission)
  group_files_permissions: GroupFilesPermissions[];

  @BeforeInsert()
  addId() {
    this.id = uuidv4();
  }
}
