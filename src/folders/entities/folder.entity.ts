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
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { v4 as uuidv4 } from 'uuid';
import { File } from 'src/files/entities/file.entity';
import { Room } from 'src/rooms/entities/room.entity';
@Entity()
export class Folder {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: false })
  name: string;

  @Column({ nullable: false })
  display_name: string;

  @ManyToOne(() => Folder, { nullable: true, onDelete: 'CASCADE' })
  parentFolder: Folder;

  @Column({ nullable: true })
  parent_folder_id: string;

  @Column({ nullable: true, default: false })
  is_deleted: boolean;

  @Column({ nullable: true, default: false })
  this_deleted: boolean;

  @Column({ nullable: true, default: false })
  is_partial_restored: boolean;

  @Column({ nullable: false })
  tree_index: string;

  @Column({ nullable: true })
  color: string;

  @Column({ nullable: false })
  display_tree_index: string;

  @Column({ nullable: false })
  absolute_path: string;

  @Column({ nullable: false })
  absolute_path_ids: string;

  @OneToMany(() => Folder, (Folder) => Folder.parentFolder)
  sub_folders: Folder[];

  @OneToMany(() => File, (file) => file.folder, { onDelete: 'CASCADE' })
  files: File[];

  @ManyToMany(() => User, (user) => user.folders, )
  users: User[];

  @ManyToOne(() => Room, (room) => room.files, {onDelete:"CASCADE"})
  @JoinColumn()
  room: Room;

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt: Date;

  @BeforeInsert()
  addId() {
    this.id = uuidv4();
  }
}
