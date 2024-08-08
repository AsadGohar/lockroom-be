import {
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  UpdateDateColumn,
  JoinTable,
  Column,
} from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { User } from '../../users/entities/user.entity';
import { Group } from 'src/groups/entities/group.entity';
import { Organization } from 'src/organizations/entities/organization.entity';
import { Room } from 'src/rooms/entities/room.entity';

@Entity()
export class Invite {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, (user) => user.sent_invites)
  @JoinTable()
  sender: User;

  @ManyToOne(() => Group, (group) => group.invites, {onDelete:'CASCADE'})
  @JoinTable()
  group: Group;

  @ManyToOne(() => Room, (room) => room.invites, {
    onDelete: 'CASCADE',
  })
  @JoinTable()
  room: Room;

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
