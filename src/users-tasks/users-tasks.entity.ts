import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { Tasks } from 'src/tasks/tasks.entity';
import { Users } from 'src/users/user.entity';

@Entity('users-tasks')
export class UsersTasks {
  @PrimaryColumn()
  userId!: number;

  @PrimaryColumn()
  tasksId!: number;

  @ManyToOne(() => Tasks, (task) => task.usersTasks, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tasksId' })
  task!: Tasks;

  @ManyToOne(() => Users, (user) => user.usersTasks, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: Users;

  @Column({ default: false })
  invitation!: boolean;

  @Column({ default: false })
  validated!: boolean;

  @Column({ nullable: true })
  validationProofUrl!: string;

  @Column({ nullable: true })
  steps!: number;
}