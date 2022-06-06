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

@Entity({ name: 'card_attachment' })
export class CardAttachmentEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ nullable: false })
  name: string
  
  @Column({ nullable: false })
  src: string
  
  @Column({ nullable: true })
  time: Number
  
  @Column({ nullable: false, default:'image' })
  type: string

  @ManyToOne(() => CardEntity, card => card.attachments)
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
