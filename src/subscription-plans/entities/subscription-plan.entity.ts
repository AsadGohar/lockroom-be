import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  BeforeInsert,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany
} from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { SubscriptionTypeEnum } from 'src/types/enums';
import { User } from 'src/users/entities/user.entity';
@Entity()
export class SubscriptionPlans {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'enum', enum: SubscriptionTypeEnum, default: SubscriptionTypeEnum.TRIAL })
  type: string;

  @Column()
  days: number;

  @Column()
  price: number;

  @OneToMany(() => User, user => user.subscription)
  user: User;

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt: Date;

  @BeforeInsert()
  addId() {
    this.id = uuidv4();
  }
}
