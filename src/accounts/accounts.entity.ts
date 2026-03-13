import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Account {
  @PrimaryGeneratedColumn()
  accountId: number;

  @Column({ unique: false })
  name: string;

  @Column()
  creator: string;

  @Column({ default: 4 })
  maxAccountSize: number;

  @Column({ default: () => 'CURRENT_TIMESTAMP' })
  dateCreation: Date;
}
