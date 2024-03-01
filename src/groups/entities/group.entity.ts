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
  JoinTable
} from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { User } from '../../users/entities/user.entity';
import { Invite } from 'src/invites/entities/invite.entity';
import { Organization } from 'src/organizations/entities/organization.entity';
@Entity()
export class Group {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: false })
  name: string;

  @ManyToOne(() => User, (user) => user.createdGroups)
  createdBy: User;

  @ManyToMany(() => User, (user) => user.groups)
  users: User[]

  @OneToMany(() => Invite, (invite) => invite.group)
  invites: Invite[];

  @ManyToOne(() => Organization, (organization) => organization.groups, { onDelete:'CASCADE'})
  organization: Organization;

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt: Date;

  @BeforeInsert()
  addId() {
    this.id = uuidv4();
  }
}
