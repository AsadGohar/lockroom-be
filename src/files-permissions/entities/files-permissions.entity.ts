import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  BeforeInsert,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Permission } from '../../permission/entities/permission.entity';
import { File } from '../../files/entities/file.entity';
import { v4 as uuidv4 } from 'uuid';
import { GroupFilesPermissions } from 'src/group-files-permissions/entities/group-files-permissions.entity';
@Entity()
export class FilesPermissions {
  @PrimaryGeneratedColumn('uuid')
  id: number;

  @ManyToOne(() => File, (file) => file.FilesPermissions, {
    onDelete: 'CASCADE',
  })
  file: File;

  @ManyToOne(() => Permission, (permission) => permission.FilesPermissions)
  permission: Permission;

  @OneToMany(
    () => GroupFilesPermissions,
    (groupFilePermission) => groupFilePermission.file_permission,
    { onDelete: 'CASCADE' },
  )
  group_files_permissions: GroupFilesPermissions[];

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt: Date;

  @BeforeInsert()
  addId() {
    this.id = uuidv4();
  }
}
