import {
  Entity,
  PrimaryGeneratedColumn,
  BeforeInsert,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Column,
} from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { File } from 'src/files/entities/file.entity';
import { User } from 'src/users/entities/user.entity';
import { Group } from 'src/groups/entities/group.entity';
import { Room } from 'src/rooms/entities/room.entity';

@Entity()
export class AuditLogs {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: false })
  type: string;

  @ManyToOne(() => User, (user) => user.audit_log)
  @JoinColumn()
  user: User;

  @ManyToOne(() => Group, (group) => group.audit_log, {onDelete:'CASCADE'})
  @JoinColumn()
  group: Group;

  @ManyToOne(() => Room, (room) => room.audit_log)
  @JoinColumn()
  room: Room;

  @ManyToOne(() => File, { nullable: true })
  @JoinColumn()
  file: File;

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt: Date;

  @BeforeInsert()
  addId() {
    this.id = uuidv4();
  }
}
