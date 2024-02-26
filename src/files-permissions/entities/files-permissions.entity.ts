import { Entity, PrimaryGeneratedColumn, ManyToOne } from 'typeorm';
import { Permission } from '../../permission/entities/permission.entity';
import { File } from '../../files/entities/file.entity';

@Entity()
export class FilesPermissions {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => File, (file) => file.FilesPermissions)
  file: File;

  @ManyToOne(() => Permission, (permission) => permission.FilesPermissions)
  permission: Permission;
}
