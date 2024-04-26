import { Entity, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, UpdateDateColumn, JoinTable, Column } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { User } from '../../users/entities/user.entity';
import { Group } from 'src/groups/entities/group.entity';
import { Organization } from 'src/organizations/entities/organization.entity';

@Entity()
export class Invite {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, (user) => user.sent_invites)
  @JoinTable()
  sender: User;

  @ManyToOne(() => Group, (group) => group.invites)
  @JoinTable()
  group: Group;

  @ManyToOne(() => Organization, (organization) => organization.invites, {onDelete:'CASCADE'})
  @JoinTable()
  organization: Organization;

  @Column({ nullable: true })
  sent_to: string;

  @Column({ default: 'pending' })
  status: string;

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt: Date;

  constructor() {
    this.id = uuidv4();
  }
}
