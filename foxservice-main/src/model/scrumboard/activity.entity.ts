import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm'

import { CardEntity } from '.'
import { OrganizationEntity, UserEntity } from '../organization'

@Entity({ name: 'card_activity' })
export class CardActivityEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ nullable: false })
  message: string

  @Column({ nullable: false, default:'comment' })
  type: string

  @Column({ nullable: false, default:'' })
  idMember: string

  @Column({ nullable: false })
  time: Date

  @ManyToOne(() => CardEntity, (card) => card.activities)
  card: CardEntity

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date

  @ManyToOne(() => OrganizationEntity)
  @JoinColumn()
  organization: OrganizationEntity

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'created_by' })
  createdBy: UserEntity
}
