import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  BeforeInsert,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToOne,
  ManyToMany,
} from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { User } from '../../users/entities/user.entity';
import { Invite } from 'src/invites/entities/invite.entity';
import { GroupFilesPermissions } from 'src/group-files-permissions/entities/group-files-permissions.entity';
import { AuditLogs } from 'src/audit-logs/entities/audit-logs.entities';
import { Room } from 'src/rooms/entities/room.entity';

@Entity()
export class Group {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: false })
  name: string;

  @ManyToOne(() => User, (user) => user.created_groups)
  created_by: User;

  @ManyToMany(() => User, (user) => user.groups, { cascade: true })
  users: User[];

  @OneToMany(() => Invite, (invite) => invite.group)
  invites: Invite[];

  @ManyToOne(() => Room, (room) => room.groups, {
    onDelete: 'CASCADE',
  })
  room: Room;

  @OneToMany(
    () => GroupFilesPermissions,
    (groupFilesPermissions) => groupFilesPermissions.group,
  )
  group_files_permissions: GroupFilesPermissions[];

  @OneToMany(() => AuditLogs, (auditLog) => auditLog.room, { cascade: true })
  audit_log: AuditLogs[];

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt: Date;

  @BeforeInsert()
  addId() {
    this.id = uuidv4();
  }
}
