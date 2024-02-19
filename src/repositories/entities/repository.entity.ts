import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Unique,
  OneToMany,
  ManyToOne,
  ManyToMany,
  BeforeInsert,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { v4 as uuidv4 } from 'uuid';

@Entity()
export class Repository {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: false })
  name: string;

  @ManyToOne(() => Repository, { nullable: true, onDelete: 'CASCADE' })
  parentRepository: Repository;

  @Column({ nullable: true })
  parentRepositoryId: string;

  @Column({ nullable: true, default: false })
  is_deleted: boolean;

  @OneToMany(() => Repository, (repository) => repository.parentRepository)
  subrepositories: Repository[];

  @ManyToMany(() => User, (user) => user.repositories)
  users: User[];

  @Column({ nullable: false })
  tree_index: number;

  @BeforeInsert()
  addId() {
    this.id = uuidv4();
  }
}
