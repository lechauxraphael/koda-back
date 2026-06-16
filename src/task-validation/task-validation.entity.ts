import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { Users } from '../users/user.entity';
import { Tasks } from '../tasks/tasks.entity';

@Entity()
export class TaskValidation {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Tasks, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'taskId' })
  task!: Tasks;

  @ManyToOne(() => Users, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'requesterId' })
  requester!: Users; // celui qui demande la validation

  @ManyToOne(() => Users, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'voterId' })
  voter!: Users; // celui qui vote

  @Column() // 'yes' | 'no'
  vote!: string;

  @Column({ default: false })
  resolved!: boolean; // true quand la journée est terminée

  @Column({ type: 'date', nullable: true })
  validationDate!: Date | null; // la date du jour de la demande

  @CreateDateColumn()
  createdAt!: Date;
}