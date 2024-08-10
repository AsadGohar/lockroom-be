import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  CreateDateColumn,
  UpdateDateColumn,
  BeforeInsert,
  JoinColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { User } from 'src/users/entities/user.entity';
import { v4 as uuidv4 } from 'uuid';
import { Room } from 'src/rooms/entities/room.entity';
import { SubscriptionPlans } from 'src/subscription-plans/entities/subscription-plan.entity';

@Entity()
export class Organization {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  name: string;

  @OneToMany(() => Room, (room) => room.organization, {
    onDelete: 'CASCADE',
  })
  rooms: Room[];

  @Column({ nullable: true })
  subscription_start_date: Date;

  @Column({ nullable: true })
  subscription_end_date: Date;

  @OneToMany(() => User, (user) => user.organization, {
    onDelete: 'CASCADE',
  })
  users: User[];

  @OneToOne(() => User, (user) => user.organization_created)
  @JoinColumn()
  creator: User;

  @ManyToOne(() => SubscriptionPlans, (subscription) => subscription.organization)
  subscription: SubscriptionPlans;

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt: Date;

  @BeforeInsert()
  addId() {
    this.id = uuidv4();
  }
}
