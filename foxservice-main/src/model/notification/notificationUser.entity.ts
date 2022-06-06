import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm'

import { OrganizationEntity, UserEntity } from '../organization'
import { NotificationEntity } from './'
@Entity({ name: 'notification_user' })
export class NotificationUserEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @ManyToOne(() => NotificationEntity)
  @JoinColumn()
  notification: NotificationEntity

  @ManyToOne(() => UserEntity)
  @JoinColumn()
  user: UserEntity

  @Column({ default: false, name: 'is_read' })
  isRead: boolean

  @ManyToOne(() => OrganizationEntity)
  @JoinColumn()
  organization: OrganizationEntity

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'created_by' })
  createdBy: UserEntity

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'updated_by' })
  updatedBy: UserEntity
}
