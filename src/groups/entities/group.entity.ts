import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  BeforeInsert,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne, 
  ManyToMany,
  JoinTable,
  OneToMany
} from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { Folder } from '../../folders/entities/folder.entity';
import { User } from '../..//users/entities/user.entity';
import { Permission } from '../../permission/entities/permission.entity';
Permission

@Entity()
export class Group {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: false })
  name: string;

  @OneToMany(() => Folder, folder => folder.group)
  folders: Folder[];

  @OneToMany(() => User, user => user.group)
  users: User[];

  @ManyToMany(() => Permission, permission => permission.groups)
  @JoinTable()
  permissions: Permission[];

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt: Date;

  @BeforeInsert()
  addId() {
    this.id = uuidv4();
  }
}
