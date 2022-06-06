import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToMany,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm'

import { ChecklistItemEntity, CardEntity } from '.'
import { OrganizationEntity, UserEntity } from '../organization'

// export enum TC_MESSAGE_TYPE {
//   TEXT = 'text',
//   IMAGE = 'image',
// }
@Entity({ name: 'check_list' })
export class ChecklistEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ nullable: false })
  name: string

  @ManyToOne(() => CardEntity, card => card.checklists)
  card: CardEntity

  @OneToMany(() => ChecklistItemEntity, (checklistItem) => checklistItem.checklist)
  checkItems: ChecklistItemEntity[]

  @Column({ nullable: false, default: false, name: 'is_delete' })
  isDelete: boolean

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
