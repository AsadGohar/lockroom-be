import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { File } from 'src/files/entities/file.entity';

@Entity()
export class FileVersion {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 's3_url', type: 'varchar', length: 255 })
  bucket_url: string;

  @Column({
    name: 'created_at',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  createdAt: Date;

  @ManyToOne(() => File, (file) => file.versions)
  @JoinColumn()
  file: File;
}
