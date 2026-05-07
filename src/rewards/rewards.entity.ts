import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Tasks } from 'src/tasks/tasks.entity';
import { Partners } from 'src/partners/partners.entity';

@Entity()
export class Rewards {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({})
  title!: string;

  @Column({})
  description!: string;

  @OneToMany(() => Tasks, (task) => task.reward, { nullable: false })
  tasks!: Tasks[];

  @OneToMany(() => Partners, (partner) => partner.reward, { nullable: false })
  partners!: Partners[];
}
