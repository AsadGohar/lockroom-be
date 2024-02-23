import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  BeforeInsert,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinTable,
  ManyToMany
} from 'typeorm';
import { Group } from '../../groups/entities/group.entity';
import { Folder } from '../../folders/entities/folder.entity';
import { v4 as uuidv4 } from 'uuid';

@Entity()
export class Permission {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: false })
  name: string;

  @Column({ nullable: true})
  status: boolean

  @ManyToMany(() => Group, group => group.permissions)
  @JoinTable()
  groups: Group[];

  @ManyToMany(() => Folder, folder => folder.permissions)
  @JoinTable()
  folders: Folder[];

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt: Date;

  @BeforeInsert()
  addId() {
    this.id = uuidv4();
  }
}
