import {
  Entity,
  PrimaryGeneratedColumn,
  BeforeInsert,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Column
} from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { File } from 'src/files/entities/file.entity';
import { User } from 'src/users/entities/user.entity';

@Entity()
export class AuditLogs {
  @PrimaryGeneratedColumn()
  id: string;

  @Column({ nullable: false })
  type: string;

  @ManyToOne(() => File, (file) => file.audit_log)
  @JoinColumn()
  file: File;

  @ManyToOne(
    () => User,
    (user) => user.audit_log,
  )
  @JoinColumn()
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
