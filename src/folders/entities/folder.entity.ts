import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  ManyToOne,
  ManyToMany,
  BeforeInsert,
  CreateDateColumn,
  UpdateDateColumn,
  JoinTable
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { v4 as uuidv4 } from 'uuid';
import { Permission } from '../../permission/entities/permission.entity';
import { Group } from '../../groups/entities/group.entity';
@Entity()
export class Folder {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: false })
  name: string;

  @ManyToOne(() => Folder, { nullable: true, onDelete: 'CASCADE' })
  parentFolder: Folder;

  @Column({ nullable: true })
  parentFolderId: string;

  @Column({ nullable: true, default: false })
  is_deleted: boolean;
  
  @Column({ nullable: false })
  tree_index: string;

  @ManyToOne(() => Group, group => group.folders)
  group: Group;

  @ManyToMany(() => Permission, permission => permission.folders)
  @JoinTable()
  permissions: Permission[];

  @OneToMany(() => Folder, (Folder) => Folder.parentFolder)
  sub_folders: Folder[];

  @ManyToMany(() => User, (user) => user.folders)
  users: User[]
  
  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt: Date;

  @BeforeInsert()
  addId() {
    this.id = uuidv4();
  }
}
