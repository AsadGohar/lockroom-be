import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  BeforeInsert,
  ManyToMany,
  JoinTable,
  CreateDateColumn,
  ManyToOne,
  OneToMany,
  UpdateDateColumn,
  OneToOne,
  JoinColumn
} from 'typeorm';
import { Folder } from '../../folders/entities/folder.entity';
import { v4 as uuidv4 } from 'uuid';
import { Invite } from '../../invites/entities/invite.entity';
import { Group } from '../..//groups/entities/group.entity';
import { File } from 'src/files/entities/file.entity';
import { Organization } from 'src/organizations/entities/organization.entity';
import { AuditLogs } from 'src/audit-logs/entities/audit-logs.entities';

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: false })
  first_name: string;

  @Column({ nullable: true })
  last_name: string;

  @Column({ nullable: true })
  full_name: string;

  @Column({ unique: true })
  email: string;

  @Column({ default: false })
  is_email_verified: boolean;

  @Column({ default: false })
  is_session_active: boolean;

  @Column({ default: 'admin' })
  role: string;

  @Column({ default: false })
  sso_login: boolean;

  @Column({ default: false })
  sso_type: string;

  @Column({ default: '' })
  display_picture_url: string;

  @Column({ default: '' })
  password: string;

  @Column({ default: '' })
  phone_number: string;

  @Column({ default: '' })
  generated_otp: string;

  @OneToOne(() => Organization, (organisation) => organisation.creator)
  organization_created: Organization;

  @ManyToMany(() => Organization, (organisation) => organisation.users, {
    cascade:true
  })
  @JoinTable()
  organizations_added_in: Organization[];

  @OneToMany(() => Group, (group) => group.createdBy)
  createdGroups: Group[];

  @ManyToMany(() => Folder, (folder) => folder.users)
  @JoinTable()
  folders: Folder[];

  @ManyToMany(() => Group, (group) => group.users, {
    onDelete: 'CASCADE',
  })
  @JoinTable()
  groups: Group[];

  @OneToMany(() => Invite, (invite) => invite.sender)
  @JoinTable()
  sent_invites: Invite[];

  @OneToMany(() => File, (file) => file.user)
  files: File[];

  @OneToMany(() => AuditLogs, auditLog => auditLog.user)
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
