import {
  Entity,
  PrimaryGeneratedColumn,
  BeforeInsert,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { FilesPermissions } from 'src/files-permissions/entities/files-permissions.entity';
import { v4 as uuidv4 } from 'uuid';
import { Group } from 'src/groups/entities/group.entity';

@Entity()
export class GroupFilesPermissions {
  @PrimaryGeneratedColumn('uuid')
  id: number;

  @ManyToOne(() => Group, (group) => group.group_files_permissions)
  @JoinColumn()
  group: Group;

  @ManyToOne(
    () => FilesPermissions,
    (filePermission) => filePermission.group_files_permissions,
  )
  @JoinColumn()
  file_permission: FilesPermissions;

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt: Date;

  @BeforeInsert()
  addId() {
    this.id = uuidv4();
  }
}
