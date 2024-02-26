import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  BeforeInsert,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany, 
  ManyToOne
} from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { User } from '../../users/entities/user.entity';
import { Invite } from 'src/invites/entities/invite.entity';
@Entity()
export class Group {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: false })
  name: string;

  @ManyToOne(() => User, user => user.createdGroups)
  createdBy: User;

  @OneToMany(() => User, user => user.group)
  users: User[];

  @OneToMany(() => Invite, (invite) => invite.group)
  invites: Invite[]; 

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt: Date;

  @BeforeInsert()
  addId() {
    this.id = uuidv4();
  }
}
