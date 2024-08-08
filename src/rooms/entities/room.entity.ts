import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  OneToOne,
  CreateDateColumn,
  UpdateDateColumn,
  BeforeInsert,
  JoinColumn,
  ManyToMany,
  ManyToOne
} from 'typeorm';
import { User } from 'src/users/entities/user.entity';
import { Group } from 'src/groups/entities/group.entity';
import { Invite } from 'src/invites/entities/invite.entity';
import { v4 as uuidv4 } from 'uuid';
import { File } from 'src/files/entities/file.entity';
import { Folder } from 'src/folders/entities/folder.entity';
import { AuditLogs } from 'src/audit-logs/entities/audit-logs.entities';
import { Organization } from 'src/organizations/entities/organization.entity';

@Entity()
export class Room {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  name: string;

  @OneToMany(() => Group, (group) => group.room, {
    nullable: true,
    cascade: true,
  })
  groups: Group[];

  @ManyToOne(() => Organization, (organization) => organization.rooms, {
    nullable: true,
    cascade: true,
  })
  organization: Organization;

  @OneToMany(() => Invite, (invite) => invite.room, {
    nullable: true,
    cascade: true,
  })
  invites: Invite[];

  @OneToMany(() => File, (file) => file.room)
  files: File[];

  @OneToMany(() => Folder, (folder) => folder.room)
  folder: Folder[];

  @OneToMany(() => AuditLogs, (auditLog) => auditLog.room,{
    nullable:true
  })
  audit_log: AuditLogs[];

  @OneToMany(() => User, (user) => user.room)
  users: User[];

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt: Date;

  @BeforeInsert()
  addId() {
    this.id = uuidv4();
  }
}
