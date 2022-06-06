import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm'

import { OrganizationEntity, UserEntity } from '../organization'
import { NotificationUserEntity } from '.'
@Entity({ name: 'notification' })
export class NotificationEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ nullable: false })
  title: string

  @Column({ nullable: false })
  body: string

  @Column({ nullable: true })
  data: string

  @OneToMany(
    (type) => NotificationUserEntity,
    (notificationUser) => notificationUser.notification,
  )
  notificationUser: NotificationUserEntity[]

  @ManyToOne(() => OrganizationEntity)
  @JoinColumn()
  organization: OrganizationEntity

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'created_by' })
  createdBy: UserEntity
}
