import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  ManyToOne,
  BeforeInsert,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { v4 as uuidv4 } from 'uuid';
import { Folder } from 'src/folders/entities/folder.entity';
import { FilesPermissions } from 'src/files-permissions/entities/files-permissions.entity';
import { AuditLogs } from 'src/audit-logs/entities/audit-logs.entities';
import { FileVersion } from 'src/file-version/entities/file-version.entity';
import { Room } from 'src/rooms/entities/room.entity';

@Entity()
export class File {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: false })
  name: string;

  @Column({ nullable: true })
  file_uploaded_name: string;

  @Column({ nullable: true })
  original_name: string;

  @Column({ nullable: true, default: false })
  is_deleted: boolean;

  @Column({ nullable: true })
  this_deleted: boolean;

  @Column({ nullable: true })
  mime_type: string;

  @Column({ nullable: true })
  size_bytes: number;

  @Column({ nullable: false })
  tree_index: string;

  @Column({ nullable: false })
  display_tree_index: string;

  @Column({ nullable: false })
  absolute_path_ids: string;

  @Column({ nullable: true })
  extension: string;

  @ManyToOne(() => User, (user) => user.files)
  user: User;

  @OneToMany(() => FilesPermissions, (fp) => fp.permission)
  @JoinColumn()
  FilesPermissions: FilesPermissions[];

  @ManyToOne(() => Room, (room) => room.files)
  @JoinColumn()
  room: Room;

  @ManyToOne(() => AuditLogs, (auditLogs) => auditLogs.file)
  @JoinColumn()
  audit_log: AuditLogs;

  @Column({ nullable: true, type: 'int' })
  current_version_id: number | null;

  @ManyToOne(() => Folder, (folder) => folder.files, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  folder: Folder;

  @OneToMany(() => FileVersion, (fileVersion) => fileVersion.file, {
    cascade: true,
  })
  versions: FileVersion[];

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt: Date;

  @BeforeInsert()
  addId() {
    this.id = uuidv4();
  }
}
