import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  ManyToOne,
  ManyToMany,
  BeforeInsert,
  CreateDateColumn,
  UpdateDateColumn
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { v4 as uuidv4 } from 'uuid';

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

  @OneToMany(() => Folder, (Folder) => Folder.parentFolder)
  subFolders: Folder[];

  @ManyToMany(() => User, (user) => user.folders)
  users: User[];

  @Column({ nullable: false })
  tree_index: number;

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt: Date;

  @BeforeInsert()
  addId() {
    this.id = uuidv4();
  }
}
