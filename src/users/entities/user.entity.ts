import { Entity, Column, PrimaryGeneratedColumn, BeforeInsert, ManyToMany, JoinTable, CreateDateColumn, ManyToOne,  OneToMany, UpdateDateColumn } from 'typeorm';
import { Folder } from '../../folders/entities/folder.entity';
import { v4 as uuidv4 } from 'uuid';
import { Invite } from '../../invites/entities/invite.entity';
import { Group } from '../..//groups/entities/group.entity';
@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  sub: string;

  @Column({ nullable: true })
  family_name: string;

  @Column({ nullable: true })
  given_name: string;

  @Column({ nullable: true })
  full_name: string;

  @Column({ nullable: true })
  nickname: string;

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
  sso_type: boolean;

  @Column({ default: '' })
  display_picture_url: string;

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt: Date;

  @ManyToMany(() => Folder, folder => folder.users)
  @JoinTable()
  folders: Folder[];

  @ManyToOne(()=> Group, group => group.users)
  group: Group;

  @OneToMany(() => Invite, (invite) => invite.sender)
  @JoinTable()
  sent_invites: Invite[];

  @BeforeInsert()
  addId() {
    this.id = uuidv4();
  }
}
